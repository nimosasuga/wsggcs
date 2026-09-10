import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, 
  Search, RefreshCw, Eye, Download, LayoutGrid, Table as TableIcon,
  Plus, Edit2, Trash2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { ColumnInfo } from '../../types/database';
import { api } from '../../services/api';
import { CellDetailModal } from './CellDetailModal';
import { RowFormModal } from '../crud/RowFormModal';

interface DataGridProps {
  tableName: string | null;
  database?: string;
  onOpenExport: () => void;
}

export const DataGrid: React.FC<DataGridProps> = ({ tableName, database, onOpenExport }) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColumnInfo[]>([]);
  const [primaryKeys, setPrimaryKeys] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selection for bulk delete
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);

  // Mobile view mode toggle (Table vs Card view)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [inspectCell, setInspectCell] = useState<{ col: string; val: any } | null>(null);
  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);

  const loadData = async () => {
    if (!tableName) return;
    setIsLoading(true);
    setError(null);
    setSelectedRowIndices([]);

    try {
      const res = await api.getTableData(tableName, page, limit, sortField, sortOrder, search, database);
      if (res.ok) {
        setData(res.rows || []);
        setColumns(res.columns || []);
        setPrimaryKeys(res.primaryKeys || []);
        setTotalRows(res.totalRows || 0);
      } else {
        setError(res.error || 'Gagal memuat data tabel.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke API.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStructure = async () => {
    if (!tableName) return;
    try {
      const res = await api.getTableStructure(tableName, database);
      if (res.ok) {
        setColumnDefs(res.columns || []);
        if (res.primaryKeys && res.primaryKeys.length > 0) {
          setPrimaryKeys(res.primaryKeys);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setPage(1);
    loadData();
    loadStructure();
  }, [tableName, limit, sortField, sortOrder, database]);

  useEffect(() => {
    loadData();
  }, [page]);

  const handleSort = (col: string) => {
    if (sortField === col) {
      if (sortOrder === 'ASC') {
        setSortOrder('DESC');
      } else {
        setSortField(undefined);
        setSortOrder('ASC');
      }
    } else {
      setSortField(col);
      setSortOrder('ASC');
    }
  };

  const getPkMap = (row: any) => {
    const pkMap: Record<string, any> = {};
    if (primaryKeys.length > 0) {
      primaryKeys.forEach((k) => {
        pkMap[k] = row[k];
      });
    } else {
      Object.assign(pkMap, row);
    }
    return pkMap;
  };

  const handleDeleteRow = async (row: any, idx: number) => {
    const pkMap = getPkMap(row);
    const pkDesc = Object.entries(pkMap)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    if (!confirm(`Hapus baris data (${pkDesc}) ini sekarang?`)) return;

    try {
      const res = await api.deleteRow(tableName!, pkMap, database);
      if (res.ok) {
        setSuccessMessage('Baris data berhasil dihapus.');
        loadData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(res.error || 'Gagal menghapus baris.');
      }
    } catch (err: any) {
      setError(err.message || 'Error koneksi.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowIndices.length === 0) return;
    if (!confirm(`Hapus ${selectedRowIndices.length} baris yang dipilih sekarang?`)) return;

    const pks = selectedRowIndices.map((i) => getPkMap(data[i]));

    try {
      const res = await api.bulkDeleteRows(tableName!, pks, database);
      if (res.ok) {
        setSuccessMessage(res.message || 'Baris terpilih berhasil dihapus.');
        loadData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(res.error || 'Gagal menghapus baris.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIndices(data.map((_, i) => i));
    } else {
      setSelectedRowIndices([]);
    }
  };

  const handleToggleRow = (idx: number) => {
    if (selectedRowIndices.includes(idx)) {
      setSelectedRowIndices(selectedRowIndices.filter((i) => i !== idx));
    } else {
      setSelectedRowIndices([...selectedRowIndices, idx]);
    }
  };

  const totalPages = Math.ceil(totalRows / limit) || 1;

  if (!tableName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 font-mono text-xs h-full bg-slate-50">
        <TableIcon size={36} className="opacity-30 mb-2" />
        <p>Pilih tabel di sidebar untuk melihat data</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-white">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center justify-between gap-3 shrink-0 select-none shadow-2xs">
        {/* Left: Table Breadcrumb & Meta */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-400 font-sans text-xs">Table:</span>
            <span className="font-bold text-slate-900 text-sm truncate font-mono">{tableName}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold shrink-0">
            {totalRows.toLocaleString()} baris
          </span>
          {primaryKeys.length > 0 && (
            <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold shrink-0">
              Primary Key: {primaryKeys.join(', ')}
            </span>
          )}
        </div>

        {/* Right: Search, Refresh, Export, Insert */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              placeholder="Search / Filter..."
              className="bg-slate-50 hover:bg-white focus:bg-white text-slate-800 text-xs rounded-md border border-slate-200 focus:border-blue-500 pl-7 pr-3 py-1 w-36 sm:w-48 font-mono transition shadow-2xs"
            />
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className={`p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition cursor-pointer ${
              isLoading ? 'animate-spin text-blue-600' : ''
            }`}
            title="Refresh Data"
          >
            <RefreshCw size={13} />
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Mobile toggle view mode */}
          <div className="md:hidden flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              title="Table View"
            >
              <TableIcon size={12} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1 rounded ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              title="Card View (Mobile Optimized)"
            >
              <LayoutGrid size={12} />
            </button>
          </div>

          <button
            onClick={onOpenExport}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition cursor-pointer"
          >
            <Download size={12} className="text-blue-600" />
            <span>Export / Import</span>
          </button>

          {/* Insert Row Button */}
          <button
            onClick={() => setIsInsertOpen(true)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition cursor-pointer"
          >
            <Plus size={13} />
            <span>Insert Row</span>
          </button>
        </div>
      </div>

      {/* Bulk Delete Floating Bar */}
      {selectedRowIndices.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between gap-2 text-xs font-mono animate-fade-in">
          <span className="text-rose-800 font-semibold">
            {selectedRowIndices.length} baris data dipilih
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRowIndices([])}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs"
            >
              Batal Pilih
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Trash2 size={12} />
              <span>Hapus Baris Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div className="mx-3 mt-2 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="mx-3 mt-2 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table / Grid Content */}
      <div className="flex-1 overflow-auto bg-white relative">
        {data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 font-mono text-xs p-8">
            <TableIcon size={32} className="opacity-20 mb-2" />
            <p>{isLoading ? 'Memuat data dari database...' : 'Tabel ini kosong (0 baris).'}</p>
            <button
              onClick={() => setIsInsertOpen(true)}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
            >
              <Plus size={13} /> Tambah Baris Pertama
            </button>
          </div>
        ) : (
          <>
            {/* 1. Desktop & Tablet Table View */}
            <div className={`${viewMode === 'cards' ? 'hidden' : 'block'} min-w-full inline-block align-middle`}>
              <table className="min-w-full border-separate border-spacing-0 text-left text-xs text-slate-700 font-mono">
                <thead className="bg-slate-50 sticky top-0 z-10 select-none shadow-2xs">
                  <tr>
                    <th className="px-2.5 py-2 w-10 text-center border-b border-r border-slate-200 bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedRowIndices.length === data.length && data.length > 0}
                        onChange={handleSelectAllRows}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 w-12 text-center text-slate-500 border-b border-r border-slate-200 bg-slate-50 font-semibold text-[11px]">#</th>
                    <th className="px-3 py-2 text-center w-20 border-b border-r border-slate-200 bg-slate-50 font-semibold text-[11px]">Actions</th>
                    {columns.map((col) => {
                      const isSorted = sortField === col;
                      const isPk = primaryKeys.includes(col);
                      return (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="px-3.5 py-2 border-b border-r border-slate-200 bg-slate-50 font-semibold text-[11px] cursor-pointer hover:bg-slate-100 transition select-none"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`truncate ${isPk ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>{col}</span>
                            {isSorted ? (
                              sortOrder === 'ASC' ? (
                                <ArrowUp size={11} className="text-blue-600 shrink-0" />
                              ) : (
                                <ArrowDown size={11} className="text-blue-600 shrink-0" />
                              )
                            ) : (
                              <ArrowUpDown size={10} className="text-slate-300 opacity-40 hover:opacity-100 shrink-0" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {data.map((row, idx) => {
                    const isSelected = selectedRowIndices.includes(idx);
                    return (
                      <tr key={idx} className={`transition group ${isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-2.5 py-2 text-center border-b border-r border-slate-100">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(idx)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center text-[11px] text-slate-400 border-b border-r border-slate-100 select-none font-mono">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="px-2.5 py-1.5 text-center border-b border-r border-slate-100 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-sans">
                            <button
                              onClick={() => setEditingRow(row)}
                              className="inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                              title="Ubah / Edit Baris Ini"
                            >
                              <Edit2 size={11} className="text-blue-600" />
                              <span>Ubah</span>
                            </button>
                            <span className="text-slate-300 select-none">|</span>
                            <button
                              onClick={() => handleDeleteRow(row, idx)}
                              className="inline-flex items-center gap-0.5 text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                              title="Hapus Baris Ini"
                            >
                              <Trash2 size={11} className="text-red-500" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                        {columns.map((col) => {
                          const cellVal = row[col];
                          const displayVal = cellVal === null ? 'NULL' : typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal);
                          const isLong = displayVal.length > 25;

                          return (
                            <td
                              key={col}
                              className={`px-3.5 py-2 border-b border-r border-slate-100 text-xs font-mono max-w-[260px] truncate ${
                                cellVal === null ? 'text-slate-400 italic' : 'text-slate-800'
                              }`}
                              title={displayVal}
                              onDoubleClick={() => setInspectCell({ col, val: cellVal })}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="truncate">{displayVal}</span>
                                {isLong && (
                                  <button
                                    onClick={() => setInspectCell({ col, val: cellVal })}
                                    className="text-slate-300 hover:text-blue-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                                    title="Lihat Nilai Lengkap"
                                  >
                                    <Eye size={11} />
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. Mobile Adaptive Card Grid */}
            <div className={`${viewMode === 'cards' ? 'grid' : 'hidden'} grid-cols-1 gap-2.5 p-3 md:hidden`}>
              {data.map((row, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs font-mono shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedRowIndices.includes(idx)}
                        onChange={() => handleToggleRow(idx)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">ROW #{(page - 1) * limit + idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingRow(row)}
                        className="p-1 rounded text-slate-600 hover:text-blue-600 transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteRow(row, idx)}
                        className="p-1 rounded text-slate-600 hover:text-rose-600 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    {columns.slice(0, 8).map((col) => {
                      const val = row[col];
                      const strVal = val === null ? 'NULL' : String(val);
                      return (
                        <div key={col} className="flex items-start justify-between gap-2">
                          <span className="text-slate-500 truncate max-w-[40%]">{col}:</span>
                          <span className={`truncate max-w-[58%] text-right ${val === null ? 'text-slate-400 italic' : 'text-slate-800 font-medium'}`}>
                            {strVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Pagination Controls */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-2 text-xs font-mono shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-slate-600 text-xs font-sans">
            Showing <span className="font-semibold text-slate-800 font-mono">{totalRows === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-800 font-mono">{Math.min(page * limit, totalRows)}</span> of{' '}
            <span className="font-bold text-slate-900 font-mono">{totalRows.toLocaleString()}</span> entries
          </span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] font-sans">| Per page:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-white text-slate-800 text-xs rounded border border-slate-200 px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs font-mono"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1 || isLoading}
            className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs text-xs font-sans font-medium flex items-center gap-1 cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft size={13} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <span className="px-2.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 text-xs font-mono font-semibold">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages || isLoading}
            className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs text-xs font-sans font-medium flex items-center gap-1 cursor-pointer"
            title="Next Page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Cell Detail Modal */}
      <CellDetailModal
        isOpen={inspectCell !== null}
        onClose={() => setInspectCell(null)}
        columnName={inspectCell?.col || ''}
        value={inspectCell?.val}
      />

      {/* Insert Row Modal */}
      <RowFormModal
        isOpen={isInsertOpen}
        onClose={() => setIsInsertOpen(false)}
        onSuccess={() => {
          setSuccessMessage('Baris data baru berhasil ditambahkan.');
          loadData();
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
        tableName={tableName}
        database={database}
        mode="create"
        columns={columnDefs.length > 0 ? columnDefs : columns.map((c) => ({ name: c, type: 'VARCHAR(255)', dataType: 'varchar', nullable: true, key: '', default: null, extra: '', collation: null, comment: '' }))}
        primaryKeys={primaryKeys}
      />

      {/* Edit Row Modal */}
      <RowFormModal
        isOpen={editingRow !== null}
        onClose={() => setEditingRow(null)}
        onSuccess={() => {
          setSuccessMessage('Baris data berhasil diperbarui.');
          loadData();
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
        tableName={tableName}
        database={database}
        mode="edit"
        columns={columnDefs.length > 0 ? columnDefs : columns.map((c) => ({ name: c, type: 'VARCHAR(255)', dataType: 'varchar', nullable: true, key: '', default: null, extra: '', collation: null, comment: '' }))}
        primaryKeys={primaryKeys}
        initialData={editingRow}
      />
    </div>
  );
};
