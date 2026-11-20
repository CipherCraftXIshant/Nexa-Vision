import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';

export const PasswordSetup: React.FC = () => {
  const [params] = useSearchParams();
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token') || params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!token) return setMessage('The password setup link is missing its invitation token.');
    if (password.length < 12) return setMessage('Use a password with at least 12 characters.');
    if (password !== confirmation) return setMessage('The passwords do not match.');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/setup-password', { token, password });
      setIsSuccess(Boolean(response.data.success));
      setMessage(response.data.message || 'Password set successfully.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Password setup failed. Request a new invitation link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-3xl p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold">Set up your NexaVision password</h1>
          <p className="text-xs text-slate-400 mt-2">Choose a password with at least 12 characters to activate your account.</p>
        </div>
        {message && <div className={`p-3 rounded-xl border text-xs ${isSuccess ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>{message}</div>}
        {!isSuccess && <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs text-slate-300">New password<input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-sm text-white" /></label>
          <label className="block text-xs text-slate-300">Confirm password<input type="password" required minLength={12} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-sm text-white" /></label>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm">{isSubmitting ? 'Saving…' : 'Set password'}</button>
        </form>}
        {isSuccess && <Link to="/login" className="block text-center text-sm text-brand-accent hover:underline">Continue to sign in</Link>}
      </div>
    </div>
  );
};
