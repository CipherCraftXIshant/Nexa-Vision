import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  UserCheck,
  Users,
  History,
  Shield,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Live Cameras', path: '/live-camera', icon: Camera, badge: 'LIVE' },
    { label: 'Face Registration', path: '/registration', icon: UserCheck },
    { label: 'Visitor Queue', path: '/visitors', icon: Users },
    { label: 'Recognition Logs', path: '/logs', icon: History },
    { label: 'System Admin', path: '/admin', icon: Shield, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-dark-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse-slow" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              NexaVision
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-accent border border-brand-500/20">
                v2.4
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Vision Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            if (item.roles && user && !item.roles.includes(user.role)) {
              return null;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600/20 to-brand-500/10 text-white border border-brand-500/30 shadow-md shadow-brand-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-dark-border bg-dark-bg/40">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-surface border border-dark-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'}
              alt={user?.name}
              className="w-9 h-9 rounded-lg object-cover border border-dark-border"
            />
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Operator'}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.role || 'OPERATOR'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
