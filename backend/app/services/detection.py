import re
import datetime
from sqlalchemy.orm import Session
from app.models.models import Log, Threat, Notification, Incident
from app.utils.mitre import get_mitre_mapping

# Regex Patterns
IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
ISO_TIMESTAMP_PATTERN = re.compile(r'\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b')

# Rules Specifications
RULES = {
    "SQL Injection": {
        "patterns": [
            re.compile(r"or\s+'1'\s*=\s*'1", re.IGNORECASE),
            re.compile(r"union\s+select", re.IGNORECASE),
            re.compile(r"sql\s+injection\s+attempt\s+detected", re.IGNORECASE)
        ],
        "severity": "high",
        "confidence": 95,
    },
    "XSS": {
        "patterns": [
            re.compile(r"<script.*?>", re.IGNORECASE),
            re.compile(r"javascript:", re.IGNORECASE),
            re.compile(r"cross\s+site\s+scripting", re.IGNORECASE)
        ],
        "severity": "medium",
        "confidence": 85,
    },
    "Port Scanning": {
        "patterns": [
            re.compile(r"nmap", re.IGNORECASE),
            re.compile(r"port\s+scan\s+detected", re.IGNORECASE),
            re.compile(r"tcp\s+syn\s+scan", re.IGNORECASE)
        ],
        "severity": "medium",
        "confidence": 90,
    },
    "Malware": {
        "patterns": [
            re.compile(r"trojan", re.IGNORECASE),
            re.compile(r"malware\s+detected", re.IGNORECASE),
            re.compile(r"virus\s+signature", re.IGNORECASE)
        ],
        "severity": "high",
        "confidence": 90,
    },
    "DDoS": {
        "patterns": [
            re.compile(r"ddos\s+attack\s+suspected", re.IGNORECASE),
            re.compile(r"high\s+request\s+rate", re.IGNORECASE)
        ],
        "severity": "high",
        "confidence": 85,
    },
    "Command Injection": {
        "patterns": [
            re.compile(r";\s*cat\s+/etc/passwd", re.IGNORECASE),
            re.compile(r"&&\s*whoami", re.IGNORECASE),
            re.compile(r"command\s+injection", re.IGNORECASE)
        ],
        "severity": "critical",
        "confidence": 95,
    },
    "Unauthorized Access": {
        "patterns": [
            re.compile(r"access\s+denied", re.IGNORECASE),
            re.compile(r"unauthorized\s+access\s+attempt", re.IGNORECASE)
        ],
        "severity": "low",
        "confidence": 75,
    },
    "Ransomware": {
        "patterns": [
            re.compile(r"file\s+encryption\s+activity", re.IGNORECASE),
            re.compile(r"ransomware\s+signature", re.IGNORECASE)
        ],
        "severity": "critical",
        "confidence": 95,
    }
}

FAILED_LOGIN_KEYWORDS = [
    "failed login", "login failed", "unauthorized", "permission denied", 
    "authentication failed", "invalid password", "401 unauthorized", 
    "failed password", "status=401", "access denied", "unauthorized access attempt",
    "auth failure", "invalid user", "failure"
]

def parse_log_line(line: str) -> dict:
    """Parses a single log line to extract metadata details."""
    line_stripped = line.strip()
    if not line_stripped:
        return None
        
    # 1. Parse Timestamp
    timestamp = datetime.datetime.utcnow()
    time_match = ISO_TIMESTAMP_PATTERN.search(line_stripped)
    if time_match:
        try:
            # Clean possible space or Z
            t_str = time_match.group(0).replace(' ', 'T').replace('Z', '')
            timestamp = datetime.datetime.fromisoformat(t_str)
        except Exception:
            pass
            
    # 2. Extract IPs
    ips = IP_PATTERN.findall(line_stripped)
    source_ip = ips[0] if len(ips) > 0 else None
    destination_ip = ips[1] if len(ips) > 1 else None
    
    # 3. Determine Event type
    event_type = "system"
    line_lower = line_stripped.lower()
    if any(kw in line_lower for kw in ["ssh", "sshd", "auth", "login"]):
        event_type = "auth"
    elif any(kw in line_lower for kw in ["get", "post", "http", "api"]):
        event_type = "web"
    elif any(kw in line_lower for kw in ["block", "drop", "firewall", "port", "nmap"]):
        event_type = "firewall"
    elif any(kw in line_lower for kw in ["trojan", "malware", "virus", "ransomware", "encrypt"]):
        event_type = "malware"
    elif "ddos" in line_lower:
        event_type = "ddos"
        
    return {
        "timestamp": timestamp,
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "event_type": event_type,
        "severity": "low", # Initial default
        "raw_log": line_stripped
    }

import urllib.parse

def detect_threats_for_line(db_log: Log) -> list[dict]:
    """Examines a parsed log record against rules, returning threats list."""
    detected = []
    line_text = db_log.raw_log
    # Decode URL-encoded inputs (e.g., %20 and %2520) to match rule signatures
    decoded_text = urllib.parse.unquote(urllib.parse.unquote(line_text))
    
    for threat_name, rule in RULES.items():
        for pattern in rule["patterns"]:
            if pattern.search(line_text) or pattern.search(decoded_text):
                detected.append({
                    "threat_type": threat_name,
                    "severity": rule["severity"],
                    "details": f"Triggered pattern matching: '{pattern.pattern}' in log event.",
                    "confidence_score": rule["confidence"],
                    "mitre_technique_id": get_mitre_mapping(threat_name)
                })
                break # Only trigger once per threat type per line
                
    return detected

def check_brute_force_window(db: Session, logs_batch: list[Log]) -> list[Threat]:
    """
    Checks sliding timeline window: 5+ failed logins from same IP within 60 seconds.
    Can scan both local batch logs and database audit logs context.
    """
    # Group logs by Source IP
    failed_attempts_by_ip = {}
    
    # We query the database for recent failed login logs within the last 5 minutes to avoid splitting attacks
    # across uploads, combining with our current batch.
    five_mins_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    
    # Fetch all logs in the database matching failed logins recently
    recent_db_failed_logs = db.query(Log).filter(
        Log.timestamp >= five_mins_ago,
        Log.event_type == "auth"
    ).all()
    
    # Merge and deduplicate by raw log and timestamp
    all_failed_logs = list(logs_batch) + recent_db_failed_logs
    deduped_failed = {}
    for l in all_failed_logs:
        # Only failed logins
        l_lower = l.raw_log.lower()
        if any(kw in l_lower for kw in FAILED_LOGIN_KEYWORDS):
            key = (l.source_ip, l.timestamp.isoformat(), l.raw_log[:50])
            deduped_failed[key] = l
            
    # Group by IP
    for l in deduped_failed.values():
        if not l.source_ip or l.source_ip == "0.0.0.0":
            continue
        failed_attempts_by_ip.setdefault(l.source_ip, []).append(l)
        
    detected_threats = []
    
    for ip, events in failed_attempts_by_ip.items():
        if len(events) < 5:
            continue
            
        # Sort events chronologically
        events.sort(key=lambda x: x.timestamp)
        
        # Sliding window check
        for i in range(len(events) - 4):
            window_start = events[i].timestamp
            window_end = events[i+4].timestamp
            time_diff = (window_end - window_start).total_seconds()
            
            if time_diff <= 60:
                # Flag Brute Force threat linked to the end log of the sliding window
                end_log = events[i+4]
                
                # Check if we already have flagged a Brute Force threat from this IP in the exact same second
                existing_threat = db.query(Threat).filter(
                    Threat.source_ip == ip,
                    Threat.threat_type == "Brute Force",
                    Threat.timestamp == end_log.timestamp
                ).first()
                
                if not existing_threat:
                    db_threat = Threat(
                        log_id=end_log.log_id,
                        source_ip=ip,
                        timestamp=end_log.timestamp,
                        threat_type="Brute Force",
                        severity="high",
                        details=f"Sliding window alert: 5 failed logins detected in {int(time_diff)} seconds from IP {ip}.",
                        mitre_technique_id="T1110",
                        confidence_score=90,
                        resolved=False
                    )
                    db.add(db_threat)
                    detected_threats.append(db_threat)
                    
                    # Log incident automatically
                    inc = Incident(
                        title=f"Brute Force alert from {ip}",
                        description=f"Automated threat engine detected a credential brute forcing pattern from IP {ip}. Timings: 5 occurrences in {int(time_diff)}s.",
                        severity="high",
                        status="Open"
                    )
                    db.add(inc)
                    
                    # Notify
                    notif = Notification(
                        title="SSHD Brute Force Alarm",
                        message=f"SSHD Brute Force attack flagged from source IP {ip}.",
                        type="threat"
                    )
                    db.add(notif)
                    break # Break inner loop to avoid multiple triggers for the same continuous sweep
                    
    db.commit()
    return detected_threats
