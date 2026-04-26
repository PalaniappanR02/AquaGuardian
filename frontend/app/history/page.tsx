'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Download, Search, Activity, Waves, Gauge, Wind, Droplets } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type SensorType = 'ALL' | 'FLOOD' | 'PRESSURE' | 'GAS' | 'FLOW';

interface SensorLog {
  id: string;
  sensor_id: string;
  type: SensorType;
  value: number;
  unit: string;
  location: string;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const FILTERS: SensorType[] = ['ALL', 'FLOOD', 'PRESSURE', 'GAS', 'FLOW'];

const TYPE_META: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  FLOOD: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', icon: <Waves className="h-3 w-3" /> },
  PRESSURE: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <Gauge className="h-3 w-3" /> },
  GAS: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <Wind className="h-3 w-3" /> },
  FLOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <Droplets className="h-3 w-3" /> },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function exportCSV(logs: SensorLog[]) {
  const header = ['Timestamp', 'Sensor ID', 'Type', 'Value', 'Unit', 'Location'];
  const rows = logs.map(l => [
    formatDate(l.created_at), l.sensor_id, l.type, l.value, l.unit, l.location,
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sensor_logs_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SensorLogsPage() {
  const [logs, setLogs] = useState<SensorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<SensorType>('ALL');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch from Supabase ──────────────────────────────────────────────────
  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      let query = supabase
        .from('sensor_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // Server-side type filter
      if (filter !== 'ALL') {
        query = query.eq('type', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw new Error(fetchError.message);
      setLogs((data as SensorLog[]) ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sensor logs.';
      console.error('[SensorLogs]', err);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Client-side search filter ────────────────────────────────────────────
  const filtered = logs.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.sensor_id.toLowerCase().includes(q) || l.location.toLowerCase().includes(q);
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-sky-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">IoT Telemetry</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Historical Sensor Logs</h1>
            <p className="text-slate-400 text-sm mt-1">
              {loading ? 'Loading…' : `${filtered.length} record${filtered.length !== 1 ? 's' : ''} from all IoT nodes`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => exportCSV(filtered)}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search sensor ID or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Type filters */}
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${filter === f
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['Timestamp', 'Sensor ID', 'Type', 'Value', 'Unit', 'Location'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Skeleton rows
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 bg-slate-800 rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                      No data matching your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map(log => {
                    const meta = TYPE_META[log.type] ?? TYPE_META['FLOW'];
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-5 py-3 text-slate-200 font-mono font-semibold">
                          {log.sensor_id}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${meta.color} ${meta.bg} ${meta.border}`}>
                            {meta.icon}
                            {log.type}
                          </span>
                        </td>
                        <td className={`px-5 py-3 font-bold tabular-nums ${meta.color}`}>
                          {log.value}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          {log.unit}
                        </td>
                        <td className="px-5 py-3 text-slate-300 text-xs">
                          {log.location}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
              Showing {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}