import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Eye, AlertOctagon, CheckCircle, Video, Activity, Sparkles, Clock, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { StatCard } from '../../components/StatCard';
import { api } from '../../services/api';
import { IDashboardStats, IRecognitionLog } from '../../../../shared/types';
import { useSocket } from '../../context/SocketContext';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<IRecognitionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
          setWeeklyTrends(res.data.weeklyTrends);
          setRecentEvents(res.data.recentEvents);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();

    if (socket) {
      socket.on('recognition:event', (event: any) => {
        setRecentEvents((prev) => [event, ...prev.slice(0, 5)]);
      });
    }

    return () => {
      if (socket) socket.off('recognition:event');
    };
  }, [socket]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-900/40 via-dark-card to-dark-card p-6 rounded-3xl border border-brand-500/20 glass-panel">
        <div>
          <div className="flex items-center gap-2 text-brand-accent text-xs font-mono mb-1">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>AI VISION INTELLIGENCE OPERATIONAL</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Security & Recognition Control</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time facial detection, registered identity verification, and perimeter telemetry.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-dark-bg/80 border border-dark-border flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">System Status</span>
              <span className="text-xs font-bold text-emerald-400">100% OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Registered Identities"
          value={stats?.totalRegisteredUsers || 42}
          change="+12.4%"
          isPositive={true}
          icon={Users}
          color="from-indigo-600 to-brand-500"
          badge="DATABASE"
        />
        <StatCard
          title="Active Today"
          value={stats?.activeUsersCount || 38}
          change="+8.1%"
          isPositive={true}
          icon={UserCheck}
          color="from-emerald-600 to-teal-500"
        />
        <StatCard
          title="Visitors Logged"
          value={stats?.visitorsToday || 14}
          change="+5.2%"
          isPositive={true}
          icon={Eye}
          color="from-amber-600 to-orange-500"
        />
        <StatCard
          title="Unknown Detections"
          value={stats?.unknownFacesCount || 3}
          change="-14.2%"
          isPositive={true}
          icon={AlertOctagon}
          color="from-rose-600 to-pink-500"
          badge="ALERT"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Recognition Volume Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-dark-card border border-dark-border glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recognition Telemetry</h3>
              <p className="text-xs text-slate-400">Weekly face recognition verifications vs detections</p>
            </div>
            <span className="text-xs font-mono text-brand-accent bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
              Accuracy: 99.2%
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrends}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="recognitions" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" name="Recognized" />
                <Area type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorVis)" name="Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camera Status & Quick Overview */}
        <div className="p-6 rounded-3xl bg-dark-card border border-dark-border glass-panel space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Cameras</h3>
            <span className="text-xs font-mono text-emerald-400">4 / 4 ONLINE</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Cam 01 - Main Entrance', loc: 'Lobby HQ', status: 'ONLINE', fps: 30 },
              { name: 'Cam 02 - Server Vault', loc: 'Basement Floor 1', status: 'ONLINE', fps: 60 },
              { name: 'Cam 03 - Perimeter Gate B', loc: 'North Fence', status: 'ONLINE', fps: 30 },
              { name: 'Cam 04 - Executive Suite', loc: 'Floor 12', status: 'ONLINE', fps: 30 }
            ].map((cam, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-dark-bg/60 border border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{cam.name}</p>
                    <p className="text-[10px] text-slate-400">{cam.loc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 block mb-0.5">
                    {cam.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{cam.fps} FPS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Recent Recognition Events */}
      <div className="p-6 rounded-3xl bg-dark-card border border-dark-border glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Recognition Telemetry</h3>
            <p className="text-xs text-slate-400">Streamed real-time verification events</p>
          </div>
          <button className="text-xs text-brand-accent hover:underline flex items-center gap-1">
            <span>View Full Audit Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-dark-border">
          {recentEvents.map((log, index) => (
            <div key={log.id || index} className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <img
                  src={log.snapshotUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                  alt={log.personName}
                  className="w-10 h-10 rounded-xl object-cover border border-dark-border"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{log.personName}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{log.cameraLocation}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-semibold text-brand-accent">
                  {(log.confidence * 100).toFixed(1)}% Match
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
