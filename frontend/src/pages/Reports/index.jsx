import React, { useState, useEffect } from 'react';
import { 
  FileBarChart, FileText, Download, ShieldCheck,
  Calendar, Clock, Database, AlertCircle, Loader2
} from 'lucide-react';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Reports = () => {
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReportsList = async () => {
    try {
      const res = await api.get('/reports/list');
      setReportsList(res.data);
    } catch (err) {
      console.error('Error fetching reports history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsList();
  }, []);

  const handleDownloadPDF = async () => {
    setGenerating(true);
    const toastId = toast.loading('Generating executive brief brief...');
    try {
      const res = await api.get('/reports/generate', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `DefenderAI_SOC_Brief_${new Date().toISOString().slice(0,10)}.pdf`;
      link.click();
      
      toast.success('Executive PDF report downloaded successfully.', { id: toastId });
      fetchReportsList();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate security PDF report.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = async (dataType) => {
    const toastId = toast.loading(`Compiling export for ${dataType}...`);
    try {
      const res = await api.get(`/reports/export/${dataType}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `DefenderAI_${dataType}_export_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      
      toast.success(`Successfully exported ${dataType} CSV data.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(`Could not compile CSV export for ${dataType}.`, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-brand-primary" />
            Executive Reports & Audits
          </h1>
          <p className="text-xs text-gray-500 mt-1">Generate PDF briefs, export raw CSV streams, and audit generated items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate Triggers */}
        <div className="lg:col-span-1 space-y-6">
          {/* PDF Card */}
          <div className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-lg inline-block text-brand-primary">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">SOC Executive PDF Report</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Compiles logs metrics, threat vectors classification counts, MITRE mapping tactics, and recommended playbooks into a formal PDF report.
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="w-full py-2.5 bg-brand-primary text-black font-bold text-xs rounded-lg hover:bg-cyan-400 focus:outline-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compiling Brief...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Generate PDF Brief</span>
                </>
              )}
            </button>
          </div>

          {/* CSV Card */}
          <div className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="p-3 bg-gray-900 border border-gray-850 rounded-lg inline-block text-gray-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Data Stream Exports (CSV)</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Directly stream raw SQL tables into CSV files for custom spreadsheet audit logs or database ingestion setups.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleExportCSV('logs')}
                className="py-2 bg-gray-900 border border-gray-800 hover:border-gray-750 text-gray-400 hover:text-white rounded text-[10px] font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Logs
              </button>
              <button
                onClick={() => handleExportCSV('threats')}
                className="py-2 bg-gray-900 border border-gray-800 hover:border-gray-750 text-gray-400 hover:text-white rounded text-[10px] font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Threats
              </button>
              <button
                onClick={() => handleExportCSV('incidents')}
                className="py-2 bg-gray-900 border border-gray-800 hover:border-gray-750 text-gray-400 hover:text-white rounded text-[10px] font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Tickets
              </button>
            </div>
          </div>
        </div>

        {/* Auditing Table list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg space-y-3 min-h-[380px]">
            <div>
              <h4 className="text-sm font-semibold text-gray-200">Report Ingestion History & Audits</h4>
              <p className="text-xs text-gray-500">History log tracking every PDF report built by analysts</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 h-full">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                <span className="text-xs font-mono text-gray-500">Retrieving audit histories...</span>
              </div>
            ) : reportsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 h-full border border-dashed border-gray-850 rounded-lg">
                <ShieldCheck className="w-8 h-8 text-gray-600 mb-2 opacity-50" />
                <p className="text-xs">No reports generated yet in this session.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full border border-gray-850 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-850 bg-gray-900/40 text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                      <th className="px-4 py-3">Creation Date</th>
                      <th className="px-4 py-3">Report Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Storage Path</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 text-xs text-gray-400 font-mono">
                    {reportsList.map((r) => (
                      <tr key={r.report_id} className="hover:bg-gray-800/10 transition-colors">
                        <td className="px-4 py-2.5 text-[10px] text-gray-500">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-2.5 text-gray-300 font-sans font-medium">{r.title}</td>
                        <td className="px-4 py-2.5 font-bold text-brand-primary uppercase">{r.type}</td>
                        <td className="px-4 py-2.5 text-[10px] text-gray-600 truncate max-w-40">{r.filepath}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
