import React from 'react';
import { Database, ShieldAlert, Skull, AlertTriangle, AlertCircle, ShieldQuestion } from 'lucide-react';

export const MetricCard = ({ title, value, icon: Icon, colorClass, borderGlow }) => {
  return (
    <div className={`
      relative overflow-hidden rounded-xl bg-brand-cards border border-gray-800 p-5 flex items-center justify-between shadow-lg
      ${borderGlow ? `shadow-[0_0_15px_-3px_var(--glow-color)]` : ''}
    `} style={borderGlow ? { '--glow-color': borderGlow } : {}}>
      <div className="space-y-1">
        <span className="text-xs uppercase font-mono tracking-widest text-gray-500">{title}</span>
        <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export const SummaryCards = ({ stats }) => {
  const cardData = [
    {
      title: 'Total Logs Processed',
      value: stats?.total_logs ?? 0,
      icon: Database,
      colorClass: 'bg-brand-primary/10 text-brand-primary',
      borderGlow: 'rgba(0, 229, 255, 0.15)'
    },
    {
      title: 'Threats Identified',
      value: stats?.threats_detected ?? 0,
      icon: ShieldAlert,
      colorClass: 'bg-brand-danger/10 text-brand-danger',
      borderGlow: 'rgba(239, 68, 68, 0.15)'
    },
    {
      title: 'Critical Violations',
      value: stats?.critical_alerts ?? 0,
      icon: Skull,
      colorClass: 'bg-red-950/40 text-red-500 border border-red-500/20',
      borderGlow: 'rgba(239, 68, 68, 0.3)'
    },
    {
      title: 'High Severity Alerts',
      value: stats?.high_alerts ?? 0,
      icon: AlertTriangle,
      colorClass: 'bg-brand-warning/10 text-brand-warning',
      borderGlow: 'rgba(245, 158, 11, 0.2)'
    },
    {
      title: 'Medium Severity Alerts',
      value: stats?.medium_alerts ?? 0,
      icon: AlertCircle,
      colorClass: 'bg-yellow-950/20 text-yellow-500 border border-yellow-500/20',
      borderGlow: ''
    },
    {
      title: 'Low Severity Audits',
      value: stats?.low_alerts ?? 0,
      icon: ShieldQuestion,
      colorClass: 'bg-blue-950/20 text-blue-400 border border-blue-500/10',
      borderGlow: ''
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {cardData.map((card, idx) => (
        <MetricCard key={idx} {...card} />
      ))}
    </div>
  );
};
