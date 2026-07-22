import React, { useEffect, useState } from 'react';
import { History, Download, Search, Filter, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';
import { api } from '../../services/api';
import { IRecognitionLog } from '../../../../shared/types';

export const RecognitionLogs: React.FC = () => {
  const [logs, setLogs] = useState<IRecognitionLog[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [personTypeFilter, setPersonTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [search, statusFilter, personTypeFilter, page]);

  const fetchLogs = async () => {
    try {
      const res = await api.get(
        `/recognition/logs?search=${search}&status=${statusFilter}&personType=${personTypeFilter}&page=${page}`
      );
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Person Name', 'Type', 'Camera Location', 'Confidence', 'Status', 'Timestamp'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.personName}"`,
      l.personType,
      `"${l.cameraLocation}"`,
      `${(l.confidence * 100).toFixed(1)}%`,
      l.status,
      `"${new Date(l.timestamp).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NexaVision_Audit_Logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-accent text-xs font-mono mb-1">
            <History className="w-4 h-4" />
            <span>AUDIT TRAIL TELEMETRY</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Recognition History & Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">Complete verification log history across all deployed camera streams.</p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 rounded-xl bg-dark-card border border-dark-border text-slate-200 hover:text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-lg"
        >
          <Download className="w-4 h-4 text-brand-accent" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-dark-card border border-dark-border glass-panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by person name or camera..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-300 font-medium"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="SUCCESS">Verified (SUCCESS)</option>
            <option value="UNKNOWN">Unregistered (UNKNOWN)</option>
          </select>

          <select
            value={personTypeFilter}
            onChange={(e) => setPersonTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-300 font-medium"
          >
            <option value="ALL">All Person Types</option>
            <option value="User">Registered User</option>
            <option value="Visitor">Visitor</option>
          </select>
        </div>
      </div>

      {/* Audit Trail Data Table */}
      <div className="rounded-3xl bg-dark-card border border-dark-border overflow-hidden glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-bg/60 border-b border-dark-border uppercase text-[10px] font-mono text-slate-400">
              <tr>
                <th className="px-6 py-4">Snapshot</th>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Person Type</th>
                <th className="px-6 py-4">Camera Endpoint</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3">
                    <img src={l.snapshotUrl} alt={l.personName} className="w-9 h-9 rounded-xl object-cover border border-dark-border" />
                  </td>
                  <td className="px-6 py-3 font-semibold text-white">{l.personName}</td>
                  <td className="px-6 py-3">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {l.personType}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400">{l.cameraLocation}</td>
                  <td className="px-6 py-3 font-mono font-bold text-brand-accent">
                    {(l.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                        l.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-500 text-[11px]">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
