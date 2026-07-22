import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Bell, Shield, Key, Mail, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Account & System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your operator credentials, notifications, and security preferences.</p>
      </div>

      <div className="p-6 rounded-3xl bg-dark-card border border-dark-border glass-panel space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-dark-border">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-xl"
          />
          <div>
            <h2 className="text-lg font-bold text-white">{user?.name}</h2>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-accent border border-brand-500/30 uppercase inline-block mt-2">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                readOnly
                value={user?.name || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
              <input
                type="text"
                readOnly
                value={user?.department || 'Operations'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-300"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Notification Preferences</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-brand-500" />
                <span>Real-time unknown person detection alerts</span>
              </label>
              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-brand-500" />
                <span>Camera endpoint disconnect notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
