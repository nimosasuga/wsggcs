import React, { useState } from 'react';
import { 
  Download, Upload, Database, Table as TableIcon, CheckCircle2, 
  AlertCircle, RefreshCw, FileCode, FileSpreadsheet, Layers, 
  Check, ArrowRight, Info
} from 'lucide-react';
import { TableInfo } from '../../types/database';
import { api } from '../../services/api';

interface ExportImportViewProps {
  tables: TableInfo[];
  currentDatabase: string;
  selectedTable: string | null;
  onSelectTable: (tableName: string, view: 'data' | 'structure') => void;
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
  return ';'; // Default to Indonesian format (semicolon)
}

function normalizeIndonesianNumber(val: string): string {
  if (!val || typeof val !== 'string') return val;
  const trimmed = val.trim();
  // Match Indonesian formatted numbers like "1.250,50" or "50.000,00" or "-12.500,25"
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(trimmed)) {
    return trimmed.replace(/\./g, '').replace(',', '.');
  }
  // Match simple decimal with comma like "125,50" or "0,75"
  if (/^-?\d+,\d+$/.test(trimmed)) {
    return trimmed.replace(',', '.');
  }
  return val;
}

export const ExportImportView: React.FC<ExportImportViewProps> = ({
  tables,
  currentDatabase,
  selectedTable,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export States
  const [exportScope, setExportScope] = useState<'database' | 'table'>('database');
  const [targetTable, setTargetTable] = useState<string>(selectedTable || tables[0]?.name || '');
  const [selectedTables, setSelectedTables] = useState<string[]>(tables.map((t) => t.name));
  const [exportFormat, setExportFormat] = useState<'sql' | 'csv' | 'json'>('csv');
  const [exportDelimiter, setExportDelimiter] = useState<';' | ','>(';');
  const [exportLimit, setExportLimit] = useState<number>(50000);
  const [includeStructure, setIncludeStructure] = useState<boolean>(true);
  const [includeData, setIncludeData] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Import States
  const [importFile, setImportFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'sql' | 'csv' | null>(null);
  const [importTargetTable, setImportTargetTable] = useState<string>(selectedTable || tables[0]?.name || '');
  const [importMode, setImportMode] = useState<'INSERT' | 'REPLACE' | 'IGNORE'>('INSERT');
  const [importDelimiterMode, setImportDelimiterMode] = useState<'auto' | ';' | ',' | '\t'>('auto');
  const [detectedDelimiter, setDetectedDelimiter] = useState<string>(';');
  const [convertIndonesianNumbers, setConvertIndonesianNumbers] = useState<boolean>(true);
  const [rawCsvLines, setRawCsvLines] = useState<string[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Toggle All Tables for Database Export
  const handleToggleSelectAllTables = () => {
    if (selectedTables.length === tables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables.map((t) => t.name));
    }
  };

  const handleToggleTable = (tblName: string) => {
    if (selectedTables.includes(tblName)) {
      setSelectedTables(selectedTables.filter((t) => t !== tblName));
    } else {
      setSelectedTables([...selectedTables, tblName]);
    }
  };

  // Handle Export Action
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      if (exportScope === 'database') {
        if (selectedTables.length === 0) {
          throw new Error('Pilih minimal satu tabel untuk diekspor.');
        }
        await api.downloadDatabaseExport(
          currentDatabase,
          exportFormat === 'csv' ? 'sql' : exportFormat,
          selectedTables.length === tables.length ? undefined : selectedTables,
          includeStructure,
          includeData
        );
        setExportStatus({
          ok: true,
          message: `Berhasil mengekspor ${selectedTables.length} tabel dari database "${currentDatabase}".`,
        });
      } else {
        if (!targetTable) {
          throw new Error('Pilih tabel yang ingin diekspor.');
        }
        await api.downloadTableExport(targetTable, currentDatabase, exportFormat, exportLimit, exportDelimiter);
        setExportStatus({
          ok: true,
          message: `Berhasil mengekspor tabel "${targetTable}" dalam format ${exportFormat.toUpperCase()}${exportFormat === 'csv' ? ` (Delimiter: "${exportDelimiter}")` : ''}.`,
        });
      }
    } catch (err: any) {
      setExportStatus({
        ok: false,
        message: err.message || 'Gagal mengekspor data.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Re-parse CSV preview rows and columns
  const refreshCsvPreview = (lines: string[], delim: string, convertNum: boolean) => {
    if (lines.length > 0) {
      const cols = parseCsvLine(lines[0], delim);
      setPreviewColumns(cols);

      const sampleRows = lines.slice(1, 6).map((l) => {
        const parsed = parseCsvLine(l, delim);
        return parsed.map((c) => {
          let val = c.replace(/^"|"$/g, '').trim();
          if (val === '' || val.toUpperCase() === 'NULL') return 'NULL';
          return convertNum ? normalizeIndonesianNumber(val) : val;
        });
      });
      setPreviewRows(sampleRows);
    }
  };

  const handleDelimiterModeChange = (mode: 'auto' | ';' | ',' | '\t') => {
    setImportDelimiterMode(mode);
    const delim = mode === 'auto' ? detectedDelimiter : mode;
    refreshCsvPreview(rawCsvLines, delim, convertIndonesianNumbers);
  };

  const handleConvertIndonesianNumbersChange = (convert: boolean) => {
    setConvertIndonesianNumbers(convert);
    const delim = importDelimiterMode === 'auto' ? detectedDelimiter : importDelimiterMode;
    refreshCsvPreview(rawCsvLines, delim, convert);
  };

  // Handle File Selection for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportStatus(null);

    const isSql = file.name.toLowerCase().endsWith('.sql');
    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt');

    if (isSql) {
      setFileType('sql');
      setPreviewColumns([]);
      setPreviewRows([]);
      setRawCsvLines([]);
    } else if (isCsv) {
      setFileType('csv');
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawText = event.target?.result as string;
        // Strip UTF-8 BOM if present
        const text = rawText.replace(/^\uFEFF/, '');
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        setRawCsvLines(lines);

        if (lines.length > 0) {
          const detected = detectCsvDelimiter(lines[0]);
          setDetectedDelimiter(detected);
          const activeDelim = importDelimiterMode === 'auto' ? detected : importDelimiterMode;
          refreshCsvPreview(lines, activeDelim, convertIndonesianNumbers);
        }
      };
      reader.readAsText(file);
    } else {
      setFileType(null);
      setImportStatus({
        ok: false,
        message: 'Format berkas tidak didukung. Silakan gunakan berkas .sql atau .csv.',
      });
    }
  };

  // Handle Commit Import Action
  const handleCommitImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();

    if (fileType === 'sql') {
      reader.onload = async (event) => {
        try {
          const sqlContent = event.target?.result as string;
          const res = await api.importSql(sqlContent, currentDatabase);
          if (res.ok) {
            setImportStatus({
              ok: true,
              message: res.message || 'Skrip SQL berhasil dieksekusi.',
            });
          } else {
            setImportStatus({
              ok: false,
              message: res.error || 'Gagal mengeksekusi skrip SQL.',
            });
          }
        } catch (err: any) {
          setImportStatus({
            ok: false,
            message: err.message || 'Terjadi kesalahan saat memproses berkas SQL.',
          });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(importFile);
    } else if (fileType === 'csv') {
      if (!importTargetTable) {
        setIsImporting(false);
        setImportStatus({ ok: false, message: 'Pilih tabel tujuan terlebih dahulu.' });
        return;
      }

      reader.onload = async (event) => {
        try {
          const rawText = event.target?.result as string;
          const text = rawText.replace(/^\uFEFF/, '');
          const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
          if (lines.length <= 1) {
            throw new Error('Berkas CSV tidak memiliki baris data.');
          }

          const delim = importDelimiterMode === 'auto' ? detectedDelimiter : importDelimiterMode;
          const cols = parseCsvLine(lines[0], delim);
          const rows = lines.slice(1).map((l) => {
            const parsed = parseCsvLine(l, delim);
            return parsed.map((c) => {
              let val = c.replace(/^"|"$/g, '').trim();
              if (val === '' || val.toUpperCase() === 'NULL') return null;
              if (convertIndonesianNumbers) {
                val = normalizeIndonesianNumber(val);
              }
              return val;
            });
          });

          const res = await api.importData(importTargetTable, cols, rows, importMode, currentDatabase);
          if (res.ok) {
            setImportStatus({
              ok: true,
              message: res.message || `Berhasil mengimpor ${rows.length} baris ke tabel ${importTargetTable} (Format CSV Indonesia: Delimiter "${delim}").`,
            });
          } else {
            setImportStatus({
              ok: false,
              message: res.error || 'Gagal mengimpor data CSV.',
            });
          }
        } catch (err: any) {
          setImportStatus({
            ok: false,
            message: err.message || 'Gagal memproses data CSV.',
          });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(importFile);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-y-auto">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              MySQL Database
            </span>
            <span className="text-xs font-mono font-bold text-slate-800">{currentDatabase}</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 mt-1">
            Ekspor &amp; Impor Database
          </h1>
          <p className="text-xs text-slate-500">
            Cadangkan struktur dan data tabel, atau pulihkan dari berkas SQL dan CSV standar phpMyAdmin.
          </p>
        </div>

        {/* Top Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download size={13} />
            <span>Ekspor (Export)</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload size={13} />
            <span>Impor (Import)</span>
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
        {/* ============================================================ */}
        {/* TAB 1: EKSPOR                                                */}
        {/* ============================================================ */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Status Feedback */}
            {exportStatus && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  exportStatus.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {exportStatus.ok ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                )}
                <span>{exportStatus.message}</span>
              </div>
            )}

            {/* Scope Selection: Seluruh Database vs Tabel Tertentu */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Database size={14} className="text-blue-600" />
                <span>1. Cakupan Ekspor (Export Scope)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setExportScope('database')}
                  className={`border rounded-lg p-3.5 flex items-start gap-3 cursor-pointer transition ${
                    exportScope === 'database'
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'database'}
                    onChange={() => setExportScope('database')}
                    className="mt-0.5 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Seluruh Database ({tables.length} Tabel)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Mengekspor seluruh skema dan data database <strong className="font-mono">{currentDatabase}</strong> sebagai berkas dump utuh.
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setExportScope('table')}
                  className={`border rounded-lg p-3.5 flex items-start gap-3 cursor-pointer transition ${
                    exportScope === 'table'
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'table'}
                    onChange={() => setExportScope('table')}
                    className="mt-0.5 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Tabel Tertentu
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Pilih satu tabel spesifik untuk diekspor ke SQL, CSV, atau JSON.
                    </div>
                  </div>
                </label>
              </div>

              {/* Tabel Picker if Scope == 'table' */}
              {exportScope === 'table' && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-slate-700 font-medium text-xs mb-1.5">
                    Pilih Tabel Target:
                  </label>
                  <select
                    value={targetTable}
                    onChange={(e) => setTargetTable(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {tables.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.rows.toLocaleString()} baris)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Table Multi-select if Scope == 'database' */}
              {exportScope === 'database' && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-700">
                      Tabel yang disertakan ({selectedTables.length}/{tables.length}):
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleSelectAllTables}
                      className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      {selectedTables.length === tables.length ? 'Batal Pilih Semua' : 'Pilih Semua Tabel'}
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-mono">
                    {tables.map((tbl) => (
                      <label key={tbl.name} className="flex items-center gap-1.5 p-1 hover:bg-white rounded cursor-pointer truncate">
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(tbl.name)}
                          onChange={() => handleToggleTable(tbl.name)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                        />
                        <span className="truncate text-slate-700">{tbl.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileCode size={14} className="text-blue-600" />
                <span>2. Format Berkas (Format)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  onClick={() => setExportFormat('sql')}
                  className={`border rounded-lg p-3 flex flex-col items-start gap-1 cursor-pointer transition ${
                    exportFormat === 'sql'
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-slate-900">SQL (.sql)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">MySQL Standard</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dump query standar MySQL. Dapat diimpor kembali secara langsung ke phpMyAdmin / MySQL CLI.
                  </p>
                </label>

                <label
                  onClick={() => setExportFormat('csv')}
                  className={`border rounded-lg p-3 flex flex-col items-start gap-1 cursor-pointer transition ${
                    exportFormat === 'csv'
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-slate-900">CSV (.csv)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Format Indonesia / Excel</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format titik koma (;) dengan UTF-8 BOM. Otomatis rapi ke dalam kolom saat dibuka di Microsoft Excel.
                  </p>
                </label>

                <label
                  onClick={() => setExportFormat('json')}
                  className={`border rounded-lg p-3 flex flex-col items-start gap-1 cursor-pointer transition ${
                    exportFormat === 'json'
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-slate-900">JSON (.json)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">API / Web</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Array objek data JSON terformat rapi untuk integrasi aplikasi modern.
                  </p>
                </label>
              </div>

              {/* SQL Options */}
              {exportFormat === 'sql' && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={includeStructure}
                      onChange={(e) => setIncludeStructure(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Sertakan Struktur Kolom (CREATE TABLE &amp; DROP TABLE)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={includeData}
                      onChange={(e) => setIncludeData(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Sertakan Data Baris (INSERT INTO)</span>
                  </label>
                </div>
              )}

              {/* CSV Indonesian Options */}
              {exportFormat === 'csv' && (
                <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <FileSpreadsheet size={14} className="text-emerald-700" />
                      Pilihan Format CSV (Standar Indonesia)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold uppercase">
                      Indonesia / Excel Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className={`p-2.5 rounded-md border flex items-start gap-2.5 cursor-pointer transition ${exportDelimiter === ';' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-medium shadow-2xs' : 'bg-white/70 border-emerald-200 text-slate-700'}`}>
                      <input
                        type="radio"
                        name="exportDelim"
                        checked={exportDelimiter === ';'}
                        onChange={() => setExportDelimiter(';')}
                        className="mt-0.5 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold">Titik Koma (;) — Standar Indonesia &amp; MS Excel</div>
                        <div className="text-[11px] text-slate-500 font-normal">Excel regional Indonesia langsung membuka kolom dengan rapi.</div>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-md border flex items-start gap-2.5 cursor-pointer transition ${exportDelimiter === ',' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-medium shadow-2xs' : 'bg-white/70 border-emerald-200 text-slate-700'}`}>
                      <input
                        type="radio"
                        name="exportDelim"
                        checked={exportDelimiter === ','}
                        onChange={() => setExportDelimiter(',')}
                        className="mt-0.5 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold">Koma (,) — Standar Internasional / RFC 4180</div>
                        <div className="text-[11px] text-slate-500 font-normal">Format CSV global standar US/UK.</div>
                      </div>
                    </label>
                  </div>

                  <div className="text-[11px] text-emerald-900 flex items-start gap-2 bg-white p-2.5 rounded border border-emerald-100">
                    <Info size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Berkas CSV otomatis disertakan <strong>UTF-8 BOM</strong> agar Microsoft Excel dapat mengenali huruf spesial dan langsung membagi kolom otomatis tanpa harus melalui wizard teks.
                    </span>
                  </div>
                </div>
              )}

              {/* Table Limit Options if single table */}
              {exportScope === 'table' && (
                <div className="flex items-center gap-3 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <span className="font-medium">Batas Maksimal Baris:</span>
                  <select
                    value={exportLimit}
                    onChange={(e) => setExportLimit(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={1000}>1.000 baris</option>
                    <option value={10000}>10.000 baris</option>
                    <option value={50000}>50.000 baris</option>
                    <option value={100000}>100.000 baris</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Sedang Menyiapkan &amp; Mengunduh...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Ekspor / Unduh Berkas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: IMPOR                                                 */}
        {/* ============================================================ */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Status Feedback */}
            {importStatus && (
              <div
                className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
                  importStatus.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {importStatus.ok ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            {/* File Upload Box */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Upload size={14} className="text-blue-600" />
                <span>1. Pilih Berkas Impor (File to Import)</span>
              </h2>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-6 text-center transition">
                <input
                  type="file"
                  id="import-file-input"
                  accept=".sql,.csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="import-file-input" className="cursor-pointer block">
                  <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <Upload size={20} />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Klik untuk memilih berkas atau seret berkas ke sini
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Mendukung berkas <strong className="font-mono text-blue-700">.sql</strong> (dump database) atau <strong className="font-mono text-emerald-700">.csv</strong> (tabel data)
                  </div>
                </label>

                {importFile && (
                  <div className="mt-4 p-2.5 bg-white border border-slate-200 rounded-lg inline-flex items-center gap-3 text-xs shadow-2xs font-mono">
                    <span className="font-bold text-slate-800">{importFile.name}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">{(importFile.size / 1024).toFixed(1)} KB</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${fileType === 'sql' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {fileType?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* If SQL file is selected */}
            {fileType === 'sql' && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileCode size={14} className="text-blue-600" />
                  <span>2. Konfigurasi Eksekusi SQL</span>
                </h2>

                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
                  <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    Berkas SQL ini akan dieksekusi secara berurutan ke database aktif{' '}
                    <strong className="font-mono font-bold">{currentDatabase}</strong>. Perintah seperti{' '}
                    <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-800">CREATE TABLE</code>,{' '}
                    <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-800">INSERT INTO</code>, dan{' '}
                    <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-800">ALTER</code> akan otomatis dijalankan.
                  </div>
                </div>
              </div>
            )}

            {/* If CSV file is selected */}
            {fileType === 'csv' && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet size={14} className="text-emerald-600" />
                  <span>2. Konfigurasi Impor CSV</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium text-xs mb-1.5">
                      Tabel Tujuan (Target Table):
                    </label>
                    <select
                      value={importTargetTable}
                      onChange={(e) => setImportTargetTable(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {tables.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium text-xs mb-1.5">
                      Pemisah Kolom (Delimiter CSV):
                    </label>
                    <select
                      value={importDelimiterMode}
                      onChange={(e) => handleDelimiterModeChange(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="auto">
                        Otomatis (Terdeteksi: {detectedDelimiter === ';' ? 'Titik Koma ";"' : detectedDelimiter === ',' ? 'Koma ","' : 'Tab'})
                      </option>
                      <option value=";">Titik Koma (;) — Format Indonesia / Excel</option>
                      <option value=",">Koma (,) — Format Internasional</option>
                      <option value="\t">Tab (\t) — TSV</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium text-xs mb-1.5">
                      Mode Sisipkan (Insert Mode):
                    </label>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="INSERT">INSERT INTO (Standar)</option>
                      <option value="REPLACE">REPLACE INTO (Timpa kunci primer sama)</option>
                      <option value="IGNORE">INSERT IGNORE (Abaikan jika duplikat)</option>
                    </select>
                  </div>
                </div>

                {/* Normalisasi Angka Format Indonesia */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                    <input
                      type="checkbox"
                      id="convertIndoNumbers"
                      checked={convertIndonesianNumbers}
                      onChange={(e) => handleConvertIndonesianNumbersChange(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Normalisasi Angka Format Indonesia</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Mengonversi titik ribuan &amp; koma desimal (misal: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">1.250,50</code> &rarr; <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">1250.50</code>)
                  </span>
                </div>

                {/* Preview Columns & Rows */}
                {previewColumns.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-700">
                      Pratinjau Data (Kolom terdeteksi: {previewColumns.length}):
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-48">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                          <tr>
                            {previewColumns.map((c, i) => (
                              <th key={i} className="px-2.5 py-1.5 font-bold whitespace-nowrap">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {previewRows.map((r, ri) => (
                            <tr key={ri} className="hover:bg-slate-50">
                              {r.map((val, ci) => (
                                <td key={ci} className="px-2.5 py-1 text-slate-700 whitespace-nowrap">
                                  {val || <span className="text-slate-300 italic">NULL</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCommitImport}
                disabled={!importFile || isImporting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Sedang Mengeksekusi Impor...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Jalankan Impor ({fileType?.toUpperCase() || 'BERKAS'})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
