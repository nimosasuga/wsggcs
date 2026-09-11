import React, { useState } from 'react';
import { X, Plus, Trash2, Database, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { CreateTableColumn } from '../../types/database';
import { api } from '../../services/api';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  database: string;
}

const MYSQL_DATA_TYPES = [
  'INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP',
  'DECIMAL', 'BIGINT', 'TINYINT', 'SMALLINT', 'MEDIUMINT',
  'FLOAT', 'DOUBLE', 'CHAR', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT',
  'BLOB', 'JSON', 'ENUM', 'BOOLEAN'
];

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  database,
}) => {
  const [tableName, setTableName] = useState('');
  const [engine, setEngine] = useState('InnoDB');
  const [collation, setCollation] = useState('utf8mb4_unicode_ci');
  const [columns, setColumns] = useState<CreateTableColumn[]>([
    { name: 'id', type: 'BIGINT', length: '20', nullable: false, isPrimary: true, autoIncrement: true },
    { name: 'created_at', type: 'DATETIME', nullable: true, isPrimary: false, autoIncrement: false },
    { name: 'updated_at', type: 'DATETIME', nullable: true, isPrimary: false, autoIncrement: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      { name: `kolom_${columns.length + 1}`, type: 'VARCHAR', length: '255', nullable: true, isPrimary: false, autoIncrement: false }
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleUpdateColumn = (index: number, field: keyof CreateTableColumn, value: any) => {
    setColumns(
      columns.map((col, i) => {
        if (i !== index) return col;
        return { ...col, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      setError('Nama tabel wajib diisi.');
      return;
    }

    const cleanTableName = tableName.trim().toLowerCase();
    if (!/^[a-z0-9_]+$/.test(cleanTableName)) {
      setError('Nama tabel hanya boleh memuat huruf kecil, angka, dan underscore (_).');
      return;
    }

    for (const c of columns) {
      if (!c.name.trim()) {
        setError('Nama setiap kolom tidak boleh kosong.');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.createTable({
        database,
        tableName: cleanTableName,
        engine,
        collation,
        columns,
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Gagal membuat tabel.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center">
              <Database size={15} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Buat Tabel Baru</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Database: <strong className="text-slate-800">{database}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Table Basic Settings (phpMyAdmin Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Nama Tabel</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="nama_tabel"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Penyimpanan (Engine)</label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="InnoDB">InnoDB (Standar Washeng / Transaksional)</option>
                <option value="MyISAM">MyISAM</option>
                <option value="MEMORY">MEMORY</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Penyortiran (Collation)</label>
              <select
                value={collation}
                onChange={(e) => setCollation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="utf8mb4_unicode_ci">utf8mb4_unicode_ci (Standar Washeng)</option>
                <option value="utf8mb4_general_ci">utf8mb4_general_ci</option>
                <option value="utf8mb4_0900_ai_ci">utf8mb4_0900_ai_ci (MySQL 8.0+)</option>
                <option value="utf8_general_ci">utf8_general_ci</option>
                <option value="latin1_swedish_ci">latin1_swedish_ci</option>
              </select>
            </div>
          </div>

          {/* Columns Definition List (phpMyAdmin Style) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Definisi Kolom Tabel ({columns.length})
              </span>
              <button
                type="button"
                onClick={handleAddColumn}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium shadow-2xs transition cursor-pointer"
              >
                <Plus size={13} className="text-blue-600" /> Tambah Kolom
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full text-left text-xs text-slate-700 font-mono">
                  <thead className="bg-slate-100 border-b border-slate-200 text-[11px] uppercase text-slate-600 font-semibold select-none">
                    <tr>
                      <th className="px-3 py-2 font-sans">Nama Kolom (Name)</th>
                      <th className="px-3 py-2 font-sans">Jenis (Type)</th>
                      <th className="px-3 py-2 font-sans w-24">Panjang/Nilai</th>
                      <th className="px-3 py-2 font-sans text-center w-14">Null</th>
                      <th className="px-3 py-2 font-sans text-center w-32" title="Kunci Utama">Primary Key</th>
                      <th className="px-3 py-2 font-sans text-center w-36" title="Auto Increment">Auto Increment (A_I)</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {columns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-2">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => handleUpdateColumn(idx, 'name', e.target.value)}
                            placeholder="nama_kolom"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={col.type}
                            onChange={(e) => handleUpdateColumn(idx, 'type', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 font-mono cursor-pointer"
                          >
                            {MYSQL_DATA_TYPES.map((dt) => (
                              <option key={dt} value={dt}>
                                {dt}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={col.length || ''}
                            onChange={(e) => handleUpdateColumn(idx, 'length', e.target.value)}
                            placeholder="255"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-mono text-center"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={col.nullable}
                            onChange={(e) => handleUpdateColumn(idx, 'nullable', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            title="Boleh NULL"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={col.isPrimary}
                            onChange={(e) => handleUpdateColumn(idx, 'isPrimary', e.target.checked)}
                            className="rounded border-slate-300 text-amber-500 focus:ring-0 cursor-pointer"
                            title="Primary Key (Kunci Utama)"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={col.autoIncrement}
                            onChange={(e) => handleUpdateColumn(idx, 'autoIncrement', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            title="Auto Increment (A_I)"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {columns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Hapus Kolom"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs disabled:opacity-50 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Menyimpan Tabel...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Simpan Tabel</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
