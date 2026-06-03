from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, check_role
from app.models.models import Threat, Log, MitreMapping, User
from app.schemas.schemas import ThreatResponse
from app.services.detection import detect_threats_for_line

router = APIRouter(prefix="/threats", tags=["Threats"])

@router.get("/list")
def list_threats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    severity: str = Query(None),
    threat_type: str = Query(None),
    resolved: bool = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    query = db.query(Threat)
    
    if severity:
        query = query.filter(Threat.severity == severity.lower())
    if threat_type:
        query = query.filter(Threat.threat_type == threat_type)
    if resolved is not None:
        query = query.filter(Threat.resolved == resolved)
        
    total = query.count()
    threats = query.order_by(Threat.timestamp.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "threats": [ThreatResponse.model_validate(t) for t in threats]
    }

@router.post("/analyze/{log_id}", status_code=status.HTTP_200_OK)
def analyze_log_manually(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "analyst"]))
):
    db_log = db.query(Log).filter(Log.log_id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found")
        
    # Clear existing threats associated with this log to avoid duplication
    db.query(Threat).filter(Threat.log_id == log_id).delete()
    db.commit()
    
    # Re-run engine
    line_threats = detect_threats_for_line(db_log)
    db_threats = []
    
    if line_threats:
        max_line_severity = "low"
        severity_ranks = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        for t_data in line_threats:
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
            db_threats.append(db_threat)
            
            if severity_ranks.get(t_data["severity"], 1) > severity_ranks.get(max_line_severity, 1):
                max_line_severity = t_data["severity"]
                
        db_log.severity = max_line_severity
        db.commit()
        db.refresh(db_log)
        
    return {
        "message": f"Manual scan complete. Detected {len(db_threats)} threats.",
        "threats": [ThreatResponse.model_validate(t) for t in db_threats]
    }


@router.post("/resolve/{threat_id}", status_code=status.HTTP_200_OK)
def resolve_threat(
    threat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "analyst"]))
):
    threat = db.query(Threat).filter(Threat.threat_id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat event not found")
        
    threat.resolved = True
    db.commit()
    db.refresh(threat)
    return {"message": f"Threat {threat_id} resolved.", "resolved": True}
