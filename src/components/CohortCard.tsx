"use client";

import { GA4CohortResult } from "@/lib/ga4";
import { Download } from "lucide-react";

// Blue-600 = rgb(37, 99, 235); scale from white → blue by retention %
function retentionColor(pct: number): string {
  const r = Math.round(255 - (255 - 37) * pct);
  const g = Math.round(255 - (255 - 99) * pct);
  const b = Math.round(255 - (255 - 235) * pct);
  return `rgb(${r},${g},${b})`;
}

function textColor(pct: number): string {
  return pct > 0.45 ? "#ffffff" : "#1e293b";
}

interface CohortCardProps {
  data: GA4CohortResult | null;
  isLoading: boolean;
  dark?: boolean;
}

export default function CohortCard({ data, isLoading, dark = false }: CohortCardProps) {
  const handleExportCsv = () => {
    if (!data?.cohorts.length) return;
    const weekHeaders = Array.from({ length: data.maxWeeks }, (_, i) =>
      i === 0 ? "Week 0 (acquired)" : `Week ${i}`
    );
    const lines = [["Cohort", "Total Users", ...weekHeaders].join(",")];
    data.cohorts.forEach((row) => {
      const cells = row.weeklyUsers.map((v) =>
        v === null ? "" : `${((v / row.totalUsers) * 100).toFixed(1)}%`
      );
      lines.push([`"${row.cohortLabel}"`, String(row.totalUsers), ...cells].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cohort-retention-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={`${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl p-6 animate-pulse shadow-sm`}>
        <div className={`h-5 ${dark ? 'bg-slate-700' : 'bg-slate-100'} rounded w-1/3 mb-4`} />
        <div className={`h-64 ${dark ? 'bg-slate-700' : 'bg-slate-100'} rounded-xl`} />
      </div>
    );
  }

  if (!data || !data.cohorts.length) {
    return (
      <div className={`${dark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-400'} border rounded-2xl p-6 shadow-sm text-sm`}>
        No cohort data available for this property.
      </div>
    );
  }

  const { cohorts, maxWeeks } = data;

  // Calculate average retention per week column (for summary row)
  const avgRetention = Array.from({ length: maxWeeks }, (_, wi) => {
    const available = cohorts.filter((c) => c.weeklyUsers[wi] !== null && c.totalUsers > 0);
    if (!available.length) return null;
    const avg = available.reduce((sum, c) => sum + c.weeklyUsers[wi]! / c.totalUsers, 0) / available.length;
    return avg;
  });

  return (
    <div className={`${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl p-6 shadow-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className={`text-base font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Cohort Retention</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Weekly user cohorts — what % return each subsequent week
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors border ${
            dark ? 'text-slate-400 hover:text-white border-slate-600 hover:border-slate-400' : 'text-slate-500 hover:text-slate-800 border-slate-200 hover:border-slate-400'
          }`}
          title="Export as CSV"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-4 rounded" style={{ background: retentionColor(1) }} />
          <span className="text-xs text-slate-400">100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-4 rounded" style={{ background: retentionColor(0.5) }} />
          <span className="text-xs text-slate-400">50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-4 rounded" style={{ background: retentionColor(0.1) }} />
          <span className="text-xs text-slate-400">10%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-4 rounded bg-slate-100 border border-dashed border-slate-300" />
          <span className="text-xs text-slate-400">No data</span>
        </div>
      </div>

      {/* Heatmap table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-1">
          <thead>
            <tr>
              <th className={`text-left font-medium pr-2 pb-1 whitespace-nowrap w-24 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cohort
              </th>
              <th className={`text-right font-medium pr-3 pb-1 whitespace-nowrap ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Users
              </th>
              {Array.from({ length: maxWeeks }, (_, i) => (
                <th key={i} className={`text-center font-medium pb-1 whitespace-nowrap min-w-[64px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {i === 0 ? "Wk 0" : `Wk ${i}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((row) => (
              <tr key={row.cohortStartDate}>
                <td className={`pr-2 py-0.5 font-medium whitespace-nowrap ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {row.cohortLabel}
                </td>
                <td className="pr-3 py-0.5 text-right text-slate-400 whitespace-nowrap">
                  {row.totalUsers.toLocaleString()}
                </td>
                {row.weeklyUsers.map((users, wi) => {
                  if (users === null) {
                    return (
                      <td key={wi} className="py-0.5">
                        <div className={`h-8 rounded border border-dashed ${dark ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`} />
                      </td>
                    );
                  }
                  const pct = row.totalUsers > 0 ? users / row.totalUsers : 0;
                  return (
                    <td key={wi} className="py-0.5">
                      <div
                        className="h-8 rounded flex flex-col items-center justify-center leading-none"
                        style={{ background: retentionColor(pct) }}
                      >
                        <span
                          className="font-semibold text-[11px]"
                          style={{ color: textColor(pct) }}
                        >
                          {(pct * 100).toFixed(0)}%
                        </span>
                        <span
                          className="text-[9px] mt-0.5 opacity-80"
                          style={{ color: textColor(pct) }}
                        >
                          {users.toLocaleString()}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Average row */}
            <tr className={`border-t ${dark ? 'border-slate-600' : 'border-slate-200'}`}>
              <td className={`pr-2 pt-2 font-semibold whitespace-nowrap ${dark ? 'text-slate-400' : 'text-slate-500'}`} colSpan={2}>
                Avg
              </td>
              {avgRetention.map((avg, wi) => {
                if (avg === null) {
                  return <td key={wi} className="pt-2" />;
                }
                return (
                  <td key={wi} className="pt-2">
                    <div
                      className="h-8 rounded flex items-center justify-center font-semibold text-[11px]"
                      style={{ background: retentionColor(avg), color: textColor(avg) }}
                    >
                      {(avg * 100).toFixed(0)}%
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Churn callout */}
      {avgRetention[1] !== null && (
        <div className={`mt-5 p-3 rounded-xl border text-xs ${dark ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <span className={`font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>Week 1 churn:</span>{" "}
          <span className="text-red-600 font-bold">
            {((1 - (avgRetention[1] ?? 0)) * 100).toFixed(0)}%
          </span>{" "}
          of acquired users do not return after their first week.
          {avgRetention[2] !== null && (
            <>
              {" "}By Week 2, only{" "}
              <span className="font-bold text-blue-700">
                {((avgRetention[2] ?? 0) * 100).toFixed(0)}%
              </span>{" "}
              remain active.
            </>
          )}
        </div>
      )}
    </div>
  );
}
