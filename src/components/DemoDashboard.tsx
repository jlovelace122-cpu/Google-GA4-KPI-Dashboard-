'use client';

import Link from 'next/link';
import { BarChart3, LogIn, FlaskConical } from 'lucide-react';
import { KPI_PRESETS } from '@/lib/kpiPresets';
import { THEMES, ThemeKey } from '@/lib/themes';
import { useDemoState } from '@/hooks/useDemoState';
import KpiPresetButtons from '@/components/KpiPresetButtons';
import DateRangePicker from '@/components/DateRangePicker';
import ReportCard from '@/components/ReportCard';
import InsightsPanel from '@/components/InsightsPanel';
import CohortCard from '@/components/CohortCard';
import PDFExportButton from '@/components/PDFExportButton';

const DEMO_NAV: { key: ThemeKey; href: string }[] = [
  { key: 'light', href: '/demo' },
  { key: 'dark', href: '/demo2' },
  { key: 'executive', href: '/demo3' },
];

export default function DemoDashboard({ themeKey }: { themeKey: ThemeKey }) {
  const t = THEMES[themeKey];
  const {
    dateRange, setDateRange,
    activePreset, reportData, previousData, cohortData,
    insights, insightsLoading, insightsError,
    handlePresetSelect, generateInsights,
  } = useDemoState();

  return (
    <div className={`min-h-screen ${t.page} flex flex-col`}>

      {/* ── Header ── */}
      <header className={t.header}>
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

          {/* Left: logo + title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className={t.logoBox}>
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={t.headerTitle}>GA4 KPI Dashboard</h1>
              <p className={t.headerSub}>Global AI Sentinel</p>
            </div>
          </div>

          {/* Right: theme switcher + badges + actions */}
          <div className="flex items-center gap-2 flex-wrap justify-end">

            {/* Theme switcher pill */}
            <div className={`hidden sm:flex items-center gap-0.5 rounded-lg p-1 ${t.dark ? 'bg-slate-700/60' : 'bg-slate-100'}`}>
              {DEMO_NAV.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    key === themeKey
                      ? t.dark ? 'bg-slate-500 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                      : t.dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {THEMES[key].label}
                </Link>
              ))}
            </div>

            <span className={t.demoBadge}>
              <FlaskConical className="w-3.5 h-3.5" />
              Demo
            </span>

            {/* PDF export — only when a standard report (not cohort) is loaded */}
            {activePreset && reportData && activePreset.reportType !== 'cohort' && (
              <PDFExportButton
                preset={activePreset}
                data={reportData}
                previousData={previousData ?? undefined}
                insights={insights ?? undefined}
                dateRange={dateRange}
                propertyLabel="CarNow (Demo)"
                dark={t.dark}
              />
            )}

            <Link href="/login" className={t.signInBtn}>
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── Demo banner ── */}
      <div className={t.banner}>
        <p className={`max-w-screen-2xl mx-auto text-center ${t.bannerText}`}>
          <strong>Demo Mode</strong> — Charts use realistic CarNow sample data.
          <Link href="/login" className={t.bannerLink}>Sign in with Google</Link> for live data.
        </p>
      </div>

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-8 space-y-6">

        {/* Date range picker */}
        <section className={t.section}>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </section>

        {/* KPI preset buttons */}
        <section className={t.sectionPadded}>
          <h2 className={t.sectionTitle}>Select a KPI Report</h2>
          <KpiPresetButtons
            presets={KPI_PRESETS}
            openPresetIds={new Set(activePreset ? [activePreset.id] : [])}
            onSelect={handlePresetSelect}
            dark={t.darkPresetButtons}
          />
        </section>

        {/* Report + Insights */}
        {activePreset ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
            {activePreset.reportType === 'cohort' ? (
              <CohortCard data={cohortData} isLoading={false} dark={t.dark} />
            ) : (
              <ReportCard
                preset={activePreset}
                data={reportData ?? { headers: [], rows: [], totals: {}, rowCount: 0 }}
                isLoading={false}
                previousData={previousData ?? undefined}
                chartColors={t.chartColors}
                dark={t.dark}
              />
            )}
            <div className="xl:sticky xl:top-24">
              <InsightsPanel
                insights={insights}
                isLoading={insightsLoading}
                error={insightsError}
                onGenerate={generateInsights}
                hasData={!!reportData && reportData.rows.length > 0}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={t.emptyBox}>
              <BarChart3 className={t.emptyIconClass} />
            </div>
            <h3 className={t.emptyTitle}>Select a report above</h3>
            <p className={t.emptyBody}>Choose any KPI preset to preview the dashboard with sample CarNow data.</p>
          </div>
        )}
      </main>

      <footer className={t.footer}>
        © 2026 Global AI Sentinel · GA4 KPI Dashboard · {t.description} — Sample Data Only
      </footer>
    </div>
  );
}
