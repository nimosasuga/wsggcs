import React, { useState } from 'react';
import { X, Database, Plus, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

interface CreateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDbName: string) => void;
}

const CHARSET_OPTIONS = [
  { value: 'utf8mb4', label: 'utf8mb4 (Rekomendasi Washeng / 4-Byte UTF-8)' },
  { value: 'utf8', label: 'utf8 (3-Byte UTF-8)' },
  { value: 'latin1', label: 'latin1 (ISO 8859-1 Western European)' },
  { value: 'ascii', label: 'ascii (US ASCII)' },
];

const COLLATION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  utf8mb4: [
    { value: 'utf8mb4_unicode_ci', label: 'utf8mb4_unicode_ci (Standar Washeng & AppSheet - Akurat)' },
    { value: 'utf8mb4_general_ci', label: 'utf8mb4_general_ci (Performa Cepat)' },
    { value: 'utf8mb4_0900_ai_ci', label: 'utf8mb4_0900_ai_ci (Standar MySQL 8.0+)' },
    { value: 'utf8mb4_bin', label: 'utf8mb4_bin (Binary - Case Sensitive)' },
  ],
  utf8: [
    { value: 'utf8_general_ci', label: 'utf8_general_ci' },
    { value: 'utf8_unicode_ci', label: 'utf8_unicode_ci' },
  ],
  latin1: [
    { value: 'latin1_swedish_ci', label: 'latin1_swedish_ci' },
    { value: 'latin1_general_ci', label: 'latin1_general_ci' },
  ],
  ascii: [
    { value: 'ascii_general_ci', label: 'ascii_general_ci' },
    { value: 'ascii_bin', label: 'ascii_bin' },
  ],
};

export const CreateDatabaseModal: React.FC<CreateDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dbName, setDbName] = useState('');
  const [charset, setCharset] = useState('utf8mb4');
  const [collation, setCollation] = useState('utf8mb4_unicode_ci');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCharsetChange = (newCharset: string) => {
    setCharset(newCharset);
    const availableCollations = COLLATION_OPTIONS[newCharset];
    if (availableCollations && availableCollations.length > 0) {
      setCollation(availableCollations[0].value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = dbName.trim().toLowerCase();

    if (!cleanName) {
      setError('Nama database wajib diisi.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanName)) {
      setError('Nama database hanya boleh memuat huruf alfanumerik (a-z, 0-9) dan garis bawah (_).');
      return;
    }

    if (cleanName.length > 64) {
      setError('Nama database maksimal 64 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.createDatabase({
        name: cleanName,
        charset,
        collation,
      });

      if (res.ok && res.database) {
        setDbName('');
        onSuccess(res.database);
        onClose();
      } else {
        setError(res.error || 'Gagal membuat database.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <Database size={17} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Buat Database Baru</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
                  Admin Washeng
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Buat skema database MySQL baru di server Grand Control Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 font-mono">{error}</div>
            </div>
          )}

          {/* Database Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Nama Database</span>
              <span className="text-[10px] text-slate-400 font-normal font-mono">Contoh: cargo_master, app_backup, db_ekspedisi</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={dbName}
                onChange={(e) => setDbName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="nama_database_baru"
                disabled={isLoading}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Gunakan huruf kecil, angka, dan garis bawah (_). Spasi dan karakter khusus akan otomatis diformat.
            </p>
          </div>

          {/* Charset & Collation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Character Set */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Character Set</label>
              <select
                value={charset}
                onChange={(e) => handleCharsetChange(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                {CHARSET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Collation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Collation</label>
              <select
                value={collation}
                onChange={(e) => setCollation(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                {(COLLATION_OPTIONS[charset] || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Badge */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-start gap-2.5 text-xs text-blue-800">
            <ShieldCheck size={16} className="shrink-0 text-blue-600 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="font-semibold text-blue-900">Standar Washeng & AppSheet:</strong> Konfigurasi default <code className="font-mono bg-blue-100/60 px-1 py-0.5 rounded text-blue-800">utf8mb4_unicode_ci</code> menjamin kompatibilitas penuh dengan karakter emoji, string multibyte, serta integrasi webhook AppSheet.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !dbName.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Membuat Database...</span>
                </>
              ) : (
                <>
                  <Plus size={13} />
                  <span>Buat Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
