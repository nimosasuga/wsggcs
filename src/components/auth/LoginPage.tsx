import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, RefreshCw, Server } from 'lucide-react';
import { api } from '../../services/api';
import { AuthUser } from '../../types/database';
import { BrandLogo } from '../common/BrandLogo';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('washeng');
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
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 pb-1 border-b border-slate-100">
          <BrandLogo size="lg" showSubtitle={false} className="justify-center mb-1" />
          <p className="text-xs text-slate-500 font-sans">
            Masuk untuk mengelola database MySQL
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
                placeholder="washeng"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                required
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
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                required
                autoFocus
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
