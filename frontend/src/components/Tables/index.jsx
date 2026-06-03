import React from 'react';
import { ShieldCheck, Flame, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/format';

export const SeverityBadge = ({ severity }) => {
  const sev = severity?.toLowerCase();
  
  let styles = 'bg-gray-800 text-gray-400 border border-gray-700';
  if (sev === 'critical') {
    styles = 'bg-red-950/40 text-red-500 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]';
  } else if (sev === 'high') {
    styles = 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20';
  } else if (sev === 'medium') {
    styles = 'bg-yellow-950/10 text-yellow-500 border border-yellow-500/10';
  } else if (sev === 'low') {
    styles = 'bg-brand-success/10 text-brand-success border border-brand-success/20';
  }
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase font-mono ${styles}`}>
      {sev}
    </span>
  );
};

export const AlertTable = ({ alerts, onInvestigate, onResolve }) => {
  return (
    <div className="overflow-x-auto w-full rounded-xl bg-brand-cards border border-gray-800 shadow-lg">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/40 text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
            <th className="px-5 py-4">Triggered Time</th>
            <th className="px-5 py-4">Severity</th>
            <th className="px-5 py-4">Source IP</th>
            <th className="px-5 py-4">Threat Type</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
          {alerts.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-5 py-12 text-center text-gray-500">
                <ShieldCheck className="w-8 h-8 mx-auto text-brand-success mb-2 opacity-55" />
                No active threats flagged in log queue. Keep up the good work!
              </td>
            </tr>
          ) : (
            alerts.map((alert) => (
              <tr key={alert.threat_id} className="hover:bg-gray-800/20 transition-colors">
                <td className="px-5 py-3.5 font-mono text-[11px] text-gray-500">
                  {formatDistanceToNow(alert.timestamp)}
                </td>
                <td className="px-5 py-3.5">
                  <SeverityBadge severity={alert.severity} />
                </td>
                <td className="px-5 py-3.5 font-mono text-[13px] font-semibold text-brand-primary">
                  {alert.source_ip}
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-gray-200">{alert.threat_type}</span>
                  {alert.mitre_technique_id && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-gray-950 text-gray-500 border border-gray-850">
                      {alert.mitre_technique_id}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {alert.resolved ? (
                    <span className="flex items-center gap-1 text-xs text-brand-success">
                      <ShieldCheck className="w-4 h-4" /> Resolved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-brand-warning">
                      <Flame className="w-4 h-4 animate-pulse" /> Triaging
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right space-x-2">
                  <button
                    onClick={() => onInvestigate(alert)}
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-900 border border-gray-800 text-gray-300 hover:bg-brand-primary hover:text-black hover:border-brand-primary cursor-pointer transition-all"
                  >
                    Investigate
                  </button>
                  {!alert.resolved && onResolve && (
                    <button
                      onClick={() => onResolve(alert.threat_id)}
                      className="px-3 py-1 text-xs font-semibold rounded-md bg-brand-success/15 border border-brand-success/30 text-brand-success hover:bg-brand-success hover:text-black cursor-pointer transition-all"
                    >
                      Acknowledge
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
