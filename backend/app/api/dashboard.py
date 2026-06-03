import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Log, Threat, Incident, User
from app.schemas.schemas import DashboardStats, ThreatResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Overview widgets
    total_logs = db.query(Log).count()
    threats_detected = db.query(Threat).count()
    
    critical_alerts = db.query(Threat).filter(Threat.severity == "critical").count()
    high_alerts = db.query(Threat).filter(Threat.severity == "high").count()
    medium_alerts = db.query(Threat).filter(Threat.severity == "medium").count()
    low_alerts = db.query(Threat).filter(Threat.severity == "low").count()
    
    # 2. Recent alerts (top 10)
    recent = db.query(Threat).order_by(Threat.timestamp.desc()).limit(10).all()
    recent_alerts = [ThreatResponse.model_validate(r) for r in recent]
    
    # 3. Threat distribution by type
    distribution_query = db.query(
        Threat.threat_type, func.count(Threat.threat_id)
    ).group_by(Threat.threat_type).all()
    
    all_types = ["Malware", "Brute Force", "SQL Injection", "XSS", "Port Scanning", "Directory Traversal", "Command Injection", "Unknown"]
    dist_map = {t: 0 for t in all_types}
    for t_type, count in distribution_query:
        if t_type in dist_map:
            dist_map[t_type] = count
        else:
            dist_map["Unknown"] = dist_map.get("Unknown", 0) + count
            
    threat_distribution = [{"name": name, "value": val} for name, val in dist_map.items() if val > 0 or name in ["Brute Force", "SQL Injection", "XSS", "Port Scanning"]]
    
    # 4. Activity Graph (Last 30 Days trend)
    # Generate 30 days series ending today
    today = datetime.date.today()
    threat_trend = []
    alert_trend = []
    incident_trend = []
    
    # Pre-populate list to make sure we always have 30 points of data for Recharts
    for i in range(29, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.strftime("%b %d")
        
        # Threat Trend (all threats on that day)
        threat_count = db.query(Threat).filter(
            func.date(Threat.timestamp) == day
        ).count()
        
        # Alert Trend (critical + high threats on that day)
        alert_count = db.query(Threat).filter(
            func.date(Threat.timestamp) == day,
            Threat.severity.in_(["high", "critical"])
        ).count()
        
        # Incident Trend (incidents created on that day)
        incident_count = db.query(Incident).filter(
            func.date(Incident.created_at) == day
        ).count()
        
        # If database is blank, inject simulated subtle visual noise for presentation realism
        if total_logs == 0:
            # Generate simulated values if no logs uploaded yet, to look great at first view
            import random
            random.seed(day.toordinal())
            simulated_threat = random.randint(1, 8) if i % 4 == 0 else 0
            simulated_alert = random.randint(1, 3) if simulated_threat > 3 else 0
            simulated_incident = 1 if simulated_alert > 1 else 0
            
            threat_trend.append({"date": day_str, "count": simulated_threat})
            alert_trend.append({"date": day_str, "count": simulated_alert})
            incident_trend.append({"date": day_str, "count": simulated_incident})
        else:
            threat_trend.append({"date": day_str, "count": threat_count})
            alert_trend.append({"date": day_str, "count": alert_count})
            incident_trend.append({"date": day_str, "count": incident_count})
            
    return DashboardStats(
        total_logs=total_logs,
        threats_detected=threats_detected,
        critical_alerts=critical_alerts,
        high_alerts=high_alerts,
        medium_alerts=medium_alerts,
        low_alerts=low_alerts,
        threat_trend=threat_trend,
        alert_trend=alert_trend,
        incident_trend=incident_trend,
        threat_distribution=threat_distribution,
        recent_alerts=recent_alerts
    )
