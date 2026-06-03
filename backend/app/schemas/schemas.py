from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "analyst"

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# Log Schemas
class LogBase(BaseModel):
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    event_type: Optional[str] = None
    severity: str = "low"
    raw_log: str

class LogResponse(LogBase):
    log_id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

# MitreMapping Schema
class MitreMappingResponse(BaseModel):
    technique_id: str
    tactic: str
    description: str

    class Config:
        from_attributes = True

# Threat Schemas
class ThreatResponse(BaseModel):
    threat_id: int
    log_id: Optional[int] = None
    timestamp: datetime.datetime
    source_ip: Optional[str] = None
    threat_type: str
    severity: str
    details: Optional[str] = None
    mitre_technique_id: Optional[str] = None
    confidence_score: Optional[int] = None
    resolved: bool
    created_at: datetime.datetime
    mitre_mapping: Optional[MitreMappingResponse] = None

    class Config:
        from_attributes = True


# Incident Schemas
class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "medium"
    status: str = "Open"
    assigned_analyst_id: Optional[int] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_analyst_id: Optional[int] = None

class IncidentResponse(BaseModel):
    incident_id: int
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    assigned_analyst_id: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    analyst: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Report Schemas
class ReportResponse(BaseModel):
    report_id: int
    type: str
    title: str
    filepath: str
    generated_by_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    notification_id: int
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    chat_id: int
    message: str
    response: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Dashboard Stats Schemas
class DashboardStats(BaseModel):
    total_logs: int
    threats_detected: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
    threat_trend: List[dict]
    alert_trend: List[dict]
    incident_trend: List[dict]
    threat_distribution: List[dict]
    recent_alerts: List[ThreatResponse]
