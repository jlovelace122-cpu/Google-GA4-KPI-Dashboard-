'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { KpiPreset } from '@/lib/kpiPresets';
import { GA4ReportResult } from '@/lib/ga4';
import { InsightResult } from '@/lib/insights';
import { DateRange } from '@/lib/dateRanges';

interface PDFExportButtonProps {
  preset: KpiPreset;
  data: GA4ReportResult;
  previousData?: GA4ReportResult;
  insights?: InsightResult;
  dateRange: DateRange;
  propertyLabel?: string;
  dark?: boolean;
}

function fmtName(name: string): string {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

function fmtVal(key: string, value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (key.toLowerCase().includes('rate')) return `${(num * 100).toFixed(1)}%`;
  if (key.toLowerCase().includes('revenue'))
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (key.toLowerCase().includes('duration')) {
    return `${Math.floor(num / 60)}m ${Math.floor(num % 60)}s`;
  }
  return num >= 1000 ? num.toLocaleString() : num.toFixed(num < 1 ? 4 : 0);
}

export default function PDFExportButton({
  preset, data, previousData, insights, dateRange,
  propertyLabel = 'GA4 Property', dark,
}: PDFExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    try {
      // Grab chart SVG from DOM
      const svgEl = document.querySelector('.recharts-responsive-container svg');
      const svgHtml = svgEl
        ? `<svg xmlns="http://www.w3.org/2000/svg" ${svgEl.getAttribute('style') ? `style="${svgEl.getAttribute('style')}"` : ''} viewBox="${svgEl.getAttribute('viewBox') ?? ''}" width="100%" height="${svgEl.getAttribute('height') ?? 260}">${svgEl.innerHTML}</svg>`
        : '';

      // Metrics cards
      const metricsHtml = preset.metrics.slice(0, 4).map(m => {
        const curr = data.totals?.[m] ?? '0';
        const prev = previousData?.totals?.[m];
        let delta = '';
        if (prev) {
          const pct = ((parseFloat(curr) - parseFloat(prev)) / Math.abs(parseFloat(prev))) * 100;
          if (!isNaN(pct)) {
            const col = pct >= 0 ? '#059669' : '#dc2626';
            delta = `<div style="font-size:11px;color:${col};margin-top:2px">${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}% vs prev period</div>`;
          }
        }
        return `<div style="flex:1;min-width:130px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px">
  <div style="font-size:11px;color:#64748b;margin-bottom:3px">${fmtName(m)}</div>
  <div style="font-size:20px;font-weight:800;color:#0f172a">${fmtVal(m, curr)}</div>
  ${delta}
</div>`;
      }).join('');

      // Data table (top 15 rows)
      const topRows = data.rows.slice(0, 15);
      const ths = data.headers.map(h =>
        `<th style="text-align:left;padding:7px 10px;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #e2e8f0;white-space:nowrap">${fmtName(h)}</th>`
      ).join('');
      const trs = topRows.map((row, i) => {
        const cells = data.headers.map(h =>
          `<td style="padding:6px 10px;font-size:12px;color:#1e293b;border-bottom:1px solid #f1f5f9">${fmtVal(h, row[h] ?? '')}</td>`
        ).join('');
        return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">${cells}</tr>`;
      }).join('');

      // AI Insights section
      let insightsHtml = '';
      if (insights) {
        const sc = insights.sentiment === 'positive' ? '#059669'
          : insights.sentiment === 'warning' ? '#d97706'
          : insights.sentiment === 'critical' ? '#dc2626' : '#2563eb';
        const bullets = insights.insights.map(i =>
          `<div style="border-left:3px solid ${sc};padding:7px 12px;margin-bottom:8px;background:#f8fafc;border-radius:0 6px 6px 0">
  <div style="font-size:12px;font-weight:600;color:#0f172a">${i.title}${i.change ? ` <span style="color:${sc}">(${i.change})</span>` : ''}</div>
  <div style="font-size:11px;color:#475569;margin-top:2px">${i.detail}</div>
</div>`
        ).join('');
        const recs = insights.recommendations.map(r =>
          `<li style="font-size:12px;color:#1e293b;margin-bottom:6px">${r}</li>`
        ).join('');
        insightsHtml = `
<div style="margin-top:28px;padding:20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;page-break-inside:avoid">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <div style="width:8px;height:8px;border-radius:50%;background:${sc}"></div>
    <h2 style="font-size:14px;font-weight:700;color:#0f172a;margin:0">AI-Generated Insights</h2>
    <span style="font-size:10px;color:#94a3b8;margin-left:auto">Powered by OpenAI GPT-4o</span>
  </div>
  <p style="font-size:13px;color:#1e293b;font-style:italic;margin:0 0 14px 0">"${insights.summary}"</p>
  ${bullets}
  <h3 style="font-size:12px;font-weight:700;color:#0f172a;margin:14px 0 8px 0;text-transform:uppercase;letter-spacing:.05em">Recommendations</h3>
  <ul style="margin:0;padding-left:18px">${recs}</ul>
</div>`;
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${preset.label} — GA4 KPI Report</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#fff; color:#0f172a; padding:40px; max-width:980px; margin:0 auto; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>

<!-- Report Header -->
<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:16px;margin-bottom:24px">
  <div>
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#64748b;margin-bottom:4px">GA4 KPI Dashboard · Global AI Sentinel</div>
    <h1 style="font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-.02em">${preset.label}</h1>
    <p style="font-size:12px;color:#64748b;margin-top:4px">${propertyLabel} · ${dateRange.label} &nbsp;(${dateRange.startDate} → ${dateRange.endDate})</p>
  </div>
  <div style="text-align:right">
    <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Generated</div>
    <div style="font-size:13px;font-weight:600;color:#475569">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  </div>
</div>

<!-- Metrics Summary -->
<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px">${metricsHtml}</div>

<!-- Chart -->
${svgHtml ? `<div style="margin-bottom:28px;padding:16px 16px 8px;border:1px solid #e2e8f0;border-radius:12px;page-break-inside:avoid">
  <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">${preset.label} Chart</div>
  ${svgHtml}
</div>` : ''}

<!-- Data Table -->
${topRows.length > 0 ? `<div style="margin-bottom:28px;page-break-inside:avoid">
  <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Top ${topRows.length} Rows</div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <thead style="background:#f8fafc"><tr>${ths}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
</div>` : ''}

${insightsHtml}

<!-- Footer -->
<div style="margin-top:40px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8">
  <span>© 2026 Global AI Sentinel · Confidential &amp; Proprietary</span>
  <span>GA4 KPI Dashboard · Powered by Google Analytics 4</span>
</div>

<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

      const win = window.open('', '_blank', 'width=1100,height=900');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 ${
        dark
          ? 'border-slate-600 text-slate-300 hover:text-white hover:border-slate-400'
          : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-400'
      }`}
      title="Export report as PDF"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
      Export PDF
    </button>
  );
}
