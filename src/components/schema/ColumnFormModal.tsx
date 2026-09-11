import React, { useState, useEffect } from 'react';
import { X, Save, Plus, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { ColumnInfo } from '../../types/database';
import { api } from '../../services/api';

interface ColumnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tableName: string;
  database?: string;
  mode: 'add' | 'edit';
  initialColumn?: ColumnInfo | null;
  existingColumns?: ColumnInfo[];
}

const MYSQL_DATA_TYPES = [
  'VARCHAR', 'INT', 'TEXT', 'DATETIME', 'DATE', 'TIMESTAMP',
  'DECIMAL', 'BIGINT', 'TINYINT', 'SMALLINT', 'MEDIUMINT',
  'FLOAT', 'DOUBLE', 'CHAR', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT',
  'BLOB', 'JSON', 'ENUM', 'BOOLEAN'
];

export const ColumnFormModal: React.FC<ColumnFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tableName,
  database,
  mode,
  initialColumn,
  existingColumns = [],
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('VARCHAR');
  const [length, setLength] = useState('255');
  const [nullable, setNullable] = useState(true);
  const [defaultType, setDefaultType] = useState<'NONE' | 'NULL' | 'USER_DEFINED' | 'CURRENT_TIMESTAMP'>('NULL');
  const [customDefault, setCustomDefault] = useState('');
  const [autoIncrement, setAutoIncrement] = useState(false);
  const [comment, setComment] = useState('');
  const [position, setPosition] = useState<'END' | 'FIRST' | 'AFTER'>('END');
  const [afterColumn, setAfterColumn] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (mode === 'edit' && initialColumn) {
        setName(initialColumn.name);
        
        // Parse type and length from initialColumn.type (e.g. "varchar(255)")
        const match = initialColumn.type.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?/);
        if (match) {
          setType(match[1].toUpperCase());
          setLength(match[2] || '');
        } else {
          setType((initialColumn.dataType || 'VARCHAR').toUpperCase());
          setLength('');
        }

        setNullable(initialColumn.nullable);
        setAutoIncrement(Boolean(initialColumn.isAutoIncrement));
        setComment(initialColumn.comment || '');

        if (initialColumn.default === null) {
          setDefaultType(initialColumn.nullable ? 'NULL' : 'NONE');
          setCustomDefault('');
        } else if (String(initialColumn.default).toUpperCase() === 'CURRENT_TIMESTAMP') {
          setDefaultType('CURRENT_TIMESTAMP');
          setCustomDefault('');
        } else {
          setDefaultType('USER_DEFINED');
          setCustomDefault(String(initialColumn.default));
        }
      } else {
        // Add Mode
        setName('');
        setType('VARCHAR');
        setLength('255');
        setNullable(true);
        setDefaultType('NULL');
        setCustomDefault('');
        setAutoIncrement(false);
        setComment('');
        setPosition('END');
        if (existingColumns.length > 0) {
          setAfterColumn(existingColumns[existingColumns.length - 1].name);
        }
      }
    }
  }, [isOpen, mode, initialColumn]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kolom wajib diisi.');
      return;
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanName) {
      setError('Nama kolom tidak valid (hanya huruf, angka, dan garis bawah).');
      return;
    }

    setIsLoading(true);
    setError(null);

    let defaultValue: string | undefined = undefined;
    if (defaultType === 'NULL') {
      defaultValue = nullable ? 'NULL' : undefined;
    } else if (defaultType === 'CURRENT_TIMESTAMP') {
      defaultValue = 'CURRENT_TIMESTAMP';
    } else if (defaultType === 'USER_DEFINED') {
      defaultValue = customDefault;
    }

    const columnPayload = {
      name: cleanName,
      type,
      length: length.trim() || undefined,
      nullable,
      defaultValue,
      autoIncrement,
      comment: comment.trim() || undefined,
    };

    try {
      if (mode === 'add') {
        const res = await api.addColumn(
          tableName,
          columnPayload,
          position,
          position === 'AFTER' ? afterColumn : undefined,
          database
        );
        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Gagal menambahkan kolom.');
        }
      } else {
        // Edit Mode
        const res = await api.modifyColumn(
          tableName,
          initialColumn!.name,
          columnPayload,
          database
        );
        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Gagal mengubah kolom.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${mode === 'add' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {mode === 'add' ? <Plus size={15} /> : <Save size={15} />}
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {mode === 'add' ? 'Tambah Kolom Baru' : 'Ubah Definisi Kolom'}
              </span>
              <span className="text-slate-400 text-xs ml-1.5 font-sans">&bull; Tabel:</span>
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs font-sans">
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
              <strong>Peringatan AppSheet:</strong> Jika tabel ini terhubung ke Google AppSheet, jangan lupa lakukan <em>Regenerate Structure</em> di dashboard AppSheet setelah mengubah atau menambah kolom.
            </div>
          </div>

          {/* Field: Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Nama Kolom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="nama_kolom"
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Jenis Tipe Data (Type)
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                {MYSQL_DATA_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Field: Length & Nullability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Panjang / Nilai (Length)
              </label>
              <input
                type="text"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="misal: 255 atau 10,2"
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Kosongkan jika tipe data tidak memerlukan panjang</span>
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium block mb-1">
                Pengaturan Kolom
              </label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-xs">
                  <input
                    type="checkbox"
                    checked={nullable}
                    onChange={(e) => setNullable(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Boleh Kosong (NULL)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-xs">
                  <input
                    type="checkbox"
                    checked={autoIncrement}
                    onChange={(e) => setAutoIncrement(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Auto Increment (A_I)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Field: Default Value */}
          <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
            <label className="text-slate-700 font-medium block">
              Nilai Bawaan (Default Value)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={defaultType}
                onChange={(e) => setDefaultType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="NONE">Tanpa Nilai Bawaan (None)</option>
                <option value="NULL">NULL</option>
                <option value="CURRENT_TIMESTAMP">CURRENT_TIMESTAMP</option>
                <option value="USER_DEFINED">Ditentukan Sendiri (As defined)</option>
              </select>

              {defaultType === 'USER_DEFINED' && (
                <input
                  type="text"
                  value={customDefault}
                  onChange={(e) => setCustomDefault(e.target.value)}
                  placeholder="Masukkan nilai default"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              )}
            </div>
          </div>

          {/* Field: Position (Only for Add Mode) */}
          {mode === 'add' && existingColumns.length > 0 && (
            <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
              <label className="text-slate-700 font-medium block">
                Posisi Kolom dalam Tabel
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                >
                  <option value="END">Di Akhir Tabel (Standar)</option>
                  <option value="FIRST">Di Awal Tabel (Kolom Pertama)</option>
                  <option value="AFTER">Setelah Kolom Tertentu...</option>
                </select>

                {position === 'AFTER' && (
                  <select
                    value={afterColumn}
                    onChange={(e) => setAfterColumn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    {existingColumns.map((c) => (
                      <option key={c.name} value={c.name}>
                        Setelah: {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Field: Comment */}
          <div className="border-t border-slate-100 pt-2.5">
            <label className="text-slate-700 font-medium block mb-1">
              Komentar Kolom (Opsional)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Catatan / keterangan fungsi kolom..."
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-sans focus:outline-none focus:border-blue-500 focus:bg-white"
            />
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
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>{mode === 'add' ? 'Tambah Kolom' : 'Simpan Perubahan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
