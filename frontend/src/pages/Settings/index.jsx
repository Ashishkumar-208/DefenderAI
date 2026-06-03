import React, { useState } from 'react';
import { 
  Settings, Play, ShieldAlert, Sparkles, Terminal,
  Sliders, Shield, Server, CheckCircle2, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SIMULATED_ATTACKS = {
  brute_force: {
    name: 'SSH Brute Force Attack',
    description: 'Generates rapid authentication failures from an offending IP targeting systemic ports.',
    filename: 'ssh_auth_failures.log',
    content: `2026-06-02T12:00:01Z SSHD auth failure: Invalid user admin from 185.220.101.5 port 50433
2026-06-02T12:00:02Z SSHD auth failure: Invalid user root from 185.220.101.5 port 50442
2026-06-02T12:00:03Z SSHD auth failure: Invalid user support from 185.220.101.5 port 50450
2026-06-02T12:00:04Z SSHD auth failure: Invalid user admin from 185.220.101.5 port 50462
2026-06-02T12:00:05Z SSHD auth failure: Invalid user backup from 185.220.101.5 port 50470`
  },
  sqli: {
    name: 'Web SQL Injection Payload',
    description: 'Injects classic SQL UNION SELECT query parameters seeking schema structure leaks.',
    filename: 'nginx_web_access.log',
    content: `2026-06-02T12:05:00Z GET /api/users?id=1%20UNION%2520SELECT%20username,password_hash%20FROM%20users HTTP/1.1 200 Host: api.defenderai.local User-Agent: Mozilla/5.0 IP: 203.0.113.80`
  },
  port_scan: {
    name: 'Nmap Port Sweep Reconnaissance',
    description: 'Generates sequential connections probes against system administration ports.',
    filename: 'firewall_packets.log',
    content: `2026-06-02T12:10:00Z firewall: block incoming tcp connection from 198.51.100.12 to port 22 (TCP SYN scan)
2026-06-02T12:10:01Z Nmap port scan detected from source IP 198.51.100.12`
  },
  traversal: {
    name: 'Directory Path Traversal Exploit',
    description: 'Sends request patterns containing dot-dot-slash loops seeking configurations files.',
    filename: 'apache_site.log',
    content: `2026-06-02T12:15:00Z GET /static/download?file=../../../../etc/passwd HTTP/1.1 404 Host: app.defenderai.local IP: 192.0.2.14`
  },
  cmd_injection: {
    name: 'Remote Command Injection Exploit',
    description: 'Attempts shell piping execution characters on ping fields.',
    filename: 'dev_server_queries.log',
    content: `2026-06-02T12:20:00Z POST /ping HTTP/1.1 Host: dev.defenderai.local payload: host=127.0.0.1;%20whoami%20&&%20cat%20/etc/hosts IP: 198.51.100.45`
  },
  malware: {
    name: 'Malware Trojan Signature Ingestion',
    description: 'Simulates a endpoint antivirus report flagging a local Trojan infection.',
    filename: 'antivirus_detections.log',
    content: `2026-06-02T12:25:00Z Windows Defender flagged malware: Trojan Win32/Wacatac.B!ml detected from source 192.168.1.155`
  },
  ddos: {
    name: 'DDoS High Request Rate Suspected',
    description: 'Simulates a gateway connection spike flagging a suspected DDoS attack.',
    filename: 'reverse_proxy.log',
    content: `2026-06-02T12:30:00Z DDoS attack suspected: High request rate of 15000 req/sec from source IP 198.51.100.22`
  },
  unauthorized: {
    name: 'Unauthorized Administrative Access Attempt',
    description: 'Simulates a perimeter console blockage flagging access denied.',
    filename: 'firewall_gui.log',
    content: `2026-06-02T12:35:00Z Unauthorized access attempt to /admin/config: Access denied from IP 203.0.113.122`
  },
  ransomware: {
    name: 'Ransomware File Encryption Activity',
    description: 'Simulates a host warning of rapid crypt extension changes.',
    filename: 'fswatcher_alarms.log',
    content: `2026-06-02T12:40:00Z Ransomware signature matched: File encryption activity detected on user shares from source 10.0.0.8`
  }
};


const SettingsView = () => {
  const [injecting, setInjecting] = useState(null);

  const handleInject = async (key) => {
    const attack = SIMULATED_ATTACKS[key];
    if (!attack) return;

    setInjecting(key);
    const toastId = toast.loading(`Simulating ${attack.name} log stream injection...`);

    try {
      // Create file in-memory
      const blob = new Blob([attack.content], { type: 'text/plain' });
      const file = new File([blob], attack.filename, { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/logs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(
        <div>
          <p className="font-semibold text-xs text-green-400">Simulation Injected!</p>
          <p className="text-[10px] text-gray-300">
            Detected {res.data.threats_detected} threat incidents. Severity: <span className="font-bold uppercase text-red-400">{res.data.overall_severity}</span>
          </p>
        </div>,
        { id: toastId, duration: 6000 }
      );
    } catch (err) {
      console.error(err);
      toast.error('Simulation log injection failed.', { id: toastId });
    } finally {
      setInjecting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-primary animate-spin" style={{ animationDuration: '8s' }} />
            SOC Panel & Simulator Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">Configure database connections settings, inject mock attack logs, and audit logs systems</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulator Dashboard */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-warning animate-pulse" />
              <div>
                <h3 className="text-sm font-semibold text-gray-200">Interactive Attack Log Simulator</h3>
                <p className="text-xs text-gray-500 mt-0.5">Inject realistic attack telemetry packets to demonstrate DefenderAI threat mapping rules and AI investigations.</p>
              </div>
            </div>

            <div className="divide-y divide-gray-800/60 space-y-4">
              {Object.entries(SIMULATED_ATTACKS).map(([key, attack]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 first:pt-0">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-200 block">{attack.name}</span>
                    <p className="text-[11px] text-gray-400 leading-normal">{attack.description}</p>
                    <span className="inline-block px-1.5 py-0.5 font-mono text-[9px] bg-gray-900 border border-gray-850 rounded text-gray-500 mt-1">
                      {attack.filename}
                    </span>
                  </div>
                  <button
                    onClick={() => handleInject(key)}
                    disabled={injecting !== null}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 border border-gray-800 hover:border-brand-primary/30 text-xs font-semibold text-brand-primary rounded-lg transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {injecting === key ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Injecting...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Trigger Attack</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global properties / system status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-primary" />
              <h3 className="text-sm font-semibold text-gray-200">System Telemetry</h3>
            </div>

            <div className="space-y-3.5 font-mono text-[10px] text-gray-400">
              <div className="flex justify-between border-b border-gray-850 pb-1.5">
                <span>DATABASE DIALECT</span>
                <span className="text-brand-success font-semibold">SQLite (Neon ready)</span>
              </div>
              <div className="flex justify-between border-b border-gray-850 pb-1.5">
                <span>AI INFERENCE ENGINE</span>
                <span className="text-brand-primary font-semibold">Groq Llama-3 API</span>
              </div>
              <div className="flex justify-between border-b border-gray-850 pb-1.5">
                <span>DETECTION MODULES</span>
                <span className="text-brand-primary">9 Active Rulesets</span>
              </div>
              <div className="flex justify-between">
                <span>API STATUS</span>
                <span className="flex items-center gap-1 text-brand-success font-semibold">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
