MITRE_TECHNIQUES = [
    {
        "technique_id": "T1110",
        "tactic": "Credential Access",
        "description": "Adversaries may use brute force techniques to attempt access to accounts when passwords or other credentials are unknown."
    },
    {
        "technique_id": "T1046",
        "tactic": "Discovery",
        "description": "Adversaries may attempt to get a listing of services and ports running on target hosts to identify potential vulnerabilities."
    },
    {
        "technique_id": "T1190",
        "tactic": "Initial Access",
        "description": "Adversaries may exploit vulnerabilities in public-facing applications (such as SQL Injection, XSS, Path Traversal) to gain access or run arbitrary code."
    },
    {
        "technique_id": "T1059",
        "tactic": "Execution",
        "description": "Adversaries may use command and scripting interpreters to execute commands, scripts, or binaries on target systems."
    },
    {
        "technique_id": "T1595",
        "tactic": "Reconnaissance",
        "description": "Adversaries may conduct active scanning to gather information about target networks, hosts, and services prior to exploitation."
    },
    {
        "technique_id": "T1587",
        "tactic": "Resource Development",
        "description": "Adversaries may develop malware, payloads, and signatures to support executions."
    },
    {
        "technique_id": "T1498",
        "tactic": "Impact",
        "description": "Adversaries may perform Network Denial of Service (DDoS) attacks to disrupt availability."
    },
    {
        "technique_id": "T1078",
        "tactic": "Defense Evasion",
        "description": "Adversaries may obtain and abuse credentials of existing accounts to gain unauthorized access."
    },
    {
        "technique_id": "T1486",
        "tactic": "Impact",
        "description": "Adversaries may encrypt data on target systems to interrupt system availability and demand ransom."
    }
]

def get_mitre_mapping(threat_type: str) -> str:
    """Helper to map a custom threat detection engine label to a MITRE technique ID."""
    mapping = {
        "Brute Force": "T1110",
        "Port Scanning": "T1046",
        "SQL Injection": "T1190",
        "XSS": "T1190",
        "Directory Traversal": "T1190",
        "Command Injection": "T1059",
        "Malware": "T1587",
        "DDoS": "T1498",
        "Unauthorized Access": "T1078",
        "Ransomware": "T1486"
    }
    return mapping.get(threat_type, "T1190")  # Default to exploit public facing application

