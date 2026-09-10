import React, { useState, useEffect } from 'react';
import { X, Save, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { ColumnInfo } from '../../types/database';
import { api } from '../../services/api';

interface RowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tableName: string;
  database?: string;
  mode: 'create' | 'edit';
  columns: ColumnInfo[];
  primaryKeys: string[];
  initialData?: Record<string, any>;
}

export const RowFormModal: React.FC<RowFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tableName,
  database,
  mode,
  columns,
  primaryKeys,
  initialData,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [nullFlags, setNullFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      const initial: Record<string, any> = {};
      const nulls: Record<string, boolean> = {};

      columns.forEach((col) => {
        if (mode === 'edit' && initialData) {
          const val = initialData[col.name];
          if (val === null || val === undefined) {
            initial[col.name] = '';
            nulls[col.name] = true;
          } else {
            initial[col.name] = typeof val === 'object' ? JSON.stringify(val) : String(val);
            nulls[col.name] = false;
          }
        } else {
          // Create mode
          if (col.isAutoIncrement) {
            initial[col.name] = '';
            nulls[col.name] = false;
          } else if (col.default !== null && col.default !== undefined) {
            initial[col.name] = col.default;
            nulls[col.name] = false;
          } else if (col.nullable) {
            initial[col.name] = '';
            nulls[col.name] = true;
          } else {
            initial[col.name] = '';
            nulls[col.name] = false;
          }
        }
      });

      setFormData(initial);
      setNullFlags(nulls);
    }
  }, [isOpen, mode, initialData, columns]);

  if (!isOpen) return null;

  const handleFieldChange = (colName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [colName]: value }));
    if (nullFlags[colName]) {
      setNullFlags((prev) => ({ ...prev, [colName]: false }));
    }
  };

  const handleToggleNull = (colName: string, checked: boolean) => {
    setNullFlags((prev) => ({ ...prev, [colName]: checked }));
    if (checked) {
      setFormData((prev) => ({ ...prev, [colName]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload: Record<string, any> = {};

      columns.forEach((col) => {
        if (mode === 'create' && col.isAutoIncrement && (!formData[col.name] || formData[col.name] === '')) {
          return;
        }

        if (nullFlags[col.name]) {
          payload[col.name] = null;
        } else {
          const raw = formData[col.name];
          if (raw === undefined || raw === '') {
            payload[col.name] = col.nullable ? null : '';
          } else {
            payload[col.name] = raw;
          }
        }
      });

      if (mode === 'create') {
        const res = await api.insertRow(tableName, payload, database);
        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Gagal menambahkan baris.');
        }
      } else {
        const pkMap: Record<string, any> = {};
        if (primaryKeys.length > 0 && initialData) {
          primaryKeys.forEach((pk) => {
            pkMap[pk] = initialData[pk];
          });
        } else if (initialData) {
          Object.assign(pkMap, initialData);
        }

        const res = await api.updateRow(tableName, pkMap, payload, database);
        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Gagal memperbarui baris.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            {mode === 'create' ? (
              <div className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Plus size={16} />
              </div>
            ) : (
              <div className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                <Save size={16} />
              </div>
            )}
            <span className="font-semibold text-slate-900 text-sm">
              {mode === 'create' ? 'Insert New Row' : 'Edit Row Data'} &bull;
            </span>
            <span className="text-xs font-mono font-bold text-blue-700">{tableName}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-mono">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {columns.map((col) => {
              const isNull = !!nullFlags[col.name];
              const isAi = col.isAutoIncrement;
              const isPk = col.isPrimary || primaryKeys.includes(col.name);
              const isDate = col.dataType === 'date';
              const isDateTime = col.dataType === 'datetime' || col.dataType === 'timestamp';
              const isText = ['text', 'mediumtext', 'longtext', 'json'].includes(col.dataType);

              return (
                <div
                  key={col.name}
                  className={`p-3 rounded-lg border transition ${
                    isPk
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-slate-800 truncate">{col.name}</span>
                      {isPk && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0 font-bold">
                          PRIMARY KEY
                        </span>
                      )}
                      {isAi && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 border border-blue-200 shrink-0 font-bold">
                          AUTO_INCREMENT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500">{col.type}</span>
                      {col.nullable && (
                        <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer select-none font-sans">
                          <input
                            type="checkbox"
                            checked={isNull}
                            onChange={(e) => handleToggleNull(col.name, e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0"
                          />
                          <span>NULL</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Input Element */}
                  {isText ? (
                    <textarea
                      rows={3}
                      disabled={isNull}
                      value={isNull ? '' : formData[col.name] || ''}
                      onChange={(e) => handleFieldChange(col.name, e.target.value)}
                      placeholder={isNull ? 'NULL' : isAi && mode === 'create' ? '(Auto Generated)' : `Enter ${col.name}...`}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:bg-slate-100 shadow-2xs"
                    />
                  ) : (
                    <input
                      type={isDate ? 'date' : isDateTime ? 'text' : 'text'}
                      disabled={isNull}
                      value={isNull ? '' : formData[col.name] || ''}
                      onChange={(e) => handleFieldChange(col.name, e.target.value)}
                      placeholder={
                        isNull
                          ? 'NULL'
                          : isAi && mode === 'create'
                          ? '(Auto Generated)'
                          : isDateTime
                          ? 'YYYY-MM-DD HH:mm:ss'
                          : `Enter ${col.name}...`
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:bg-slate-100 shadow-2xs"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>{mode === 'create' ? 'Insert Row' : 'Update Row'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
