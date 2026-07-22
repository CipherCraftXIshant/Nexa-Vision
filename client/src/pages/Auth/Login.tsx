import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@nexavision.io');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      navigate('/');
    } else {
      setError('Invalid email or password credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow background accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-3xl p-8 shadow-2xl relative z-10 glass-panel">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent flex items-center justify-center shadow-lg shadow-brand-500/30 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to NexaVision</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise AI Vision Intelligence Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="admin@nexavision.io"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all duration-200 mt-2"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Platform</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credential Quick-Select */}
        <div className="mt-8 pt-6 border-t border-dark-border">
          <p className="text-[11px] font-mono uppercase text-slate-400 text-center mb-3">Pre-configured Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setEmail('admin@nexavision.io'); setPassword('Password@123'); }}
              className="p-2 rounded-xl bg-dark-bg/60 border border-dark-border hover:border-brand-500/50 text-[11px] text-slate-300 text-left transition-colors"
            >
              <span className="font-bold text-white block">Super Admin</span>
              <span className="text-slate-400 text-[10px]">admin@nexavision.io</span>
            </button>
            <button
              onClick={() => { setEmail('sarah.c@nexavision.io'); setPassword('Password@123'); }}
              className="p-2 rounded-xl bg-dark-bg/60 border border-dark-border hover:border-brand-500/50 text-[11px] text-slate-300 text-left transition-colors"
            >
              <span className="font-bold text-white block">Security Officer</span>
              <span className="text-slate-400 text-[10px]">sarah.c@nexavision.io</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
