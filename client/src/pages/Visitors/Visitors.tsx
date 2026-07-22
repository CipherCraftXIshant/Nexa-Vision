import React, { useEffect, useState } from 'react';
import { Users, Eye, UserPlus, Trash2, Search, Filter, Calendar, MapPin, CheckCircle2, X } from 'lucide-react';
import { api } from '../../services/api';
import { IVisitor } from '../../../../shared/types';

export const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<IVisitor[]>([]);
  const [search, setSearch] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<IVisitor | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertName, setConvertName] = useState('');
  const [convertEmail, setConvertEmail] = useState('');
  const [convertDept, setConvertDept] = useState('Operations');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, [search]);

  const fetchVisitors = async () => {
    try {
      const res = await api.get(`/visitors?search=${search}`);
      if (res.data.success) {
        setVisitors(res.data.visitors);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitor) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/visitors/${selectedVisitor.id}/convert`, {
        name: convertName,
        email: convertEmail,
        department: convertDept,
        role: 'USER'
      });
      if (res.data.success) {
        setIsConvertModalOpen(false);
        setSelectedVisitor(null);
        fetchVisitors();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this visitor log?')) return;
    try {
      await api.delete(`/visitors/${id}`);
      fetchVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-1">
            <Eye className="w-4 h-4" />
            <span>UNREGISTERED SUBJECT QUEUE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Visitor Management</h1>
          <p className="text-xs text-slate-400 mt-1">Review unknown face snapshots and convert visitors to registered users.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search visitor ID or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Visitors Snapshot Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visitors.map((visitor) => (
          <div key={visitor.id} className="p-5 rounded-3xl bg-dark-card border border-dark-border glass-card space-y-4 hover:border-slate-700 transition-all">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-dark-border">
              <img src={visitor.snapshotUrl} alt={visitor.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-dark-bg/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-dark-border font-bold">
                {(visitor.confidence * 100).toFixed(0)}% Detection
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{visitor.name || 'Unknown Visitor'}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {visitor.visitorId}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{visitor.cameraLocation}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{new Date(visitor.lastSeen).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-dark-border">
              <button
                onClick={() => {
                  setSelectedVisitor(visitor);
                  setConvertName(visitor.name !== 'Unknown Visitor' ? visitor.name : '');
                  setIsConvertModalOpen(true);
                }}
                className="flex-1 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-accent border border-brand-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Convert to User</span>
              </button>

              <button
                onClick={() => handleDelete(visitor.id)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Convert Visitor to User Modal */}
      {isConvertModalOpen && selectedVisitor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-3xl p-6 shadow-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h3 className="text-sm font-bold text-white">Convert Visitor to Registered User</h3>
              <button onClick={() => setIsConvertModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvert} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={convertName}
                  onChange={(e) => setConvertName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={convertEmail}
                  onChange={(e) => setConvertEmail(e.target.value)}
                  placeholder="john.doe@nexavision.io"
                  className="w-full px-3.5 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={convertDept}
                  onChange={(e) => setConvertDept(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
                >
                  {isSubmitting ? 'Converting...' : 'Save & Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
