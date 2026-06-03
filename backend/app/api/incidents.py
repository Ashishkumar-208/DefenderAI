from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import get_current_user, check_role
from app.models.models import User, Incident, Notification
from app.schemas.schemas import IncidentCreate, IncidentUpdate, IncidentResponse

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.post("/create", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "analyst"]))
):
    # Verify analyst exists if assigned
    if incident_in.assigned_analyst_id:
        analyst = db.query(User).filter(User.id == incident_in.assigned_analyst_id).first()
        if not analyst:
            raise HTTPException(status_code=400, detail="Assigned analyst does not exist")
            
    db_incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        severity=incident_in.severity,
        status=incident_in.status,
        assigned_analyst_id=incident_in.assigned_analyst_id
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    
    # Notify
    notif = Notification(
        title="New Security Incident Opened",
        message=f"Incident '{db_incident.title}' was created with severity '{db_incident.severity}'.",
        type="incident",
        read=False
    )
    db.add(notif)
    db.commit()
    
    return db_incident

@router.put("/update/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    incident_in: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "analyst"]))
):
    db_incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    update_data = incident_in.model_dump(exclude_unset=True)
    
    # Verify analyst exists if assigning
    if "assigned_analyst_id" in update_data and update_data["assigned_analyst_id"] is not None:
        analyst = db.query(User).filter(User.id == update_data["assigned_analyst_id"]).first()
        if not analyst:
            raise HTTPException(status_code=400, detail="Assigned analyst does not exist")
            
    for key, value in update_data.items():
        setattr(db_incident, key, value)
        
    db.commit()
    db.refresh(db_incident)
    return db_incident

@router.get("/list")
def list_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: str = Query(None),
    severity: str = Query(None),
    assigned_analyst_id: int = Query(None),
    search: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    query = db.query(Incident)
    
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity.lower())
    if assigned_analyst_id:
        query = query.filter(Incident.assigned_analyst_id == assigned_analyst_id)
    if search:
        query = query.filter(
            or_(
                Incident.title.like(f"%{search}%"),
                Incident.description.like(f"%{search}%")
            )
        )
        
    total = query.count()
    incidents = query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "incidents": [IncidentResponse.model_validate(inc) for inc in incidents]
    }

@router.delete("/delete/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin"]))
):
    db_incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    db.delete(db_incident)
    db.commit()
    return None
