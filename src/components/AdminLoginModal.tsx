import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, KeyRound, AlertCircle, X, ShieldCheck } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, pendingActionName } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password. Please try again.');
    } else {
      setUsername('');
      setPassword('');
      setError(null);
    }
  };

  const handleClose = () => {
    setError(null);
    setUsername('');
    setPassword('');
    closeLoginModal();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-inner shrink-0">
              <img
                src="/logo.png"
                alt="PAS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white">Admin Authentication</h3>
              <p className="text-xs text-slate-400">PAS Portal Security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Prompt Banner */}
        {pendingActionName && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Admin login required to <strong>{pendingActionName}</strong>.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Login as Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
