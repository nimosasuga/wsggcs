import React, { useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Play, AlignLeft, Plus, X, Clock, Database, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { format } from 'sql-formatter';
import { QueryResult, TableInfo } from '../../types/database';
import { api } from '../../services/api';
import { DryRunModal } from './DryRunModal';

interface SqlEditorProps {
  tables: TableInfo[];
  currentDatabase: string;
}

interface EditorTab {
  id: string;
  title: string;
  sql: string;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({ tables, currentDatabase }) => {
  const [tabs, setTabs] = useState<EditorTab[]>([
    { id: '1', title: 'Query 1', sql: `SELECT * FROM \`${tables[0]?.name || 'cache'}\` LIMIT 50;` },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [showDryRun, setShowDryRun] = useState(false);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const editorRef = useRef<any>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleUpdateSql = (newSql: string | undefined) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, sql: newSql || '' } : t))
    );
  };

  const handleAddTab = () => {
    const newId = String(Date.now());
    const newTab: EditorTab = {
      id: newId,
      title: `Query ${tabs.length + 1}`,
      sql: `-- SQL Workspace Tab ${tabs.length + 1}\nSELECT NOW();`,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
    }
  };

  const handleFormatSql = () => {
    try {
      const formatted = format(activeTab.sql, {
        language: 'mysql',
        keywordCase: 'upper',
        tabWidth: 2,
      });
      handleUpdateSql(formatted);
    } catch (err) {
      console.warn('Format error', err);
    }
  };

  const handleRunQuery = async (confirmed = false) => {
    if (!activeTab.sql.trim() || isRunning) return;
    setIsRunning(true);

    try {
      const res = await api.executeQuery(activeTab.sql, confirmed);
      setQueryResult(res);

      if (res.safetyWarning && !confirmed) {
        setShowDryRun(true);
      }
    } catch (err: any) {
      setQueryResult({
        ok: false,
        error: err.message || 'Gagal menghubungi server.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Keyboard shortcut Ctrl+Enter / Cmd+Enter to run query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunQuery(false);
    });

    // Provide intelligent MySQL autocomplete for table names and column names
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const tableSuggestions = tables.map((t) => ({
          label: t.name,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: `\`${t.name}\``,
          detail: `Table (${t.rows} rows, ${t.engine})`,
          range,
        }));

        const sqlKeywords = [
          'SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'UPDATE', 'DELETE FROM', 'JOIN', 'LEFT JOIN',
          'INNER JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION ALL', 'CREATE TABLE',
          'ALTER TABLE', 'DROP TABLE', 'EXPLAIN ANALYZE', 'OPTIMIZE TABLE', 'SHOW FULL PROCESSLIST'
        ].map((kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          detail: 'MySQL Keyword',
          range,
        }));

        return { suggestions: [...tableSuggestions, ...sqlKeywords] };
      },
    });
  };

  const copyToClipboard = (text: string, cellKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellKey);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-slate-50">
      {/* Top Query Editor Action Bar */}
      <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0 select-none shadow-2xs">
        {/* Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[60vw]">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-mono cursor-pointer border-t-2 transition ${
                  isActive
                    ? 'bg-white text-blue-600 border-blue-600 font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={handleAddTab}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
            title="Tambah Tab Baru"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Action Buttons: Format & Run */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormatSql}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition"
            title="Format SQL"
          >
            <AlignLeft size={13} className="text-slate-600" />
            <span className="hidden sm:inline">Format SQL</span>
          </button>
          <button
            onClick={() => handleRunQuery(false)}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold text-white rounded-md transition shadow-sm ${
              isRunning
                ? 'bg-blue-800 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Play size={13} className={`fill-current ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Query'}</span>
            <span className="hidden lg:inline text-[10px] text-blue-200 opacity-90 font-mono">
              (Ctrl+Enter)
            </span>
          </button>
        </div>
      </div>

      {/* Monaco Editor Pane (Height 38%) */}
      <div className="h-[38%] border-b border-slate-200 relative bg-white">
        <Editor
          height="100%"
          language="sql"
          theme="vs"
          value={activeTab.sql}
          onChange={handleUpdateSql}
          onMount={handleEditorMount}
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>

      {/* Results Header Status Bar */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800">Results Console</span>
          {queryResult && (
            <div className="flex items-center gap-2 font-mono text-[11px]">
              {queryResult.ok ? (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  <CheckCircle2 size={12} /> Success
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                  <AlertCircle size={12} /> Error
                </span>
              )}
              {queryResult.durationMs !== undefined && (
                <span className="flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  <Clock size={11} /> {queryResult.durationMs}ms
                </span>
              )}
              {queryResult.rowCount !== undefined && (
                <span className="text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {queryResult.rowCount.toLocaleString()} rows
                </span>
              )}
              {queryResult.affectedRows !== undefined && (
                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                  {queryResult.affectedRows} affected
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Body / Data Grid */}
      <div className="flex-1 overflow-auto p-2 bg-slate-50">
        {!queryResult ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-mono space-y-2">
            <Database size={32} className="opacity-30" />
            <p>Ketik query SQL di atas lalu tekan "Run Query" atau Ctrl+Enter</p>
          </div>
        ) : !queryResult.ok ? (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
            <p className="font-semibold text-rose-900 mb-1">Query Error:</p>
            <p className="whitespace-pre-wrap">{queryResult.error}</p>
          </div>
        ) : queryResult.isSelect && queryResult.rows ? (
          queryResult.rows.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              Query berhasil dieksekusi, tidak ada baris data dikembalikan (0 rows).
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white shadow-sm">
              <table className="min-w-max w-full text-left text-xs text-slate-700 font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-600 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 w-12 text-center text-slate-400 border-r border-slate-200">#</th>
                    {queryResult.columns?.map((col) => (
                      <th key={col.name} className="px-3 py-2 border-r border-slate-200 font-semibold tracking-wider">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {queryResult.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-1.5 text-center text-[10px] text-slate-400 border-r border-slate-200 select-none">
                        {idx + 1}
                      </td>
                      {queryResult.columns?.map((col) => {
                        const cellVal = row[col.name];
                        const displayVal = cellVal === null ? 'NULL' : typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal);
                        const cellKey = `${idx}-${col.name}`;
                        return (
                          <td
                            key={col.name}
                            onClick={() => copyToClipboard(displayVal, cellKey)}
                            className={`px-3 py-1.5 border-r border-slate-200 table-cell-truncate cursor-pointer hover:bg-blue-50/60 transition group ${
                              cellVal === null ? 'text-slate-400 italic' : 'text-slate-800'
                            }`}
                            title="Klik untuk menyalin"
                          >
                            <span className="flex items-center justify-between gap-1">
                              <span className="truncate">{displayVal}</span>
                              {copiedCell === cellKey ? (
                                <Check size={11} className="text-emerald-600 shrink-0" />
                              ) : (
                                <Copy size={11} className="text-slate-400 opacity-0 group-hover:opacity-100 shrink-0" />
                              )}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="p-4 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-sm">
            <p className="font-semibold text-emerald-700 mb-1">
              ✓ {queryResult.message || 'Perubahan berhasil diterapkan.'}
            </p>
            <p className="text-slate-600">
              Affected rows: <span className="font-bold text-slate-900">{queryResult.affectedRows}</span> | Insert ID:{' '}
              <span className="font-bold text-slate-900">{queryResult.insertId || 0}</span>
            </p>
          </div>
        )}
      </div>

      {/* Dry Run Confirmation Modal */}
      <DryRunModal
        isOpen={showDryRun}
        sql={activeTab.sql}
        safety={queryResult?.safety}
        onClose={() => setShowDryRun(false)}
        onConfirm={() => {
          setShowDryRun(false);
          handleRunQuery(true);
        }}
      />
    </div>
  );
};
