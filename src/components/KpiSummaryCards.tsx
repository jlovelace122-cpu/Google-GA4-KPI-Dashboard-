"use client";

import { GA4ReportResult } from "@/lib/ga4";
import { KpiPreset } from "@/lib/kpiPresets";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const CARD_GRADIENTS = [
  "from-blue-500 via-blue-600 to-blue-700",
  "from-violet-500 via-violet-600 to-purple-700",
  "from-emerald-500 via-emerald-600 to-teal-700",
  "from-amber-500 via-orange-500 to-orange-600",
  "from-rose-500 via-rose-600 to-pink-700",
  "from-cyan-500 via-sky-500 to-sky-600",
];

function formatMetricName(name: string): string {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}

function formatValue(key: string, value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (key.toLowerCase().includes("rate")) return `${(num * 100).toFixed(1)}%`;
  if (key.toLowerCase().includes("revenue"))
    return `$${num >= 1_000_000 ? `${(num / 1_000_000).toFixed(1)}M` : num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toFixed(0)}`;
  if (key.toLowerCase().includes("duration")) {
    const mins = Math.floor(num / 60);
    const secs = Math.floor(num % 60);
    return `${mins}m ${secs}s`;
  }
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(num < 1 ? 2 : 0);
}

interface Props {
  preset: KpiPreset;
  data: GA4ReportResult;
  previousData?: GA4ReportResult;
}

export default function KpiSummaryCards({ preset, data, previousData }: Props) {
  const metrics = preset.metrics.slice(0, 6);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-violet-500" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Strategic Overview
        </h2>
        <span className="text-xs text-slate-400 ml-1">— {preset.label}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map((metric, i) => {
          const value = data.totals?.[metric] ?? "0";
          const prevValue = previousData?.totals?.[metric];
          const curr = parseFloat(value);
          const prev = prevValue ? parseFloat(prevValue) : null;
          const delta = prev && prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null;
          const isPositive = delta !== null && delta >= 0;

          return (
            <div
              key={metric}
              className={`bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} rounded-2xl p-4 text-white shadow-lg shadow-black/10 relative overflow-hidden`}
            >
              {/* Decorative circles */}
              <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-8 -left-3 w-24 h-24 rounded-full bg-black/10 pointer-events-none" />

              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-2 relative z-10">
                {formatMetricName(metric)}
              </p>
              <p className="text-2xl font-bold leading-tight mb-2 relative z-10">
                {formatValue(metric, value)}
              </p>
              {delta !== null ? (
                <div
                  className={`flex items-center gap-1 text-xs font-medium relative z-10 ${
                    isPositive ? "text-white/90" : "text-white/60"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {isPositive ? "+" : ""}
                  {delta.toFixed(1)}% vs prev
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-white/40 relative z-10">
                  <Minus className="w-3 h-3" /> No prior data
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
