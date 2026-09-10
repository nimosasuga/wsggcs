import React from 'react';
import { X, Copy, Check } from 'lucide-react';

interface CellDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  value: any;
}

export const CellDetailModal: React.FC<CellDetailModalProps> = ({
  isOpen,
  onClose,
  columnName,
  value,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  let formattedValue = '';
  let isJson = false;

  if (value === null || value === undefined) {
    formattedValue = 'NULL';
  } else if (typeof value === 'object') {
    try {
      formattedValue = JSON.stringify(value, null, 2);
      isJson = true;
    } catch {
      formattedValue = String(value);
    }
  } else {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        formattedValue = JSON.stringify(parsed, null, 2);
        isJson = true;
      } else {
        formattedValue = String(value);
      }
    } catch {
      formattedValue = String(value);
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Cell Inspector:</span>
            <span className="text-xs font-mono font-bold text-blue-600">{columnName}</span>
            {isJson && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                JSON
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 shadow-xs transition cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} className="text-slate-500" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-auto bg-slate-50 font-mono text-xs text-slate-900 whitespace-pre-wrap select-all border-b border-slate-200">
          {formattedValue}
        </div>
      </div>
    </div>
  );
};
