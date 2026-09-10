import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { QueryResult } from '../../types/database';

interface DryRunModalProps {
  safety: QueryResult['safety'];
  sql: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DryRunModal: React.FC<DryRunModalProps> = ({
  safety,
  sql,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen || !safety) return null;

  const requiredWord = safety.dangerLevel === 'CRITICAL' ? 'EXECUTE' : 'CONFIRM';
  const isMatch = confirmText.trim().toUpperCase() === requiredWord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-rose-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-200 px-5 py-3.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={20} className="text-rose-600 shrink-0" />
            <span className="font-semibold text-rose-900 text-sm tracking-tight">
              Safety Guard: {safety.dangerLevel} Risk Detected
            </span>
          </div>
          <button onClick={onClose} className="text-rose-400 hover:text-rose-700 p-1 rounded-md hover:bg-rose-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-800 flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-rose-900">{safety.reason}</p>
              {safety.affectedTarget && (
                <p className="mt-1 text-[11px] text-rose-700 font-mono">
                  Target Terpengaruh: <span className="font-bold underline">{safety.affectedTarget}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 block mb-1">SQL Statement:</label>
            <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 max-h-28 overflow-y-auto whitespace-pre-wrap select-all">
              {sql}
            </pre>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs text-slate-700 font-medium">
              Ketik <span className="font-bold font-mono text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">{requiredWord}</span> untuk melanjutkan eksekusi:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Ketik ${requiredWord}`}
              className="w-full bg-white border border-rose-300 rounded-md px-3 py-2 text-xs font-mono text-rose-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2.5 select-none">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!isMatch}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              isMatch
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            Eksekusi Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
