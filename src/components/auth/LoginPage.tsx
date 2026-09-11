import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, RefreshCw, Server } from 'lucide-react';
import { api } from '../../services/api';
import { AuthUser } from '../../types/database';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(username, password);
      if (res.ok && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Username atau password salah.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menghubungi server database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-100/80 px-4 select-none font-sans">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-xl shadow-md p-6 sm:p-7 space-y-5">
        {/* Brand Header with Corporate Logo */}
        <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-slate-100">
          <div className="w-full flex items-center justify-center py-2 px-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <img
              src="/img/logo-login.jpg"
              alt="Bintara Teknologi Nusa"
              className="h-13 sm:h-15 w-auto max-w-full object-contain mix-blend-multiply"
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-bold text-slate-800 text-sm tracking-tight">Washeng DB Studio</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                MySQL
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Grand Control Management & Database Ops
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs" autoComplete="off">
          <div className="space-y-1">
            <label className="text-slate-700 font-medium block">
              Username
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                autoComplete="off"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 font-medium block">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                autoComplete="new-password"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer text-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Server Info Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Server size={12} className="text-slate-400" />
            <span>MySQL Server</span>
          </span>
          <span className="font-mono">Port 3306</span>
        </div>
      </div>
    </div>
  );
};
