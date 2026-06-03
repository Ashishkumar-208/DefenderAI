import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst", nullable=False)  # admin, analyst, viewer
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    incidents = relationship("Incident", back_populates="analyst")
    reports = relationship("Report", back_populates="creator")
    chats = relationship("ChatHistory", back_populates="user")


class Log(Base):
    __tablename__ = "logs"

    log_id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    source_ip = Column(String(50), nullable=True)
    destination_ip = Column(String(50), nullable=True)
    event_type = Column(String(50), nullable=True)  # ssh, web, firewall, auth, etc.
    severity = Column(String(20), default="low", nullable=False)  # critical, high, medium, low
    raw_log = Column(Text, nullable=False)

    threats = relationship("Threat", back_populates="log", cascade="all, delete-orphan")


class MitreMapping(Base):
    __tablename__ = "mitre_mappings"

    technique_id = Column(String(50), primary_key=True, index=True)  # e.g., T1110, T1046
    tactic = Column(String(100), nullable=False)  # e.g., Credential Access, Discovery
    description = Column(Text, nullable=False)

    threats = relationship("Threat", back_populates="mitre_mapping")


class Threat(Base):
    __tablename__ = "threats"

    threat_id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("logs.log_id", ondelete="CASCADE"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    source_ip = Column(String(50), nullable=True)
    threat_type = Column(String(100), nullable=False)  # Brute Force, SQL Injection, XSS, etc.
    severity = Column(String(20), default="medium", nullable=False)  # critical, high, medium, low
    details = Column(Text, nullable=True)
    mitre_technique_id = Column(String(50), ForeignKey("mitre_mappings.technique_id"), nullable=True)
    confidence_score = Column(Integer, default=70, nullable=True)
    resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


    log = relationship("Log", back_populates="threats")
    mitre_mapping = relationship("MitreMapping", back_populates="threats")


class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), default="medium", nullable=False)  # critical, high, medium, low
    status = Column(String(50), default="Open", nullable=False)  # Open, Investigating, Resolved, Closed
    assigned_analyst_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    analyst = relationship("User", back_populates="incidents")


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False)  # PDF, CSV
    title = Column(String(200), nullable=False)
    filepath = Column(String(255), nullable=False)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="reports")


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info", nullable=False)  # threat, incident, user, info
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class ChatHistory(Base):
    __tablename__ = "chat_history"

    chat_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="chats")
