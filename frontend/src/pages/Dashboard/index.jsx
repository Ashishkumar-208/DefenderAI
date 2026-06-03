import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryCards } from '../../components/Cards';
import { ActivityGraph, ThreatDistribution } from '../../components/Charts';
import { AlertTable } from '../../components/Tables';
import { RefreshCw, Play, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
      if (showToast) toast.success('SOC operational dashboard refreshed.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load real-time security logs statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll statistics every 15 seconds for a dynamic SOC dashboard experience
    const interval = setInterval(() => fetchStats(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveThreat = async (threatId) => {
    try {
      await api.post(`/threats/resolve/${threatId}`);
      toast.success('Threat acknowledged and resolved.');
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error('Could not resolve threat event.');
    }
  };

  const handleInvestigateThreat = (threat) => {
    // Navigate to AI Copilot page and pass the query in routing state
    navigate('/ai-copilot', { 
      state: { 
        initialQuery: `Explain this threat log in detail:\nSource IP: ${threat.source_ip}\nThreat Type: ${threat.threat_type}\nSeverity: ${threat.severity.toUpperCase()}\nDetails: ${threat.details}\nMITRE ATT&CK: ${threat.mitre_technique_id || 'N/A'}` 
      } 
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
        <span className="text-xs font-mono text-gray-500 tracking-widest">SYNCHRONIZING SOC VIEWPORTS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-primary animate-pulse" />
            Security Operations Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">Real-time telemetry, threat parsing, and incident response controls</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards stats={stats} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityGraph trendData={stats?.threat_trend} />
        </div>
        <div>
          <ThreatDistribution distData={stats?.threat_distribution} />
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-200">Active Cyber Alarm Telemetry</h4>
            <p className="text-xs text-gray-500 mt-0.5">Most recent threats flagged by automated detection rules</p>
          </div>
        </div>
        <AlertTable 
          alerts={stats?.recent_alerts || []} 
          onInvestigate={handleInvestigateThreat} 
          onResolve={handleResolveThreat} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
