import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Eye, CheckCircle2, Cpu, AlertOctagon,
  Clock, Shield, Database, Sparkles, X, Loader2
} from 'lucide-react';
import { AlertTable, SeverityBadge } from '../../components/Tables';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Threats = () => {
  const navigate = useNavigate();
  
  // State
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [severity, setSeverity] = useState('');
  const [resolved, setResolved] = useState('');
  const [threatType, setThreatType] = useState('');
  
  // Modal State
  const [activeThreat, setActiveThreat] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchThreats = async () => {
    setLoading(true);
    try {
      let url = `/threats/list?limit=50`;
      if (severity) url += `&severity=${severity}`;
      if (resolved !== '') url += `&resolved=${resolved}`;
      if (threatType) url += `&threat_type=${encodeURIComponent(threatType)}`;
      
      const res = await api.get(url);
      setThreats(res.data.threats);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      toast.error('Failed to query security threat database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, [severity, resolved, threatType]);

  const handleResolve = async (threatId) => {
    try {
      await api.post(`/threats/resolve/${threatId}`);
      toast.success('Threat flagged as resolved.');
      fetchThreats();
      if (activeThreat?.threat_id === threatId) {
        setActiveThreat(prev => ({ ...prev, resolved: true }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark threat resolved.');
    }
  };

  const handleOpenInvestigateModal = (threat) => {
    setActiveThreat(threat);
    setModalOpen(true);
  };

  const handleAICopilotRoute = () => {
    if (!activeThreat) return;
    navigate('/ai-copilot', {
      state: {
        initialQuery: `Explain this security threat log in detail:\nSource IP: ${activeThreat.source_ip}\nThreat Type: ${activeThreat.threat_type}\nSeverity: ${activeThreat.severity.toUpperCase()}\nDetails: ${activeThreat.details}\nMITRE ATT&CK: ${activeThreat.mitre_technique_id || 'N/A'}`
      }
    });
    setModalOpen(false);
  };

  const threatTypes = ["Brute Force", "SQL Injection", "XSS", "Port Scanning", "Directory Traversal", "Command Injection"];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-danger animate-pulse" />
            Vulnerability & Threat Intelligence
          </h1>
          <p className="text-xs text-gray-500 mt-1">Investigate threat vectors flagged by detection rules and MITRE mappings</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-xs font-semibold uppercase font-mono tracking-widest text-gray-400 mb-4">
          Query Filter controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Severity */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block">Threat Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-brand-bg border border-gray-800 hover:border-gray-750 focus:border-brand-primary focus:outline-none px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Threat Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block">Exploit Vector</label>
            <select
              value={threatType}
              onChange={(e) => setThreatType(e.target.value)}
              className="w-full bg-brand-bg border border-gray-800 hover:border-gray-750 focus:border-brand-primary focus:outline-none px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
            >
              <option value="">All Vectors</option>
              {threatTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block">Triage Status</label>
            <select
              value={resolved}
              onChange={(e) => setResolved(e.target.value)}
              className="w-full bg-brand-bg border border-gray-800 hover:border-gray-750 focus:border-brand-primary focus:outline-none px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
            >
              <option value="">All States</option>
              <option value="false">Active / Triaging</option>
              <option value="true">Acknowledged / Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Threat List Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <span className="text-xs font-mono text-gray-500">Querying security records...</span>
        </div>
      ) : (
        <AlertTable 
          alerts={threats} 
          onInvestigate={handleOpenInvestigateModal}
          onResolve={handleResolve}
        />
      )}

      {/* Investigation Details Dialog Modal */}
      {modalOpen && activeThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-brand-cards border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-brand-danger" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Threat Investigation Brief</h3>
                  <span className="text-[9px] font-mono text-gray-500">Incident Event ID: {activeThreat.threat_id}</span>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Threat Classification</span>
                  <span className="text-sm font-bold text-gray-200 flex items-center gap-1.5 mt-0.5">
                    {activeThreat.threat_type}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Telemetry Severity</span>
                  <div className="mt-0.5"><SeverityBadge severity={activeThreat.severity} /></div>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Attacker Source IP</span>
                  <span className="font-mono text-xs font-bold text-brand-primary">{activeThreat.source_ip}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Alert Timestamp</span>
                  <span className="font-mono text-xs text-gray-300">{formatDate(activeThreat.timestamp)}</span>
                </div>
                {activeThreat.confidence_score !== undefined && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Confidence Score</span>
                    <span className="font-mono text-xs font-bold text-brand-primary">
                      {activeThreat.confidence_score}%
                    </span>
                  </div>
                )}
              </div>


              {/* MITRE ATT&CK Info */}
              {activeThreat.mitre_mapping && (
                <div className="p-4 bg-gray-950/60 rounded-xl border border-gray-850 space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-1.5">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-brand-primary">MITRE ATT&CK Mapping Matrix</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                      {activeThreat.mitre_mapping.technique_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Active Tactic Category</span>
                    <span className="text-xs text-gray-200 font-semibold">{activeThreat.mitre_mapping.tactic}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 block">MITRE Tech Description</span>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{activeThreat.mitre_mapping.description}</p>
                  </div>
                </div>
              )}

              {/* Explanatory Details */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Threat Log Signature matches</span>
                <div className="w-full bg-gray-950 p-4 rounded-lg border border-gray-850 font-mono text-[10px] text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {activeThreat.details}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-gray-900/30 border-t border-gray-800 flex items-center justify-between gap-4">
              <div className="text-[10px] font-mono text-gray-500">
                Triage State: {activeThreat.resolved ? <span className="text-brand-success font-semibold">RESOLVED</span> : <span className="text-brand-warning font-semibold">RESOLVING</span>}
              </div>
              <div className="flex items-center gap-3">
                {!activeThreat.resolved && (
                  <button
                    onClick={() => handleResolve(activeThreat.threat_id)}
                    className="px-4 py-2 rounded-lg border border-brand-success/30 bg-brand-success/10 hover:bg-brand-success hover:text-black font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Acknowledge Resolve
                  </button>
                )}
                <button
                  onClick={handleAICopilotRoute}
                  className="px-4 py-2 rounded-lg bg-brand-primary text-black font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_2px_12px_rgba(0,229,255,0.15)]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI Copilot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Threats;
