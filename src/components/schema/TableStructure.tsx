import React, { useState, useEffect } from 'react';
import { Key, Wrench, Database, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { ColumnInfo, IndexInfo } from '../../types/database';
import { api } from '../../services/api';

interface TableStructureProps {
  tableName: string | null;
  currentDatabase: string;
}

export const TableStructure: React.FC<TableStructureProps> = ({ tableName, currentDatabase }) => {
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizeMessage, setOptimizeMessage] = useState<string | null>(null);

  const loadStructure = async () => {
    if (!tableName) return;
    setIsLoading(true);
    setOptimizeMessage(null);

    try {
      const res = await api.getTableStructure(tableName, currentDatabase);
      if (res.ok) {
        setColumns(res.columns || []);
        setIndexes(res.indexes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStructure();
  }, [tableName, currentDatabase]);

  const handleOptimize = async () => {
    if (!tableName) return;
    try {
      const res = await api.optimizeTable(tableName, currentDatabase);
      if (res.ok) {
        setOptimizeMessage(`Tabel "${tableName}" berhasil dioptimasi (OPTIMIZE TABLE).`);
      }
    } catch (err: any) {
      setOptimizeMessage(`Gagal optimasi: ${err.message}`);
    }
  };

  if (!tableName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 font-sans text-xs h-full bg-slate-50">
        <Database size={32} className="opacity-30 mb-2 text-blue-600" />
        <p>Pilih tabel di sidebar untuk melihat struktur kolom & indeks</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-slate-50 p-2.5 sm:p-3 space-y-2.5">
      {/* Table Header & Maintenance Button */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 font-mono">{tableName}</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              {columns.length} Kolom
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
              {indexes.length} Indeks
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Database: <span className="font-mono text-slate-800 font-semibold">{currentDatabase}</span>
          </p>
        </div>

        <button
          onClick={handleOptimize}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition shadow-2xs cursor-pointer"
        >
          <Wrench size={13} className="text-amber-700" />
          <span>Optimalkan Tabel (OPTIMIZE TABLE)</span>
        </button>
      </div>

      {optimizeMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans flex items-center gap-2 shrink-0">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
          <span>{optimizeMessage}</span>
        </div>
      )}

      {/* AppSheet Compatibility Notice */}
      <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2 shrink-0">
        <ShieldCheck size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-semibold text-blue-950">Standar Kompatibilitas MySQL:</span> Kolom tanggal disarankan bertipe native SQL (<code className="font-mono font-bold">DATE</code>, <code className="font-mono font-bold">DATETIME</code>, <code className="font-mono font-bold">TIMESTAMP</code>) agar kompatibel dengan sistem dan integrasi webhook.
        </div>
      </div>

      {/* Columns List Section (phpMyAdmin Style) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 font-sans">Struktur Kolom ({columns.length})</span>
        </div>
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-left text-xs text-slate-700 font-mono">
            <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300 text-[11px] uppercase text-slate-600 font-semibold select-none shadow-2xs">
              <tr>
                <th className="px-3 py-2 font-sans w-10 text-center">#</th>
                <th className="px-3 py-2 font-sans">Nama Kolom (Field)</th>
                <th className="px-3 py-2 font-sans">Jenis (Type)</th>
                <th className="px-3 py-2 font-sans">Penyortiran (Collation)</th>
                <th className="px-3 py-2 font-sans text-center">Null</th>
                <th className="px-3 py-2 font-sans text-center">Kunci (Key)</th>
                <th className="px-3 py-2 font-sans">Bawaan (Default)</th>
                <th className="px-3 py-2 font-sans">Ekstra (Extra)</th>
                <th className="px-3 py-2 font-sans">Komentar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {columns.map((col, idx) => {
                const isPri = col.key === 'PRI';
                const isUni = col.key === 'UNI';
                const isMul = col.key === 'MUL';
                return (
                  <tr key={col.name} className={`hover:bg-blue-50/50 transition ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                    <td className="px-3 py-1.5 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="px-3 py-1.5 font-bold text-slate-900 flex items-center gap-1.5">
                      {isPri && <span title="Primary Key"><Key size={12} className="text-amber-500 shrink-0" /></span>}
                      <span>{col.name}</span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="px-1.5 py-0.2 rounded text-[11px] bg-slate-100 text-blue-700 border border-slate-200 font-medium font-mono">
                        {col.type}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-500 text-[11px]">
                      {col.collation || '-'}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          col.nullable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {col.nullable ? 'Ya (YES)' : 'Tidak (NO)'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {isPri ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                          PRIMARY KEY
                        </span>
                      ) : isUni ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-bold border border-purple-300">
                          UNIQUE
                        </span>
                      ) : isMul ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-bold border border-blue-300">
                          INDEX
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">
                      {col.default === null ? <span className="italic text-slate-400">NULL</span> : col.default}
                    </td>
                    <td className="px-3 py-1.5 text-amber-800 font-semibold">
                      {col.extra || '-'}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500 text-[11px]">{col.comment || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indexes Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden shrink-0">
        <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-800 font-sans">Indeks Tabel (Indexes)</span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {indexes.map((idx) => (
            <div key={idx.name} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs font-mono">{idx.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    idx.isPrimary
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : idx.isUnique
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {idx.isPrimary ? 'PRIMARY KEY' : idx.isUnique ? 'UNIQUE' : 'INDEX'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono">
                Kolom: <strong className="text-slate-800">{idx.columns.join(', ')}</strong>
              </p>
              <span className="text-[10px] text-slate-400 block font-mono">Tipe: {idx.indexType}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
