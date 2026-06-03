import httpx
from app.core.config import settings

class AIService:
    @staticmethod
    async def get_copilot_response(message: str) -> str:
        if not settings.GROQ_API_KEY:
            return AIService._generate_fallback_response(message)
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {
                    "role": "system", 
                    "content": "You are DefenderAI Copilot, an expert SOC Analyst and AI Security Assistant. Answer cybersecurity questions, explain logs, map events to MITRE ATT&CK, and suggest mitigation rules. Format outputs nicely using Markdown."
                },
                {"role": "user", "content": message}
            ],
            "temperature": 0.2
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    return f"Error from Groq API (Status {response.status_code}): {response.text}. Operating in mock fallback mode."
        except Exception as e:
            return f"Failed to connect to Groq API ({str(e)}). Operating in mock fallback mode."

    @staticmethod
    def _generate_fallback_response(message: str) -> str:
        msg_lower = message.lower()
        
        if "sql" in msg_lower or "union select" in msg_lower:
            return (
                "### 🛡️ AI Security Copilot Analysis: SQL Injection (SQLi) Vulnerability Attack\n\n"
                "* **Attack Type:** SQL Injection (SQLi)\n"
                "* **Severity:** High / Critical\n"
                "* **MITRE ATT&CK Mapping:** T1190 – Exploit Public-Facing Application\n\n"
                "#### 🔍 Indicators Identified in Log:\n"
                "- Queries containing payload keys: `UNION SELECT`, `OR 1=1`, `DROP TABLE`, or database names mapping in `INFORMATION_SCHEMA`.\n\n"
                "#### ⚠️ Security Risks:\n"
                "Allows malicious actors to bypass login walls, execute read/write commands, extract credential hashes, or hijack database configurations.\n\n"
                "#### 🛠️ Firewall Block / Mitigation Rule:\n"
                "```nginx\n"
                "# Add pattern block in Nginx config\n"
                "if ($query_string ~* \"union.*select|or.*1=1|drop.*table\") {\n"
                "    return 403;\n"
                "}\n"
                "```\n"
                "Implement prepared parameterized statements (e.g. SQLAlchemy query constructs)."
            )
            
        elif "brute" in msg_lower or "failed login" in msg_lower:
            return (
                "### 🛡️ AI Security Copilot Analysis: Credential Brute Force attack\n\n"
                "* **Attack Type:** Brute Force / Password Spraying\n"
                "* **Severity:** High\n"
                "* **MITRE ATT&CK Mapping:** T1110 – Brute Force\n\n"
                "#### 🔍 Indicators Identified:\n"
                "- Sequential failed credentials request warnings (401 Unauthorized) originating from the same source IP in seconds.\n\n"
                "#### 🛠️ Mitigation Playbook:\n"
                "1. Enforce lockouts on user logins after 5 consecutive failures.\n"
                "2. Add Fail2Ban rules to drop incoming attacker packets at target Linux gateways:\n"
                "   ```bash\n"
                "   # Force drop client traffic\n"
                "   iptables -A INPUT -s <OFFENDING_IP> -j DROP\n"
                "   ```\n"
                "3. Enable Multi-Factor Authentication (MFA)."
            )
            
        elif "port" in msg_lower or "nmap" in msg_lower:
            return (
                "### 🛡️ AI Security Copilot Analysis: Network Port Scanning activity\n\n"
                "* **Attack Type:** Port Scan / Reconnaissance\n"
                "* **Severity:** Medium\n"
                "* **MITRE ATT&CK Mapping:** T1046 – Network Service Discovery\n\n"
                "#### 🔍 Indicators:\n"
                "- Sequential connection alerts across host ports in sub-seconds.\n"
                "- Probe markers mapping scanner signatures (`Nmap`, `masscan`).\n\n"
                "#### 🛠️ Recommendations:\n"
                "- Set firewalls to drop scanning responses.\n"
                "- Lock database host setups inside virtual private networks (VPNs) and close inactive ports."
            )
            
        elif "traversal" in msg_lower or "../" in msg_lower:
            return (
                "### 🛡️ AI Security Copilot Analysis: Directory Traversal Attempt\n\n"
                "* **Attack Type:** Directory Traversal\n"
                "* **Severity:** High\n"
                "* **MITRE ATT&CK Mapping:** T1190 – Exploit Public-Facing Application\n\n"
                "#### 🔍 Indicators:\n"
                "- Request string prefixes like `../` or URLencoded formats `%2e%2e%2f` seeking private files (e.g., `/etc/passwd`).\n\n"
                "#### 🛠️ Playbook:\n"
                "- Restrict server path resolution strictly within the user site root directories."
            )
            
        elif "command" in msg_lower or "injection" in msg_lower:
            return (
                "### 🛡️ AI Security Copilot Analysis: Command Injection exploit\n\n"
                "* **Attack Type:** Command Injection / Shell Hijacking\n"
                "* **Severity:** Critical\n"
                "* **MITRE ATT&CK Mapping:** T1059 – Command and Scripting Interpreter\n\n"
                "#### 🔍 Indicators:\n"
                "- Inputs parsed into executable command hooks (`&&`, `;`, `|`, `` ` ``) followed by utility commands like `id`, `whoami`, or `wget`.\n\n"
                "#### 🛠️ Mitigation:\n"
                "- Avoid execution shell operations dynamically; escape string parameters and use safe libraries."
            )
            
        elif "xss" in msg_lower or "script" in msg_lower:
            return (
                "### 🛡️ AI Security Copilot Analysis: Cross-Site Scripting (XSS)\n\n"
                "* **Attack Type:** Reflected/Stored XSS\n"
                "* **Severity:** Medium\n"
                "* **MITRE ATT&CK Mapping:** T1190 – Exploit Public-Facing Application\n\n"
                "#### 🔍 Indicators:\n"
                "- Dynamic script injections like `<script>`, `onerror=`, or `javascript:` in request headers or body logs.\n\n"
                "#### 🛠️ Remediation:\n"
                "- Escape content outputs on screen and enforce strict Content Security Policy (CSP) headers."
            )

        else:
            return (
                "### 🛡️ DefenderAI Security Copilot Chatbot\n\n"
                "I am your AI Copilot. Ask me questions about log files, attacks, or security playbooks:\n\n"
                "- *'Explain SQL Injection and recommend mitigation rules.'*\n"
                "- *'How can I block SSH brute-forcing using IPTables?'*\n"
                "- *'Show Mitre Mapping T1190 details.'*"
            )
