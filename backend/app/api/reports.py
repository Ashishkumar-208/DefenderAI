import os
import io
import csv
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, check_role
from app.models.models import User, Report, Threat, Log, Incident
from app.schemas.schemas import ReportResponse
from app.services.pdf_report import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])

REPORTS_DIR = "./reports_files"

@router.get("/generate")
def create_pdf_report_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "analyst"]))
):
    # Ensure reports directory exists
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    # 1. Fetch statistics
    total_logs = db.query(Log).count()
    threats_detected = db.query(Threat).count()
    
    stats = {
        "total_logs": total_logs,
        "threats_detected": threats_detected,
        "critical_alerts": db.query(Threat).filter(Threat.severity == "critical").count(),
        "high_alerts": db.query(Threat).filter(Threat.severity == "high").count(),
        "medium_alerts": db.query(Threat).filter(Threat.severity == "medium").count(),
        "low_alerts": db.query(Threat).filter(Threat.severity == "low").count()
    }
    
    # 2. Fetch recent threats (top 15)
    recent_threats_db = db.query(Threat).order_by(Threat.timestamp.desc()).limit(15).all()
    recent_threats = [
        {
            "source_ip": t.source_ip,
            "threat_type": t.threat_type,
            "severity": t.severity,
            "mitre_technique_id": t.mitre_technique_id
        } for t in recent_threats_db
    ]
    
    # 3. Create PDF file
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"DefenderAI_SOC_Report_{timestamp_str}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)
    
    generate_pdf_report(filepath, stats, recent_threats)
    
    # 4. Save auditing record to DB
    db_report = Report(
        type="PDF",
        title=f"Executive SOC Report - {datetime.date.today()}",
        filepath=filepath,
        generated_by_id=current_user.id
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    # Return File Response
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf"
    )

@router.get("/list")
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [ReportResponse.model_validate(r) for r in reports]

@router.get("/export/{data_type}")
def export_csv(
    data_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "analyst"]))
):
    output = io.StringIO()
    writer = csv.writer(output)
    
    if data_type == "threats":
        threats = db.query(Threat).all()
        writer.writerow(["Threat ID", "Log ID", "Timestamp", "Source IP", "Threat Type", "Severity", "Details", "MITRE ID", "Resolved"])
        for t in threats:
            writer.writerow([t.threat_id, t.log_id, t.timestamp, t.source_ip, t.threat_type, t.severity, t.details, t.mitre_technique_id, t.resolved])
            
    elif data_type == "logs":
        logs = db.query(Log).all()
        writer.writerow(["Log ID", "Timestamp", "Source IP", "Destination IP", "Event Type", "Severity", "Raw Log"])
        for l in logs:
            writer.writerow([l.log_id, l.timestamp, l.source_ip, l.destination_ip, l.event_type, l.severity, l.raw_log.replace('\n', ' ')])
            
    elif data_type == "incidents":
        incidents = db.query(Incident).all()
        writer.writerow(["Incident ID", "Title", "Description", "Severity", "Status", "Assigned Analyst ID", "Created At", "Updated At"])
        for i in incidents:
            writer.writerow([i.incident_id, i.title, i.description, i.severity, i.status, i.assigned_analyst_id, i.created_at, i.updated_at])
            
    else:
        raise HTTPException(status_code=400, detail="Invalid data type. Supported: threats, logs, incidents.")
        
    output.seek(0)
    
    # Create stream response
    filename = f"DefenderAI_export_{data_type}_{datetime.date.today().strftime('%Y%m%d')}.csv"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
