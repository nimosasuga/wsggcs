import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, PowerOff, Clock, Users, Zap } from 'lucide-react';
import { ProcessItem, ServerStats } from '../../types/database';
import { api } from '../../services/api';

export const LiveProcesslist: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [stats, setStats] = useState<ServerStats>({
    threadsConnected: 0,
    threadsRunning: 0,
    uptimeSeconds: 0,
    slowQueries: 0,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [killMessage, setKillMessage] = useState<string | null>(null);

  const fetchProcesses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProcesslist();
      if (res.ok) {
        setProcesses(res.processes || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchProcesses();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleKill = async (processId: number) => {
    if (!confirm(`Hentikan query proses ID #${processId} sekarang?`)) return;

    try {
      const res = await api.killProcess(processId, 'QUERY');
      if (res.ok) {
        setKillMessage(`Berhasil menghentikan proses #${processId}`);
        fetchProcesses();
      } else {
        setKillMessage(`Gagal: ${res.error}`);
      }
    } catch (err: any) {
      setKillMessage(`Error: ${err.message}`);
    }
  };

  const formatUptime = (sec: number) => {
    const days = Math.floor(sec / 86400);
    const hrs = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${days}d ${hrs}h ${mins}m`;
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-slate-50 p-3 sm:p-4 lg:p-5 space-y-3.5">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Threads Connected</p>
            <p className="text-lg font-bold text-slate-900 font-mono">{stats.threadsConnected}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Threads Running</p>
            <p className="text-lg font-bold text-emerald-700 font-mono">{stats.threadsRunning}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Server Uptime</p>
            <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">{formatUptime(stats.uptimeSeconds)}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Slow Queries</p>
            <p className="text-lg font-bold text-purple-700 font-mono">{stats.slowQueries}</p>
          </div>
        </div>
      </div>

      {killMessage && (
        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-sm">
          {killMessage}
        </div>
      )}

      {/* Main Process List Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-600" />
            <span className="text-xs font-semibold text-slate-800">MySQL Live Processlist (SHOW FULL PROCESSLIST)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">
              {processes.length} Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span className="text-[11px]">Auto Refresh (3s)</span>
            </label>
            <button
              onClick={fetchProcesses}
              disabled={isLoading}
              className={`p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition ${
                isLoading ? 'animate-spin text-blue-600' : ''
              }`}
              title="Refresh Manual"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="min-w-[800px] w-full text-left text-xs text-slate-700 font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2 text-center w-14">ID</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Host</th>
                <th className="px-3 py-2">Database</th>
                <th className="px-3 py-2">Command</th>
                <th className="px-3 py-2 text-center">Time (s)</th>
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2">Query Info</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {processes.map((p) => {
                const isSlow = p.time > 2;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 text-center font-bold text-slate-500">{p.id}</td>
                    <td className="px-3 py-2 text-slate-800 font-medium">{p.user}</td>
                    <td className="px-3 py-2 text-slate-500 text-[11px]">{p.host}</td>
                    <td className="px-3 py-2 text-blue-700">{p.db || '-'}</td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 text-slate-700">
                        {p.command}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-center font-bold ${isSlow ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`}>
                      {p.time}s
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-[11px]">{p.state || '-'}</td>
                    <td className="px-3 py-2 text-slate-800 max-w-xs truncate" title={p.info || ''}>
                      {p.info || <span className="text-slate-400 italic">None / Sleep</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {p.command !== 'Binlog Dump' && (
                        <button
                          onClick={() => handleKill(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title={`Kill Query #${p.id}`}
                        >
                          <PowerOff size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
