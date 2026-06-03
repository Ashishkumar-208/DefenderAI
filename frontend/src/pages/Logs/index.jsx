import React, { useState, useEffect } from 'react';
import LogUpload from '../../components/Upload';
import { useAuth } from '../../context/AuthContext';
import { 
  FileCode, Search, Trash2, Download, AlertTriangle, Eye, ShieldAlert,
  ChevronLeft, ChevronRight, Filter, Database, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatDate } from '../../utils/format';

const Logs = () => {
  const { isAdmin } = useAuth();
  
  // State
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  
  const limit = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let url = `/logs/list?skip=${skip}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (severity) url += `&severity=${severity}`;
      if (eventType) url += `&event_type=${eventType}`;
      
      const res = await api.get(url);
      setLogs(res.data.logs);
      setTotal(res.data.total);

      // Fetch dynamic event types to keep in sync
      const typesRes = await api.get('/logs/event-types');
      setEventTypes(typesRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve security logs pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, severity, eventType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this log and all its associated threat flags?')) return;
    
    try {
      await api.delete(`/logs/delete/${logId}`);
      toast.success('Log entry successfully purged.');
      if (selectedLog?.log_id === logId) setSelectedLog(null);
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error('Could not delete log record.');
    }
  };

  const handleExportCSV = () => {
    // Direct stream download trigger
    window.open('http://localhost:8000/reports/export/logs', '_blank');
    toast.success('Exporting logs CSV download.');
  };

  const getLogSeverityClass = (sev) => {
    const s = sev?.toLowerCase();
    if (s === 'critical' || s === 'high') return 'text-brand-danger';
    if (s === 'medium') return 'text-brand-warning';
    return 'text-brand-success';
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-brand-primary" />
            Log Management Pipeline
          </h1>
          <p className="text-xs text-gray-500 mt-1">Upload, search, filter, and audit network events logs</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700/80 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LogUpload onUploadSuccess={() => { setPage(1); fetchLogs(); }} />
        </div>
        
        {/* Search & Filter controls */}
        <div className="lg:col-span-2 bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-primary" /> Query Filter Settings
            </h3>
            
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search raw logs by text query, IP address, etc."
                  className="w-full bg-brand-bg border border-gray-800 hover:border-gray-750 focus:border-brand-primary focus:outline-none pl-9 pr-4 py-2 rounded-lg text-xs placeholder-gray-500 text-gray-200 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-brand-primary text-black font-semibold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="grid grid-cols-2 gap-4">
              {/* Severity Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block">Classify Severity</label>
                <select
                  value={severity}
                  onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                  className="w-full bg-brand-bg border border-gray-800 hover:border-gray-750 focus:border-brand-primary focus:outline-none px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Event Type Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-gray-500 block">Device Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => { setEventType(e.target.value); setPage(1); }}
                  className="w-full bg-brand-bg border border-gray-800 hover:border-gray-750 focus:border-brand-primary focus:outline-none px-3 py-2 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
                >
                  <option value="">All Events</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-gray-500 pt-4 border-t border-gray-850 mt-4">
            Processed database records count: <span className="text-brand-primary">{total}</span> events matching criteria.
          </div>
        </div>
      </div>

      {/* Main logs list */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table list */}
        <div className="xl:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-xl bg-brand-cards border border-gray-800 shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/40 text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                  <th className="px-5 py-4">Timestamp</th>
                  <th className="px-5 py-4">Source IP</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Severity</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs text-gray-300 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-primary mx-auto mb-2" />
                      Loading log streams...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-gray-500">
                      <Database className="w-8 h-8 mx-auto text-gray-600 mb-2 opacity-50" />
                      No logs found. Upload syslog files above.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr 
                      key={log.log_id} 
                      className={`hover:bg-gray-800/20 transition-colors cursor-pointer ${selectedLog?.log_id === log.log_id ? 'bg-gray-800/30 border-l-2 border-brand-primary' : ''}`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-5 py-3 text-[10px] text-gray-500">{formatDate(log.timestamp)}</td>
                      <td className="px-5 py-3 font-semibold text-brand-primary">{log.source_ip}</td>
                      <td className="px-5 py-3 uppercase tracking-wider text-gray-400 text-[10px]">{log.event_type}</td>
                      <td className={`px-5 py-3 font-bold uppercase tracking-wider ${getLogSeverityClass(log.severity)}`}>
                        {log.severity}
                      </td>
                      <td className="px-5 py-3 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white cursor-pointer"
                          title="View raw log line"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteLog(log.log_id)}
                            className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-500 hover:text-brand-danger hover:border-brand-danger/30 cursor-pointer"
                            title="Delete log record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-brand-cards border border-gray-800 px-5 py-3 rounded-lg shadow-lg">
              <span className="text-xs text-gray-500">
                Showing page <span className="text-gray-300 font-semibold">{page}</span> of <span className="text-gray-300 font-semibold">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded bg-gray-900 border border-gray-850 hover:bg-gray-800 text-gray-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded bg-gray-900 border border-gray-850 hover:bg-gray-800 text-gray-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Log Drawer/Panel */}
        <div className="xl:col-span-1">
          {selectedLog ? (
            <div className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-xl space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <h4 className="text-xs font-semibold text-gray-200 font-mono">LOG_ID: {selectedLog.log_id}</h4>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mt-0.5">Telemetry inspect view</span>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Ingestion Source</span>
                  <span className="font-mono text-xs font-bold text-brand-primary">{selectedLog.source_ip} → {selectedLog.destination_ip}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Event Category</span>
                  <span className="font-mono text-xs text-gray-300 uppercase">{selectedLog.event_type}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Trigger Timestamp</span>
                  <span className="font-mono text-xs text-gray-300">{formatDate(selectedLog.timestamp)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Raw System Payload</span>
                <div className="w-full bg-gray-950 p-4 rounded-lg border border-gray-850 font-mono text-[10px] text-gray-400 overflow-x-auto max-h-56 leading-relaxed whitespace-pre-wrap">
                  {selectedLog.raw_log}
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden xl:flex flex-col items-center justify-center bg-brand-cards/30 border border-gray-800 border-dashed rounded-xl p-12 text-center text-gray-600 h-[220px]">
              <Eye className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-xs">Select any row from the pipeline table to view its raw system log payloads</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
