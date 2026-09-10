import React, { useState } from 'react';
import { 
  Search, Table, RefreshCw, PanelLeftClose, 
  PanelLeftOpen, Database, Layers
} from 'lucide-react';
import { TableInfo } from '../../types/database';

interface SidebarProps {
  tables: TableInfo[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  onOpenOverview: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  onOpenOverview,
  isLoading,
  onRefresh,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [search, setSearch] = useState('');

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <aside className="w-11 bg-white border-r border-slate-200 flex flex-col items-center py-2.5 gap-2 select-none shrink-0 shadow-2xs">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
          title="Buka Sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
        <div className="w-6 h-px bg-slate-200 my-0.5" />
        <button
          onClick={onOpenOverview}
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer relative"
          title={`Ringkasan Database (${tables.length} Tabel)`}
        >
          <Layers size={16} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white text-[8px] font-mono rounded-full flex items-center justify-center font-bold">
            {tables.length > 99 ? '99+' : tables.length}
          </span>
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer ${
            isLoading ? 'animate-spin text-blue-600' : ''
          }`}
          title="Refresh Data Tabel"
        >
          <RefreshCw size={14} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-60 sm:w-64 bg-slate-50/70 border-r border-slate-200 flex flex-col select-none shrink-0 h-full">
      {/* Top Sidebar Header & Search */}
      <div className="p-2.5 bg-white border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database size={14} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-800">Tabel</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
              {tables.length}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer ${
                isLoading ? 'animate-spin text-blue-600' : ''
              }`}
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Tutup Sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tabel..."
            className="w-full bg-slate-50 text-slate-800 text-xs rounded-md border border-slate-200 pl-7 pr-2.5 py-1 focus:outline-none focus:border-blue-500 focus:bg-white placeholder:text-slate-400 font-mono transition"
          />
        </div>
      </div>

      {/* Navigation & Tables List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {/* Pinned All Tables Overview */}
        <button
          onClick={onOpenOverview}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition group mb-1 border border-transparent hover:border-blue-100 cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Layers size={13} className="text-blue-600 shrink-0" />
            <span className="truncate font-sans font-semibold">Ringkasan Database</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-800">
            {tables.length}
          </span>
        </button>

        <div className="h-px bg-slate-200/60 my-1 mx-1" />

        {filteredTables.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 font-mono">
            {search ? 'Tidak ada tabel cocok' : 'Belum ada tabel'}
          </div>
        ) : (
          filteredTables.map((tbl) => {
            const isSelected = selectedTable === tbl.name;
            return (
              <button
                key={tbl.name}
                onClick={() => onSelectTable(tbl.name)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left text-xs transition group cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1.5">
                  <Table size={13} className={`shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="truncate font-mono text-[11px]">{tbl.name}</span>
                </div>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-200/60 text-slate-500 group-hover:text-slate-800 shrink-0">
                  {tbl.rows.toLocaleString()}
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
