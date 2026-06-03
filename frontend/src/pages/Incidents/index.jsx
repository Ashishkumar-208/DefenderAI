import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Eye, Edit3, Trash2, Plus, Sparkles, X,
  Clock, Shield, User, Loader2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { SeverityBadge } from '../../components/Tables';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Incidents = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  // States
  const [incidents, setIncidents] = useState([]);
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  
  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newAnalystId, setNewAnalystId] = useState('');
  
  // Update Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateAnalystId, setUpdateAnalystId] = useState('');
  const [updateDesc, setUpdateDesc] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      let url = '/incidents/list?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (severityFilter) url += `&severity=${severityFilter}`;
      
      const res = await api.get(url);
      setIncidents(res.data.incidents);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve SOC incidents queue.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysts = async () => {
    try {
      const res = await api.get('/auth/analysts');
      setAnalysts(res.data);
    } catch (err) {
      console.error('Error fetching analysts:', err);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchAnalysts();
  }, [statusFilter, severityFilter]);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Incident title cannot be blank.');
      return;
    }

    try {
      await api.post('/incidents/create', {
        title: newTitle,
        description: newDesc,
        severity: newSeverity,
        status: 'Open',
        assigned_analyst_id: newAnalystId ? parseInt(newAnalystId) : null
      });
      
      toast.success('Incident ticket created successfully.');
      setCreateModalOpen(false);
      
      // Reset forms
      setNewTitle('');
      setNewDesc('');
      setNewSeverity('medium');
      setNewAnalystId('');
      
      fetchIncidents();
    } catch (err) {
      console.error(err);
      toast.error('Could not create incident ticket.');
    }
  };

  const handleUpdateIncident = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    try {
      await api.put(`/incidents/update/${selectedIncident.incident_id}`, {
        status: updateStatus,
        assigned_analyst_id: updateAnalystId ? parseInt(updateAnalystId) : null,
        description: updateDesc
      });
      
      toast.success('Incident ticket updated.');
      setUpdateModalOpen(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
      toast.error('Could not update incident ticket details.');
    }
  };

  const handleDeleteIncident = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this security incident ticket?')) return;
    
    try {
      await api.delete(`/incidents/delete/${id}`);
      toast.success('Incident ticket purged.');
      fetchIncidents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete incident.');
    }
  };

  const handleOpenUpdateModal = (inc) => {
    setSelectedIncident(inc);
    setUpdateStatus(inc.status);
    setUpdateAnalystId(inc.assigned_analyst_id || '');
    setUpdateDesc(inc.description || '');
    setUpdateModalOpen(true);
  };

  const handleInvestigateIncident = (inc) => {
    navigate('/ai-copilot', {
      state: {
        initialQuery: `Analyze this SOC security incident and recommend firewall rules or mitigations:\nTitle: ${inc.title}\nDescription: ${inc.description}\nSeverity: ${inc.severity.toUpperCase()}\nStatus: ${inc.status}`
      }
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open':
        return 'text-red-500 font-bold border border-red-500/20 bg-red-950/20';
      case 'Investigating':
        return 'text-brand-warning font-bold border border-brand-warning/20 bg-brand-warning/10';
      case 'Resolved':
        return 'text-brand-success font-bold border border-brand-success/20 bg-brand-success/10';
      case 'Closed':
        return 'text-gray-500 border border-gray-800 bg-gray-900/20';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-brand-warning animate-pulse" />
            SOC Incident Management Queue
          </h1>
          <p className="text-xs text-gray-500 mt-1">Audit active breach tickets, delegate analysts, and update triaging lifecycles</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary text-black font-bold text-xs rounded-lg hover:bg-cyan-400 cursor-pointer shadow-[0_2px_12px_rgba(0,229,255,0.15)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Security Ticket
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg flex gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {/* Status */}
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block">Workflow State</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-brand-bg border border-gray-800 hover:border-gray-750 focus:border-brand-primary focus:outline-none px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          
          {/* Severity */}
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block">Severity Level</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-brand-bg border border-gray-800 hover:border-gray-750 focus:border-brand-primary focus:outline-none px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incident List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <span className="text-xs font-mono text-gray-500">Retrieving tickets...</span>
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-brand-cards border border-gray-800 rounded-xl p-16 text-center text-gray-500 shadow-md">
          <CheckCircle2 className="w-10 h-10 text-brand-success mx-auto mb-2 opacity-60" />
          <h4 className="font-semibold text-gray-200">Incident Queue Clear</h4>
          <p className="text-xs text-gray-500 mt-1">No pending security breach tickets matching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {incidents.map((inc) => (
            <div 
              key={inc.incident_id}
              className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-gray-700/80 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-gray-900 border border-gray-850 text-gray-400">
                    INC-{inc.incident_id}
                  </span>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={inc.severity} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase ${getStatusStyle(inc.status)}`}>
                      {inc.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-200 truncate">{inc.title}</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2 h-8">{inc.description || 'No detailed description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-gray-800/60 pt-3">
                  <div className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-600" />
                    <span>{formatDate(inc.created_at)}</span>
                  </div>
                  <div className="text-gray-400 flex items-center gap-1 justify-end">
                    <User className="w-3.5 h-3.5 text-brand-primary" />
                    <span className="truncate max-w-28 font-bold uppercase text-brand-primary">
                      {inc.analyst?.username || 'UNASSIGNED'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-800/40 pt-4 mt-4">
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteIncident(inc.incident_id)}
                    className="p-2 rounded bg-gray-900 hover:bg-brand-danger/10 hover:text-brand-danger border border-gray-850 transition-colors cursor-pointer text-gray-500"
                    title="Delete ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleOpenUpdateModal(inc)}
                  className="p-2 rounded bg-gray-900 hover:bg-gray-800 border border-gray-850 text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <Edit3 className="w-4 h-4" /> Update
                </button>
                <button
                  onClick={() => handleInvestigateIncident(inc)}
                  className="px-3 py-1.5 rounded-lg bg-brand-primary text-black font-semibold text-xs hover:bg-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Investigate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Create Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-brand-cards border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Open Security Incident Ticket</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Ticket Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Host port probe scan anomalous activity from 192.168.1.50"
                  className="w-full bg-brand-bg border border-gray-800 focus:border-brand-primary focus:outline-none px-3.5 py-2.5 rounded-lg text-xs text-gray-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Incident Details</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows="3"
                  placeholder="Describe indicators, affected servers, and raw packet logs snippets..."
                  className="w-full bg-brand-bg border border-gray-800 focus:border-brand-primary focus:outline-none px-3.5 py-2.5 rounded-lg text-xs text-gray-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-brand-bg border border-gray-800 focus:border-brand-primary focus:outline-none px-3 py-2.5 rounded-lg text-xs text-gray-300 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Delegate Analyst</label>
                  <select
                    value={newAnalystId}
                    onChange={(e) => setNewAnalystId(e.target.value)}
                    className="w-full bg-brand-bg border border-gray-800 focus:border-brand-primary focus:outline-none px-3 py-2.5 rounded-lg text-xs text-gray-300 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {analysts.map((a) => (
                      <option key={a.id} value={a.id}>{a.username.toUpperCase()} ({a.role.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary text-black font-semibold text-xs rounded-lg hover:bg-cyan-400 cursor-pointer"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Update Incident Modal */}
      {updateModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-brand-cards border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Update Incident Ticket</h3>
                <span className="text-[9px] font-mono text-gray-500">INCIDENT ID: INC-{selectedIncident.incident_id}</span>
              </div>
              <button onClick={() => setUpdateModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUpdateIncident} className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block">Incident Title</span>
                <span className="text-xs font-semibold text-gray-300 block">{selectedIncident.title}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Incident Details / Journal</label>
                <textarea
                  value={updateDesc}
                  onChange={(e) => setUpdateDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-brand-bg border border-gray-800 focus:border-brand-primary focus:outline-none px-3.5 py-2.5 rounded-lg text-xs text-gray-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Triage Workflow Status</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full bg-brand-bg border border-gray-800 focus:border-brand-primary focus:outline-none px-3 py-2.5 rounded-lg text-xs text-gray-300 cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Delegate Analyst</label>
                  <select
                    value={updateAnalystId}
                    onChange={(e) => setUpdateAnalystId(e.target.value)}
                    className="w-full bg-brand-bg border border-gray-800 focus:border-brand-primary focus:outline-none px-3 py-2.5 rounded-lg text-xs text-gray-300 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {analysts.map((a) => (
                      <option key={a.id} value={a.id}>{a.username.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary text-black font-semibold text-xs rounded-lg hover:bg-cyan-400 cursor-pointer"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;
