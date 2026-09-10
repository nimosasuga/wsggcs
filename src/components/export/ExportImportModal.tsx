import React, { useState } from 'react';
import { Download, Upload, X, FileText, Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { TableInfo } from '../../types/database';
import { api } from '../../services/api';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableInfo[];
  selectedTable: string | null;
}

function parseCsvLine(line: string, delimiter: string = ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function detectCsvDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  if (semicolons >= commas && semicolons >= tabs && semicolons > 0) return ';';
  if (commas > semicolons && commas > tabs) return ',';
  if (tabs > 0) return '\t';
  return ';';
}

function normalizeIndonesianNumber(val: string): string {
  if (!val || typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(trimmed)) {
    return trimmed.replace(/\./g, '').replace(',', '.');
  }
  if (/^-?\d+,\d+$/.test(trimmed)) {
    return trimmed.replace(',', '.');
  }
  return val;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  tables,
  selectedTable,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [targetTable, setTargetTable] = useState(selectedTable || tables[0]?.name || '');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'sql'>('csv');
  const [exportDelimiter, setExportDelimiter] = useState<';' | ','>(';');
  const [exportLimit, setExportLimit] = useState(10000);

  // Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importDelimiter, setImportDelimiter] = useState<string>(';');
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [importMode, setImportMode] = useState<'INSERT' | 'REPLACE' | 'IGNORE'>('INSERT');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!targetTable) return;
    try {
      await api.downloadTableExport(targetTable, undefined, exportFormat, exportLimit, exportDelimiter);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunduh file ekspor.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawText = event.target?.result as string;
      const text = rawText.replace(/^\uFEFF/, '');
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const delim = detectCsvDelimiter(lines[0]);
        setImportDelimiter(delim);
        const cols = parseCsvLine(lines[0], delim);
        setPreviewColumns(cols);

        const rows = lines.slice(1, 6).map((l) => {
          const parsed = parseCsvLine(l, delim);
          return parsed.map((c) => normalizeIndonesianNumber(c));
        });
        setPreviewRows(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleCommitImport = async () => {
    if (!csvFile || !targetTable || previewColumns.length === 0) return;
    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawText = event.target?.result as string;
        const text = rawText.replace(/^\uFEFF/, '');
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        const delim = importDelimiter || ';';
        const cols = parseCsvLine(lines[0], delim);
        const rows = lines.slice(1).map((l) => {
          const parsed = parseCsvLine(l, delim);
          return parsed.map((c) => {
            let val = c.replace(/^"|"$/g, '').trim();
            if (val === '' || val.toUpperCase() === 'NULL') return null;
            return normalizeIndonesianNumber(val);
          });
        });

        const res = await api.importData(targetTable, cols, rows, importMode);
        setImportStatus({
          ok: res.ok,
          message: res.message || res.error || 'Import selesai.',
        });
      } catch (err: any) {
        setImportStatus({ ok: false, message: err.message || 'Gagal memproses import.' });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Tabs */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Download size={13} /> Export Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'import'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Upload size={13} /> Import CSV
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Target Table Selector */}
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">Target Table:</label>
            <select
              value={targetTable}
              onChange={(e) => setTargetTable(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {tables.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.rows.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'export' ? (
            /* EXPORT SECTION */
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1.5">Pilihan Format Export:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'csv', title: 'CSV (ISO 8601)', desc: 'Kompatibel Washeng & AppSheet' },
                    { id: 'json', title: 'JSON', desc: 'Raw records array' },
                    { id: 'sql', title: 'SQL Dump', desc: 'INSERT statements' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setExportFormat(fmt.id as any)}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                        exportFormat === fmt.id
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold text-xs text-slate-800">{fmt.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{fmt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">Maksimal Jumlah Baris:</label>
                <select
                  value={exportLimit}
                  onChange={(e) => setExportLimit(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="1000">1,000 Baris</option>
                  <option value="10000">10,000 Baris</option>
                  <option value="50000">50,000 Baris</option>
                  <option value="100000">100,000 Baris (Streaming)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
                >
                  <Download size={14} /> Download File ({exportFormat.toUpperCase()})
                </button>
              </div>
            </div>
          ) : (
            /* IMPORT SECTION */
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">Pilih File CSV:</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                />
              </div>

              {previewColumns.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-slate-600">
                    Kolom Terdeteksi ({previewColumns.length}):{' '}
                    <span className="text-blue-600 font-mono">{previewColumns.join(', ')}</span>
                  </p>

                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                    <table className="w-full text-[10px] font-mono text-slate-700">
                      <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                        <tr>
                          {previewColumns.map((c) => (
                            <th key={c} className="px-2.5 py-1.5 border-r border-slate-200 text-left">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {previewRows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/70">
                            {row.map((val, j) => (
                              <td key={j} className="px-2.5 py-1.5 border-r border-slate-100 truncate max-w-[120px]">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium text-[11px] mb-1">Mode Import:</label>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="INSERT">INSERT (Gagal jika ada primary key duplikat)</option>
                      <option value="IGNORE">INSERT IGNORE (Lewati baris yang duplikat)</option>
                      <option value="REPLACE">REPLACE INTO (Timpa baris jika primary key sama)</option>
                    </select>
                  </div>
                </div>
              )}

              {importStatus && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    importStatus.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {importStatus.ok ? (
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleCommitImport}
                  disabled={!csvFile || isImporting}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white font-semibold text-xs transition cursor-pointer ${
                    csvFile && !isImporting
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>{isImporting ? 'Mengimpor Data...' : 'Mulai Import ke Database'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
