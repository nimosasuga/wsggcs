import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, RefreshCw, ShieldAlert, Check } from 'lucide-react';
import { api } from '../../services/api';

interface RenameTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTableName: string) => void;
  tableName: string;
  database?: string;
}

export const RenameTableModal: React.FC<RenameTableModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tableName,
  database,
}) => {
  const [newTableName, setNewTableName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewTableName(tableName);
      setError(null);
    }
  }, [isOpen, tableName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanName) {
      setError('Nama tabel baru wajib diisi (hanya huruf kecil, angka, dan garis bawah).');
      return;
    }

    if (cleanName === tableName) {
      setError('Nama tabel baru sama dengan nama saat ini.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.renameTable(tableName, cleanName, database);
      if (res.ok) {
        onSuccess(cleanName);
        onClose();
      } else {
        setError(res.error || 'Gagal mengubah nama tabel.');
      }
    } catch (err: any) {
      setError(err.message || 'Error koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              <Tag size={15} />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">Ganti Nama Tabel</span>
              <span className="text-slate-400 text-xs ml-1.5 font-sans">&bull;</span>
              <span className="font-mono text-xs font-bold text-blue-700 ml-1">{tableName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs font-sans">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* AppSheet Warning Notice */}
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <ShieldAlert size={15} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Peringatan Integrasi:</strong> Mengubah nama tabel akan memutuskan referensi query lama dan webhook. Jika tabel terhubung ke AppSheet, pastikan memperbarui koneksi tabel di AppSheet.
            </div>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">
              Nama Tabel Saat Ini:
            </label>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-mono select-all">
              {tableName}
            </div>
          </div>

          <div>
            <label className="text-slate-800 font-semibold block mb-1">
              Nama Tabel Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="nama_tabel_baru"
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              required
              autoFocus
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Gunakan huruf kecil, angka, dan garis bawah (_).
            </span>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || newTableName === tableName}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Mengubah...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Ganti Nama Tabel</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
