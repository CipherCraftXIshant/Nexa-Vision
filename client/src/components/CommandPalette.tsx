import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Camera, UserCheck, Users, History, Shield, Settings, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { label: 'Go to Overview Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Open Live Camera Feeds', path: '/live-camera', icon: Camera },
    { label: 'Register New Face Profile', path: '/registration', icon: UserCheck },
    { label: 'View Visitor Queue & Snapshots', path: '/visitors', icon: Users },
    { label: 'View Recognition Logs & History', path: '/logs', icon: History },
    { label: 'System Admin Panel', path: '/admin', icon: Shield },
    { label: 'Platform Settings', path: '/settings', icon: Settings }
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-xl bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden glass-panel">
        <div className="p-4 border-b border-dark-border flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or search feature..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No matching commands found.</p>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.path}
                  onClick={() => {
                    navigate(cmd.path);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-brand-500/15 hover:border-brand-500/30 border border-transparent transition-all text-left"
                >
                  <Icon className="w-4 h-4 text-brand-accent" />
                  <span>{cmd.label}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-dark-border bg-dark-bg/60 text-[10px] text-slate-500 flex justify-between font-mono">
          <span>Navigate: ⬆ ⬇</span>
          <span>Select: ↵</span>
          <span>Close: ESC</span>
        </div>
      </div>
    </div>
  );
};
