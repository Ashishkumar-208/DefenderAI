import csv
import io
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import get_current_user, check_role
from app.models.models import User, Log, Threat, Notification, Incident
from app.schemas.schemas import LogResponse
from app.services.detection import parse_log_line, detect_threats_for_line, check_brute_force_window

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_log(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "analyst"]))
):
    contents = await file.read()
    raw_log_text = contents.decode("utf-8", errors="ignore")
    
    if not raw_log_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )
        
    lines = raw_log_text.split("\n")
    processed_logs = []
    total_threats_count = 0
    severity_ranks = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    
    for line in lines:
        parsed_meta = parse_log_line(line)
        if not parsed_meta:
            continue
            
        # Create database log record for this line
        db_log = Log(
            timestamp=parsed_meta["timestamp"],
            source_ip=parsed_meta["source_ip"],
            destination_ip=parsed_meta["destination_ip"],
            event_type=parsed_meta["event_type"],
            severity=parsed_meta["severity"],
            raw_log=parsed_meta["raw_log"]
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        processed_logs.append(db_log)
        
        # Check static threat detection rules for this line
        line_threats = detect_threats_for_line(db_log)
        
        if line_threats:
            max_line_severity = "low"
            db_log.event_type = line_threats[0]["threat_type"]
            for t_data in line_threats:
                # Add threat record linked to log
                db_threat = Threat(
                    log_id=db_log.log_id,
                    source_ip=db_log.source_ip,
                    timestamp=db_log.timestamp,
                    threat_type=t_data["threat_type"],
                    severity=t_data["severity"],
                    details=t_data["details"],
                    mitre_technique_id=t_data["mitre_technique_id"],
                    confidence_score=t_data["confidence_score"],
                    resolved=False
                )
                db.add(db_threat)
                total_threats_count += 1
                
                # Check line severity rank
                if severity_ranks.get(t_data["severity"], 1) > severity_ranks.get(max_line_severity, 1):
                    max_line_severity = t_data["severity"]
                    
                # Create Incident & Notification for high/critical threats
                if t_data["severity"] in ["high", "critical"]:
                    # Create Notification
                    notif = Notification(
                        title=f"{t_data['severity'].upper()} Severity Security Alert",
                        message=f"Detected {t_data['threat_type']} exploit from source IP {db_log.source_ip}.",
                        type="threat"
                    )
                    db.add(notif)
                    
                    # Create Incident
                    inc = Incident(
                        title=f"Investigate {t_data['threat_type']} exploit from {db_log.source_ip}",
                        description=f"Log parser flagged a {t_data['severity']} threat event. Line details: {db_log.raw_log}",
                        severity=t_data["severity"],
                        status="Open"
                    )
                    db.add(inc)
                    
            db_log.severity = max_line_severity
            db.commit()
            db.refresh(db_log)
            
    # Run sliding window checks for Brute Force
    brute_force_threats = check_brute_force_window(db, processed_logs)
    total_threats_count += len(brute_force_threats)
    
    # Update severity of logs triggered by brute force
    for bf in brute_force_threats:
        if bf.log_id:
            log_item = db.query(Log).filter(Log.log_id == bf.log_id).first()
            if log_item:
                log_item.severity = "high"
                log_item.event_type = "Brute Force"
                db.commit()

    return {
        "message": f"Log file '{file.filename}' processed successfully.",
        "lines_processed": len(lines),
        "records_created": len(processed_logs),
        "threats_detected": total_threats_count,
    }

@router.get("/list")
def list_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    severity: str = Query(None),
    event_type: str = Query(None)
):
    query = db.query(Log)
    
    if search:
        query = query.filter(
            or_(
                Log.raw_log.like(f"%{search}%"),
                Log.source_ip.like(f"%{search}%"),
                Log.event_type.like(f"%{search}%")
            )
        )
    if severity:
        query = query.filter(Log.severity == severity.lower())
    if event_type:
        query = query.filter(Log.event_type == event_type)
        
    total = query.count()
    logs = query.order_by(Log.timestamp.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": [LogResponse.model_validate(l) for l in logs]
    }

@router.delete("/delete/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin"]))
):
    db_log = db.query(Log).filter(Log.log_id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(db_log)
    db.commit()
    return None

@router.get("/event-types", response_model=list[str])
def get_unique_event_types(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    results = db.query(Log.event_type).distinct().all()
    return [r[0] for r in results if r[0]]
