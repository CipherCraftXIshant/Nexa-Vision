import React, { useState, useEffect } from 'react';
import { Search, Bell, ShieldCheck, Activity, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { INotification } from '../../../shared/types';

interface NavbarProps {
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const { isConnected, socket } = useSocket();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpenNotif, setIsOpenNotif] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.unreadCount);
        }
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifs();

    if (socket) {
      socket.on('notification:new', (notif: INotification) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    }

    return () => {
      if (socket) socket.off('notification:new');
    };
  }, [socket]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Keep server error details out of browser logs.
    }
  };

  return (
    <header className="h-16 border-b border-dark-border bg-dark-card/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Search Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-dark-bg/60 border border-dark-border text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all text-xs font-medium w-64 justify-between"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5" />
          <span>Search command or person...</span>
        </div>
        <kbd className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
          ⌘K
        </kbd>
      </button>

      {/* Status Indicators & Action Bar */}
      <div className="flex items-center gap-4">
        {/* System Health Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AI Engine Engine Online</span>
        </div>

        {/* Real-time Socket Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Activity className={`w-3.5 h-3.5 ${isConnected ? 'text-brand-accent' : 'text-rose-500'}`} />
          <span>{isConnected ? 'LIVE' : 'DISCONNECTED'}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsOpenNotif(!isOpenNotif)}
            className="relative p-2 rounded-xl bg-dark-surface border border-dark-border text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center border border-dark-card">
                {unreadCount}
              </span>
            )}
          </button>

          {isOpenNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-2xl shadow-2xl z-50 p-4 space-y-3 glass-panel">
              <div className="flex items-center justify-between border-b border-dark-border pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Alert Center</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-brand-accent hover:underline"
                  >
                    Mark all read
                  </button>
                  <button onClick={() => setIsOpenNotif(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No recent notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        n.read
                          ? 'bg-dark-bg/30 border-dark-border text-slate-400'
                          : 'bg-brand-500/10 border-brand-500/20 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-white mb-0.5">
                        {n.type === 'UNKNOWN_FACE' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{n.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
