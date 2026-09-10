import React, { useState } from 'react';
import { 
  Table as TableIcon, Search, Plus, Eye, Database, Trash2, 
  Wrench, Eraser, RefreshCw, AlertTriangle, CheckCircle2,
  Server
} from 'lucide-react';
import { TableInfo } from '../../types/database';
import { api } from '../../services/api';
import { CreateTableModal } from '../crud/CreateTableModal';
import { RowFormModal } from '../crud/RowFormModal';

interface TablesOverviewProps {
  tables: TableInfo[];
  currentDatabase: string;
  onRefresh: () => void;
  onSelectTable: (tableName: string, view: 'data' | 'structure') => void;
  onOpenCreateDatabase?: () => void;
}

export const TablesOverview: React.FC<TablesOverviewProps> = ({
  tables,
  currentDatabase,
  onRefresh,
  onSelectTable,
  onOpenCreateDatabase,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [insertModalTable, setInsertModalTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [primaryKeys, setPrimaryKeys] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRows = tables.reduce((acc, t) => acc + (t.rows || 0), 0);
  const totalDataBytes = tables.reduce((acc, t) => acc + (t.dataSize || 0), 0);
  const totalIndexBytes = tables.reduce((acc, t) => acc + (t.indexSize || 0), 0);
  const totalBytes = tables.reduce((acc, t) => acc + (t.totalSize || 0), 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTables(filteredTables.map((t) => t.name));
    } else {
      setSelectedTables([]);
    }
  };

  const handleToggleTable = (name: string) => {
    if (selectedTables.includes(name)) {
      setSelectedTables(selectedTables.filter((t) => t !== name));
    } else {
      setSelectedTables([...selectedTables, name]);
    }
  };

  const handleOpenInsert = async (table: string) => {
    try {
      const res = await api.getTableStructure(table, currentDatabase);
      if (res.ok) {
        setTableColumns(res.columns || []);
        setPrimaryKeys(res.primaryKeys || []);
        setInsertModalTable(table);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Gagal memuat struktur kolom: ${err.message}` });
    }
  };

  const handleTruncate = async (table: string) => {
    if (!confirm(`PERINGATAN: Kosongkan seluruh data pada tabel "${table}" (TRUNCATE)? Tindakan ini tidak dapat dibatalkan!`)) {
      return;
    }

    try {
      const res = await api.truncateTable(table, currentDatabase);
      if (res.ok) {
        setActionMessage({ type: 'success', text: `Tabel "${table}" berhasil dikosongkan.` });
        onRefresh();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Gagal mengosongkan tabel.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleDrop = async (table: string) => {
    const inputName = prompt(`PERINGATAN: Ketik nama tabel "${table}" untuk menghapus tabel ini secara permanen:`);
    if (inputName !== table) {
      if (inputName !== null) alert('Nama tabel tidak cocok. Penghapusan dibatalkan.');
      return;
    }

    try {
      const res = await api.dropTable(table, currentDatabase);
      if (res.ok) {
        setActionMessage({ type: 'success', text: `Tabel "${table}" berhasil dihapus.` });
        onRefresh();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Gagal menghapus tabel.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-slate-50 p-2.5 sm:p-3 space-y-2.5">
      {/* Database Summary & Action Bar (Clean phpMyAdmin Style) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs shrink-0">
        {/* Left: Database Details */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <Database size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 font-mono">
                {currentDatabase}
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                MySQL Database
              </span>
            </div>
            {/* Metadata Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 font-sans mt-0.5">
              <span>Total: <strong className="text-slate-800 font-mono">{tables.length}</strong> tabel</span>
              <span>&bull;</span>
              <span>Baris: <strong className="text-slate-800 font-mono">{totalRows.toLocaleString()}</strong></span>
              <span>&bull;</span>
              <span>Ukuran: <strong className="text-slate-800 font-mono">{formatBytes(totalBytes)}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {onOpenCreateDatabase && (
            <button
              onClick={onOpenCreateDatabase}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition cursor-pointer shadow-2xs"
              title="Buat Database Baru"
            >
              <Database size={12} className="text-blue-600" />
              <span>Database Baru</span>
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus size={13} />
            <span>Tabel Baru</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-300 transition cursor-pointer shadow-2xs"
            title="Muat Ulang (Refresh)"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-2.5 rounded-lg border text-xs font-sans flex items-center justify-between gap-2 shadow-2xs shrink-0 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-rose-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100 cursor-pointer p-1">
            &times;
          </button>
        </div>
      )}

      {/* Table Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2 shadow-2xs shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filter dari ${tables.length} tabel...`}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-7 pr-2.5 py-1 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>
        <div className="text-[11px] text-slate-500 font-sans hidden sm:block">
          Menampilkan <strong className="text-slate-800 font-mono">{filteredTables.length}</strong> dari {tables.length} tabel
        </div>
      </div>

      {/* Tables Matrix Table (phpMyAdmin High-Density Style with Sticky Header) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1 h-full min-h-0">
          <table className="w-full text-left text-xs text-slate-700 font-mono">
            <thead className="bg-slate-100/95 sticky top-0 z-10 border-b border-slate-300 text-[11px] uppercase text-slate-600 font-semibold select-none shadow-2xs">
              <tr>
                <th className="px-2.5 py-2 w-8 text-center bg-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedTables.length === filteredTables.length && filteredTables.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-2.5 py-2 font-bold bg-slate-100">Tabel</th>
                <th className="px-2.5 py-2 text-left font-bold bg-slate-100">Tindakan</th>
                <th className="px-2.5 py-2 text-right bg-slate-100">Baris</th>
                <th className="px-2.5 py-2 bg-slate-100">Engine</th>
                <th className="px-2.5 py-2 bg-slate-100">Penyortiran (Collation)</th>
                <th className="px-2.5 py-2 text-right bg-slate-100">Ukuran Data</th>
                <th className="px-2.5 py-2 text-right bg-slate-100">Ukuran Indeks</th>
                <th className="px-2.5 py-2 text-right bg-slate-100">Total Ukuran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400 font-sans text-xs">
                    {search ? `Tidak ada tabel yang cocok dengan "${search}".` : 'Belum ada tabel pada database ini.'}
                  </td>
                </tr>
              ) : (
                filteredTables.map((tbl, index) => {
                  const isChecked = selectedTables.includes(tbl.name);
                  return (
                    <tr key={tbl.name} className={`hover:bg-blue-50/50 transition group ${index % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-2.5 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTable(tbl.name)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="px-2.5 py-1.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <TableIcon size={13} className="text-blue-600 shrink-0" />
                          <button
                            onClick={() => onSelectTable(tbl.name, 'data')}
                            className="hover:text-blue-600 hover:underline transition truncate cursor-pointer font-bold text-left"
                            title="Jelajahi Data"
                          >
                            {tbl.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px] font-sans">
                          <button
                            onClick={() => onSelectTable(tbl.name, 'data')}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                            title="Jelajahi (Browse Data)"
                          >
                            <Eye size={12} className="text-blue-600 shrink-0" />
                            <span>Jelajahi</span>
                          </button>
                          <span className="text-slate-300 select-none">|</span>
                          <button
                            onClick={() => onSelectTable(tbl.name, 'structure')}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 hover:underline cursor-pointer"
                            title="Struktur (Structure Kolom & Indeks)"
                          >
                            <Wrench size={12} className="text-slate-500 shrink-0" />
                            <span>Struktur</span>
                          </button>
                          <span className="text-slate-300 select-none">|</span>
                          <button
                            onClick={() => handleOpenInsert(tbl.name)}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 hover:underline cursor-pointer"
                            title="Sisipkan (Insert Baris Baru)"
                          >
                            <Plus size={12} className="text-emerald-600 shrink-0" />
                            <span>Sisipkan</span>
                          </button>
                          <span className="text-slate-300 select-none">|</span>
                          <button
                            onClick={() => handleTruncate(tbl.name)}
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                            title="Kosongkan (TRUNCATE Semua Baris)"
                          >
                            <Eraser size={12} className="text-amber-600 shrink-0" />
                            <span>Kosongkan</span>
                          </button>
                          <span className="text-slate-300 select-none">|</span>
                          <button
                            onClick={() => handleDrop(tbl.name)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                            title="Hapus Tabel (DROP)"
                          >
                            <Trash2 size={12} className="text-red-500 shrink-0" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-medium text-slate-800">
                        {tbl.rows.toLocaleString()}
                      </td>
                      <td className="px-2.5 py-1.5 text-slate-600 text-[11px]">{tbl.engine}</td>
                      <td className="px-2.5 py-1.5 text-slate-500 text-[11px]">{tbl.collation}</td>
                      <td className="px-2.5 py-1.5 text-right text-slate-700">{formatBytes(tbl.dataSize)}</td>
                      <td className="px-2.5 py-1.5 text-right text-slate-500">{formatBytes(tbl.indexSize)}</td>
                      <td className="px-2.5 py-1.5 text-right font-medium text-slate-800">{formatBytes(tbl.totalSize)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* phpMyAdmin Style Footer Summary Row */}
            {filteredTables.length > 0 && (
              <tfoot className="bg-slate-100/90 border-t border-slate-300 font-semibold text-[11px] text-slate-700 select-none sticky bottom-0 z-10 shadow-xs">
                <tr>
                  <td className="px-2.5 py-1.5 text-center text-slate-500">{filteredTables.length}</td>
                  <td className="px-2.5 py-1.5 font-bold font-sans">Total: {filteredTables.length} Tabel</td>
                  <td className="px-2.5 py-1.5"></td>
                  <td className="px-2.5 py-1.5 text-right font-bold text-slate-900">{totalRows.toLocaleString()}</td>
                  <td className="px-2.5 py-1.5 text-slate-500">InnoDB</td>
                  <td className="px-2.5 py-1.5 text-slate-500">-</td>
                  <td className="px-2.5 py-1.5 text-right">{formatBytes(totalDataBytes)}</td>
                  <td className="px-2.5 py-1.5 text-right">{formatBytes(totalIndexBytes)}</td>
                  <td className="px-2.5 py-1.5 text-right font-bold text-slate-900">{formatBytes(totalBytes)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          onRefresh();
          setActionMessage({ type: 'success', text: 'Tabel baru berhasil dibuat.' });
        }}
        database={currentDatabase}
      />

      {/* Insert Row Modal */}
      <RowFormModal
        isOpen={insertModalTable !== null}
        onClose={() => setInsertModalTable(null)}
        onSuccess={() => {
          onRefresh();
          setActionMessage({ type: 'success', text: `Baris baru berhasil ditambahkan ke ${insertModalTable}.` });
        }}
        tableName={insertModalTable || ''}
        database={currentDatabase}
        mode="create"
        columns={tableColumns}
        primaryKeys={primaryKeys}
      />
    </div>
  );
};
