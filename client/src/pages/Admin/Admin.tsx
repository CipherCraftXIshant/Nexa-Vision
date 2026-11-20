import React, { useEffect, useState } from 'react';
import { Shield, Users, Sliders, Server, Plus, Trash2, Edit3, Key, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { IUser } from '../../../../shared/types';

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [settings, setSettings] = useState<any>({
    recognitionThreshold: 0.65,
    livenessThreshold: 0.6,
    aiModel: 'InsightFace ResNet-50',
    emailNotifications: true
  });
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch {
      setUsers([]);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch {
      // Keep server error details out of browser logs.
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch {
      // Keep server error details out of browser logs.
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Delete user profile?')) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch {
      // Keep server error details out of browser logs.
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/admin/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Keep server error details out of browser logs.
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono mb-1">
            <Shield className="w-4 h-4" />
            <span>ROLE-BASED ACCESS CONTROL & SYSTEM CONFIG</span>
          </div>
          <h1 className="text-2xl font-bold text-white">System Administration</h1>
        </div>

        <div className="flex items-center gap-2 bg-dark-card border border-dark-border p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'users' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            User Roles & Access
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'settings' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Engine Config
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="rounded-3xl bg-dark-card border border-dark-border overflow-hidden glass-panel">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-bg/60 border-b border-dark-border uppercase text-[10px] font-mono text-slate-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role Permission</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3 flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover border border-dark-border" />
                    <div>
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-400">{u.department || 'Operations'}</td>
                  <td className="px-6 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-2.5 py-1 rounded-xl bg-dark-bg border border-dark-border text-[11px] font-mono text-brand-accent focus:outline-none"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="OPERATOR">OPERATOR</option>
                      <option value="USER">USER</option>
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-dark-card border border-dark-border glass-panel space-y-6 max-w-2xl">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>AI Engine parameters updated successfully.</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cosine Similarity Threshold ({(settings.recognitionThreshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.4"
                max="0.95"
                step="0.05"
                value={settings.recognitionThreshold}
                onChange={(e) => setSettings({ ...settings, recognitionThreshold: parseFloat(e.target.value) })}
                className="w-full accent-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">AI Model Backbone</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-xs text-white focus:outline-none"
              >
                <option value="InsightFace ResNet-50">InsightFace ResNet-50 (Preferred)</option>
                <option value="MediaPipe Face Mesh">MediaPipe Face Mesh 468 Landmark</option>
                <option value="OpenCV HOG Landmark">OpenCV HOG Landmark Grid</option>
              </select>
            </div>

            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
