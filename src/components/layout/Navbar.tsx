import React from 'react';
import { 
  Database, Terminal, Table2, Activity, Download, Menu, X, 
  Layers, LogOut, User, Plus, Columns
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../../types/database';
import { BrandLogo } from '../common/BrandLogo';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  databases: string[];
  currentDatabase: string;
  onSelectDatabase: (db: string) => void;
  connectionStatus: { ok: boolean; latencyMs: number };
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenCreateDatabase?: () => void;
  onOpenMobileSidebar?: () => void;
  tablesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  databases,
  currentDatabase,
  onSelectDatabase,
  connectionStatus,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentUser,
  onLogout,
  onOpenCreateDatabase,
  onOpenMobileSidebar,
  tablesCount,
}) => {
  const navItems = [
    { id: 'tables' as ActiveTab, label: 'Daftar Tabel', icon: Layers },
    { id: 'data' as ActiveTab, label: 'Jelajahi (Browse)', icon: Table2 },
    { id: 'structure' as ActiveTab, label: 'Struktur', icon: Columns },
    { id: 'workspace' as ActiveTab, label: 'SQL', icon: Terminal },
    { id: 'monitor' as ActiveTab, label: 'Status & Proses', icon: Activity },
    { id: 'export' as ActiveTab, label: 'Ekspor / Impor', icon: Download },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 select-none shadow-2xs">
      <div className="w-full px-2.5 sm:px-4 h-12 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand & Mobile Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle Navigation"
            title="Menu Halaman"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
              title="Buka Daftar Tabel"
            >
              <Table2 size={13} />
              <span className="hidden xs:inline">Tabel</span>
              {tablesCount !== undefined && (
                <span className="text-[10px] font-mono font-bold px-1 rounded bg-blue-200/80 text-blue-900">
                  {tablesCount}
                </span>
              )}
            </button>
          )}

          <BrandLogo size="sm" showSubtitle={false} />
        </div>

        {/* Center: Clean Navigation Tabs (phpMyAdmin / TablePlus style) */}
        <nav className="hidden md:flex items-center gap-0.5 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-600 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Database Selector, Status & User */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Database Selector with clean styling */}
          <div className="flex items-center gap-1">
            <div className="relative flex items-center">
              <Database size={13} className="absolute left-2 sm:left-2.5 text-slate-400 pointer-events-none" />
              <select
                value={currentDatabase}
                onChange={(e) => onSelectDatabase(e.target.value)}
                className="max-w-[105px] xs:max-w-[130px] sm:max-w-[180px] bg-slate-50 hover:bg-white text-slate-800 text-xs rounded-md border border-slate-300 pl-6 sm:pl-7 pr-5 sm:pr-6 py-1 focus:outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer appearance-none font-mono font-medium truncate"
                title={`Database Aktif: ${currentDatabase}`}
              >
                {databases.map((db) => (
                  <option key={db} value={db}>
                    {db}
                  </option>
                ))}
              </select>
            </div>

            {currentUser?.role === 'super-admin' && onOpenCreateDatabase && (
              <button
                onClick={onOpenCreateDatabase}
                className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer flex items-center justify-center"
                title="Buat Database Baru"
              >
                <Plus size={13} />
              </button>
            )}
          </div>

          {/* Connection Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-sans border transition ${
              connectionStatus.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
            title={connectionStatus.ok ? `MySQL Connected (${connectionStatus.latencyMs}ms)` : 'MySQL Disconnected'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus.ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{connectionStatus.ok ? `${connectionStatus.latencyMs}ms` : 'Offline'}</span>
          </div>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700">
                <User size={12} className="text-slate-500" />
                <span className="font-medium">{currentUser.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-3 py-2 space-y-1 shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive ? 'bg-blue-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {currentUser && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>User: <strong className="text-slate-900">{currentUser.username}</strong></span>
              <button onClick={onLogout} className="text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer">
                <LogOut size={12} /> Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
