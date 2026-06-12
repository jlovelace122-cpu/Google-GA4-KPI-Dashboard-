"use client";

import { GA4ReportResult } from "@/lib/ga4";
import { KpiPreset } from "@/lib/kpiPresets";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import { format } from "date-fns";
import { Download } from "lucide-react";

const CHART_COLORS = [
  "#6366f1", // indigo-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
];

const CATEGORY_ACCENT: Record<string, string> = {
  acquisition: "from-blue-500 to-indigo-600",
  engagement: "from-violet-500 to-purple-600",
  monetization: "from-amber-500 to-orange-500",
  retention: "from-emerald-500 to-teal-600",
  technical: "from-slate-500 to-slate-600",
  dealership: "from-orange-500 to-red-500",
};

function formatMetricName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValue(key: string, value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (key.toLowerCase().includes("rate")) return `${(num * 100).toFixed(1)}%`;
  if (key.toLowerCase().includes("revenue")) return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (key.toLowerCase().includes("duration")) {
    const mins = Math.floor(num / 60);
    const secs = Math.floor(num % 60);
    return `${mins}m ${secs}s`;
  }
  return num >= 1000 ? num.toLocaleString() : num.toFixed(num < 1 ? 4 : 0);
}

function DeltaBadge({ current, previous }: { current: string; previous: string }) {
  const curr = parseFloat(current);
  const prev = parseFloat(previous);
  if (isNaN(curr) || isNaN(prev) || prev === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const pos = pct >= 0;
  return (
    <span className={`text-xs font-semibold ${pos ? "text-emerald-600" : "text-red-500"}`}>
      {pos ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

interface ReportCardProps {
  preset: KpiPreset;
  data: GA4ReportResult;
  isLoading: boolean;
  previousData?: GA4ReportResult;
  dark?: boolean;
  chartColors?: string[];
}

export default function ReportCard({ preset, data, isLoading, previousData, dark = false, chartColors }: ReportCardProps) {
  const colors = chartColors ?? CHART_COLORS;
  const handleExportCsv = () => {
    if (!data.rows.length) return;
    const lines = [data.headers.join(",")];
    data.rows.forEach((row) => {
      lines.push(data.headers.map((h) => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
    });
    if (data.totals && Object.keys(data.totals).length) {
      const totalsRow = data.headers.map((h) =>
        data.totals?.[h] ? `"${data.totals[h]}"` : h === data.headers[0] ? '"TOTAL"' : '""'
      );
      lines.push(totalsRow.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ExportButton = () => (
    <button
      onClick={handleExportCsv}
      disabled={!data.rows.length}
      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border ${
        dark
          ? 'text-slate-400 hover:text-white border-slate-600 hover:border-slate-400'
          : 'text-slate-500 hover:text-slate-800 border-slate-200 hover:border-slate-400'
      }`}
      title="Export as CSV"
    >
      <Download className="w-3.5 h-3.5" />
      CSV
    </button>
  );

  if (isLoading) {
    return (
      <div className={`${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl p-6 animate-pulse shadow-sm`}>
        <div className={`h-5 ${dark ? 'bg-slate-700' : 'bg-slate-100'} rounded w-1/3 mb-4`} />
        <div className={`h-64 ${dark ? 'bg-slate-700' : 'bg-slate-100'} rounded-xl`} />
      </div>
    );
  }

  const hasDate = data.headers.includes("date");
  const hasDimension = (data.headers[0] !== "date" && preset.dimensions?.length);
  const isTimeSeries = hasDate;

  // ── Time-series line/bar chart ───────────────────────────────────────────────
  if (isTimeSeries) {
    const chartData = data.rows.map((row) => {
      const entry: Record<string, string | number> = {
        date: row.date
          ? (() => { try { return format(new Date(row.date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")), "MMM d"); } catch { return row.date; } })()
          : "",
      };
      preset.metrics.forEach((m) => {
        const raw = parseFloat(row[m] ?? "0");
        entry[m] = isNaN(raw) ? 0 : raw;
      });
      return entry;
    });

    return (
      <div className={`${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'} border rounded-2xl shadow-sm overflow-hidden`}>
        {/* Colored accent bar */}
        {!dark && (
          <div className={`h-1 w-full bg-gradient-to-r ${CATEGORY_ACCENT[preset.category] ?? 'from-blue-500 to-indigo-600'}`} />
        )}
        <div className="p-6">
        <div className="flex items-start justify-between mb-1 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className={`text-base font-semibold truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{preset.label}</h2>
            <ExportButton />
          </div>
          {data.totals && (
            <div className="flex gap-5 shrink-0">
              {preset.metrics.slice(0, 3).map((m) => (
                <div key={m} className="text-right">
                  <p className="text-xs text-slate-400 whitespace-nowrap">{formatMetricName(m)}</p>
                  <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {formatValue(m, data.totals?.[m] ?? "0")}
                  </p>
                  {previousData?.totals?.[m] != null && (
                    <DeltaBadge
                      current={data.totals?.[m] ?? "0"}
                      previous={previousData.totals![m] ?? "0"}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {previousData && (
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            ▲▼ vs. previous period
          </p>
        )}
        <p className="text-xs text-slate-400 mb-5">{preset.description}</p>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              {preset.metrics.map((m, i) => (
                <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#f1f5f9'} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={48} />
            <Tooltip
              contentStyle={dark ? { background: '#1e293b', border: '1px solid #475569', borderRadius: 8, color: '#f1f5f9', fontSize: 12 } : { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [formatValue(name, String(value)), formatMetricName(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} formatter={(v) => formatMetricName(v)} />
            {preset.metrics.map((m, i) => (
              <Area
                key={m}
                type="monotone"
                dataKey={m}
                stroke={colors[i % colors.length]}
                strokeWidth={2.5}
                fill={`url(#grad-${m})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── Bar chart for categorical dimensions ─────────────────────────────────────
  if (hasDimension) {
    const dimKey = preset.dimensions![0];
    const topRows = data.rows.slice(0, 15);
    const chartData = topRows.map((row) => {
      const entry: Record<string, string | number> = { name: row[dimKey] ?? "" };
      preset.metrics.forEach((m) => {
        const raw = parseFloat(row[m] ?? "0");
        entry[m] = isNaN(raw) ? 0 : raw;
      });
      return entry;
    });

    return (
      <div className={`${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'} border rounded-2xl shadow-sm overflow-hidden`}>
        {!dark && (
          <div className={`h-1 w-full bg-gradient-to-r ${CATEGORY_ACCENT[preset.category] ?? 'from-blue-500 to-indigo-600'}`} />
        )}
        <div className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className={`text-base font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{preset.label}</h2>
          <ExportButton />
        </div>
        <p className="text-xs text-slate-400 mb-5">{preset.description}</p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal" margin={{ top: 4, right: 16, bottom: 60, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#f1f5f9'} vertical={false} />
            <XAxis
              type="category"
              dataKey="name"
              tick={{ fill: dark ? '#94a3b8' : '#475569', fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} width={52} />
            <Tooltip
              contentStyle={dark ? { background: '#1e293b', border: '1px solid #475569', borderRadius: 8, color: '#f1f5f9', fontSize: 12 } : { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [formatValue(name, String(value)), formatMetricName(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 8 }} formatter={(v) => formatMetricName(v)} />
            {preset.metrics.slice(0, 2).map((m, i) => (
              <Bar key={m} dataKey={m} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={48} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── Fallback: raw table ───────────────────────────────────────────────────────
  return (
    <div className={`${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80'} border rounded-2xl overflow-hidden shadow-sm`}>
      {!dark && (
        <div className={`h-1 w-full bg-gradient-to-r ${CATEGORY_ACCENT[preset.category] ?? 'from-blue-500 to-indigo-600'}`} />
      )}
      <div className="p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-base font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{preset.label}</h2>
        <ExportButton />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {data.headers.map((h) => (
              <th key={h} className="text-left text-xs text-slate-400 pb-2 pr-4 font-medium uppercase tracking-wide">
                {formatMetricName(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              {data.headers.map((h) => (
                <td key={h} className="py-2 pr-4 text-slate-700">
                  {formatValue(h, row[h] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
