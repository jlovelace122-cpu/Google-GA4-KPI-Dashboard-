'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  RefreshCw, BarChart3, LogOut, Loader2, ChevronRight, PanelLeft,
  Calendar, X, Building2,
} from 'lucide-react';
import { KPI_PRESETS, KpiPreset } from '@/lib/kpiPresets';
import { DATE_RANGE_PRESETS, DateRange, getPreviousPeriod } from '@/lib/dateRanges';
import { GA4ReportResult, GA4CohortResult } from '@/lib/ga4';
import { InsightResult } from '@/lib/insights';
import KpiPresetButtons from '@/components/KpiPresetButtons';
import DateRangePicker from '@/components/DateRangePicker';
import PropertySelector, { PropertyOption } from '@/components/PropertySelector';
import DealershipSelector, { DealerOption } from '@/components/DealershipSelector';
import ReportCard from '@/components/ReportCard';
import InsightsPanel from '@/components/InsightsPanel';
import CohortCard from '@/components/CohortCard';
import PDFExportButton from '@/components/PDFExportButton';
import KpiSummaryCards from '@/components/KpiSummaryCards';
import DealerComparisonTool from '@/components/DealerComparisonTool';

const CATEGORY_ACCENT: Record<string, string> = {
  acquisition:  'from-blue-500 to-indigo-600',
  engagement:   'from-violet-500 to-purple-600',
  monetization: 'from-amber-500 to-orange-500',
  retention:    'from-emerald-500 to-teal-600',
  technical:    'from-slate-500 to-slate-600',
  dealership:   'from-orange-500 to-red-500',
};

interface ReportState {
  preset: KpiPreset;
  data: GA4ReportResult | null;
  previousData: GA4ReportResult | null;
  cohortData: GA4CohortResult | null;
  isLoading: boolean;
  error: string | null;
  insights: InsightResult | null;
  insightsLoading: boolean;
  insightsError: string | null;
}

const DEFAULT_PROPERTIES: PropertyOption[] = (() => {
  const ids    = (process.env.NEXT_PUBLIC_GA4_PROPERTY_IDS    ?? '').split(',').filter(Boolean);
  const labels = (process.env.NEXT_PUBLIC_GA4_PROPERTY_LABELS ?? '').split(',').filter(Boolean);
  if (ids.length === 0) return [{ id: 'properties/000000000', label: 'Demo Property' }];
  return ids.map((id, i) => ({ id: id.trim(), label: labels[i]?.trim() ?? id.trim() }));
})();

const DEALERS: DealerOption[] = (() => {
  const hostnames = (process.env.NEXT_PUBLIC_DEALER_HOSTNAMES ?? '').split(',').filter(Boolean);
  const labels    = (process.env.NEXT_PUBLIC_DEALER_LABELS    ?? '').split(',').filter(Boolean);
  return hostnames.map((h, i) => ({ hostname: h.trim(), label: labels[i]?.trim() ?? h.trim() }));
})();

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

  const [sidebarOpen,       setSidebarOpen]       = useState(true);
  const [selectedProperty,  setSelectedProperty]  = useState<string>(DEFAULT_PROPERTIES[0].id);
  const [selectedHostname,  setSelectedHostname]  = useState<string>('');
  const [dateRange,         setDateRange]         = useState<DateRange>(DATE_RANGE_PRESETS[3]);
  const [openReports,       setOpenReports]       = useState<Record<string, ReportState>>({});
  const [lastRefreshed,     setLastRefreshed]     = useState<Date | null>(null);
  const [showComparison,    setShowComparison]    = useState(false);

  useEffect(() => {
    if (!bypassAuth && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [bypassAuth, status, router]);

  if (status === 'loading' || (!bypassAuth && status === 'unauthenticated')) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  /* ─── Fetch helpers ──────────────────────────────────────────────────────── */
  const fetchReport = async (preset: KpiPreset, range: DateRange, propertyId: string) => {
    const id = preset.id;

    setOpenReports(prev => ({
      ...prev,
      [id]: prev[id]
        ? { ...prev[id], isLoading: true, error: null }
        : { preset, data: null, previousData: null, cohortData: null,
            isLoading: true, error: null,
            insights: null, insightsLoading: false, insightsError: null },
    }));

    if (preset.reportType === 'cohort') {
      try {
        const res = await fetch('/api/ga4/cohort', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId, weeksBack: 8, hostnameFilter: selectedHostname || undefined }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Failed'); }
        const cohortData = await res.json();
        setOpenReports(prev => ({ ...prev, [id]: { ...prev[id], isLoading: false, cohortData } }));
        setLastRefreshed(new Date());
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        setOpenReports(prev => ({ ...prev, [id]: { ...prev[id], isLoading: false, error } }));
      }
      return;
    }

    const isTimeSeries = preset.dimensions?.includes('date');
    const prevRange = isTimeSeries ? getPreviousPeriod(range) : null;
    const makeBody = (start: string, end: string) =>
      JSON.stringify({ propertyId, startDate: start, endDate: end,
        metrics: preset.metrics, dimensions: preset.dimensions,
        dimensionFilters: preset.dimensionFilters,
        hostnameFilter: selectedHostname || undefined,
        limit: 50, orderBy: preset.orderBy });

    try {
      const [currentRes, prevRes] = await Promise.all([
        fetch('/api/ga4/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: makeBody(range.startDate, range.endDate) }),
        prevRange ? fetch('/api/ga4/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: makeBody(prevRange.startDate, prevRange.endDate) }) : Promise.resolve(null),
      ]);
      if (!currentRes.ok) { const err = await currentRes.json(); throw new Error(err.error ?? 'Failed'); }
      const data = await currentRes.json();
      const previousData = prevRes?.ok ? await prevRes.json() : null;
      setOpenReports(prev => ({ ...prev, [id]: { ...prev[id], isLoading: false, data, previousData } }));
      setLastRefreshed(new Date());
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      setOpenReports(prev => ({ ...prev, [id]: { ...prev[id], isLoading: false, data: null, error } }));
    }
  };

  const generateInsights = async (presetId: string) => {
    const report = openReports[presetId];
    if (!report?.data) return;
    setOpenReports(prev => ({ ...prev, [presetId]: { ...prev[presetId], insightsLoading: true, insightsError: null } }));
    try {
      const propertyLabel = DEFAULT_PROPERTIES.find(p => p.id === selectedProperty)?.label ?? 'this property';
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: report.preset, data: report.data, propertyLabel, dateRange }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Failed'); }
      const insights = await res.json();
      setOpenReports(prev => ({ ...prev, [presetId]: { ...prev[presetId], insightsLoading: false, insights } }));
    } catch (e: unknown) {
      const insightsError = e instanceof Error ? e.message : 'Unknown error';
      setOpenReports(prev => ({ ...prev, [presetId]: { ...prev[presetId], insightsLoading: false, insightsError } }));
    }
  };

  /* ─── Event handlers ─────────────────────────────────────────────────────── */
  const handlePresetSelect = (p: KpiPreset) => {
    if (!openReports[p.id]) {
      fetchReport(p, dateRange, selectedProperty);
    }
    setTimeout(() => document.getElementById(`report-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleReportClose = (presetId: string) => {
    setOpenReports(prev => { const next = { ...prev }; delete next[presetId]; return next; });
  };

  const handleDateChange = (r: DateRange) => {
    setDateRange(r);
    Object.values(openReports).forEach(rpt => fetchReport(rpt.preset, r, selectedProperty));
  };

  const handlePropertyChange = (id: string) => {
    setSelectedProperty(id);
    Object.values(openReports).forEach(rpt => fetchReport(rpt.preset, dateRange, id));
  };

  const handleDealerChange = (h: string) => {
    setSelectedHostname(h);
    Object.values(openReports).forEach(rpt => fetchReport(rpt.preset, dateRange, selectedProperty));
  };

  const handleRefresh = () => {
    Object.values(openReports).forEach(rpt => fetchReport(rpt.preset, dateRange, selectedProperty));
  };

  const openReportsList = Object.values(openReports);
  const openPresetIds   = new Set(Object.keys(openReports));
  const anyLoading      = openReportsList.some(r => r.isLoading);

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">

      {/* TOP HEADER */}
      <header className="flex-none h-16 bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 border-b border-white/5 flex items-center px-4 gap-3 z-40"
        style={{ boxShadow: '0 1px 0 rgba(99,102,241,0.15), 0 4px 24px rgba(0,0,0,0.4)' }}>

        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/30 flex items-center justify-center shadow-lg">
              <Image src="/gais-logo.png" alt="Global AI Sentinel" width={32} height={32} priority className="object-contain" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold text-white tracking-tight leading-none">GA4 KPI</span>
              <span className="text-[15px] font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight leading-none">Dashboard</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-semibold tracking-widest text-blue-400/70 uppercase">Global AI Sentinel</span>
            </div>
          </div>
        </div>

        <button onClick={() => setSidebarOpen(o => !o)}
          className="p-1.5 ml-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <PropertySelector properties={DEFAULT_PROPERTIES} selectedId={selectedProperty} onChange={handlePropertyChange} />
        <DealershipSelector dealers={DEALERS} selectedHostname={selectedHostname} onChange={handleDealerChange} />

        {/* Open reports count badge */}
        {openReportsList.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <BarChart3 className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">{openReportsList.length} open</span>
          </div>
        )}

        <div className="flex-1" />

        {lastRefreshed && (
          <span className="text-[11px] text-blue-400/50 hidden lg:block">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>
        )}

        {/* Dealer Comparison Tool button */}
        <button onClick={() => setShowComparison(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:text-white hover:border-indigo-400/60 hover:bg-indigo-500/20 transition-colors text-xs font-medium"
          title="Dealership Comparison Tool">
          <Building2 className="w-3.5 h-3.5" />
          <span className="hidden lg:block">Compare</span>
        </button>

        <button onClick={handleRefresh} disabled={openReportsList.length === 0 || anyLoading}
          className="p-1.5 rounded-lg border border-white/20 text-white/40 hover:text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Refresh all">
          <RefreshCw className={`w-4 h-4 ${anyLoading ? 'animate-spin' : ''}`} />
        </button>

        {session?.user && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
            {session.user.name?.[0] ?? 'U'}
          </div>
        )}
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-1.5 rounded-lg border border-white/20 text-white/40 hover:text-white hover:border-white/40 transition-colors"
          title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className={`flex-none flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800/50 transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-72' : 'w-0'}`}>
          <div className="w-72 h-full flex flex-col overflow-hidden">

            <div className="flex-none p-4 border-b border-slate-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date Range</span>
              </div>
              <DateRangePicker value={dateRange} onChange={handleDateChange} dark />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">KPI Reports</span>
                {openReportsList.length > 0 && (
                  <span className="ml-auto text-[9px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                    {openReportsList.length} open
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-600 mb-3">Click to open · × to close</p>
              <KpiPresetButtons
                presets={KPI_PRESETS}
                openPresetIds={openPresetIds}
                onSelect={handlePresetSelect}
                onClose={handleReportClose}
                dark
              />
            </div>

            {/* Comparison Tool button in sidebar */}
            <div className="flex-none px-4 pb-3">
              <button onClick={() => setShowComparison(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-300 hover:text-white hover:border-indigo-400/40 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                Dealer Comparison Tool
                <span className="ml-auto text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full">NEW</span>
              </button>
            </div>

            <div className="flex-none p-3 border-t border-slate-800/50 flex items-center justify-center gap-2">
              <Image src="/gais-logo.png" alt="GAIS" width={16} height={16} className="opacity-50 object-contain" />
              <p className="text-[10px] text-slate-600">© 2026 Global AI Sentinel</p>
            </div>
          </div>
        </aside>

        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)}
            className="flex-none w-5 flex items-center justify-center bg-slate-900 border-r border-slate-800/50 hover:bg-slate-800 transition-colors group"
            title="Open sidebar">
            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400" />
          </button>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
          <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-8">

            {openReportsList.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/60 flex items-center justify-center mb-5 shadow-lg shadow-blue-100">
                  <BarChart3 className="w-9 h-9 text-blue-400" />
                </div>
                <h3 className="text-slate-600 font-semibold text-lg mb-2">Select KPI reports to open</h3>
                <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                  Click any report in the sidebar to open it. Open multiple reports simultaneously to compare metrics side by side.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                    Open multiple reports at once
                  </div>
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    Compare competing dealerships
                  </div>
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    AI insights per report
                  </div>
                </div>
                {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)}
                    className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                    <PanelLeft className="w-4 h-4" />
                    Open Sidebar
                  </button>
                )}
              </div>
            ) : (
              openReportsList.map((report) => (
                <div key={report.preset.id} id={`report-${report.preset.id}`}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

                  {/* Report Panel Header */}
                  <div className={`h-1 w-full bg-gradient-to-r ${CATEGORY_ACCENT[report.preset.category]}`} />
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
                    <div className={`w-1 h-5 rounded-full bg-gradient-to-b ${CATEGORY_ACCENT[report.preset.category]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{report.preset.label}</span>
                        {report.isLoading && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                      </div>
                      <span className="text-xs text-slate-400">{report.preset.description} · {dateRange.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.data && report.preset.reportType !== 'cohort' && (
                        <PDFExportButton
                          preset={report.preset}
                          data={report.data}
                          previousData={report.previousData ?? undefined}
                          insights={report.insights ?? undefined}
                          dateRange={dateRange}
                          propertyLabel={DEFAULT_PROPERTIES.find(p => p.id === selectedProperty)?.label}
                        />
                      )}
                      <button
                        onClick={() => fetchReport(report.preset, dateRange, selectedProperty)}
                        disabled={report.isLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Refresh this report">
                        <RefreshCw className={`w-3.5 h-3.5 ${report.isLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleReportClose(report.preset.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Close report">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* KPI Summary Cards */}
                    {report.data && report.data.rows.length > 0 && report.preset.reportType !== 'cohort' && (
                      <KpiSummaryCards
                        preset={report.preset}
                        data={report.data}
                        previousData={report.previousData ?? undefined}
                      />
                    )}

                    {/* Chart + Insights grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
                      <div>
                        {report.error ? (
                          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-600 text-sm">
                            <strong>Error:</strong> {report.error}
                            <p className="mt-1 text-xs text-red-400">Make sure your account has access to this GA4 property.</p>
                          </div>
                        ) : report.preset.reportType === 'cohort' ? (
                          <CohortCard data={report.cohortData} isLoading={report.isLoading} />
                        ) : (
                          <ReportCard
                            preset={report.preset}
                            data={report.data ?? { headers: [], rows: [], totals: {}, rowCount: 0 }}
                            isLoading={report.isLoading}
                            previousData={report.previousData ?? undefined}
                          />
                        )}
                      </div>
                      <div className="xl:sticky xl:top-6">
                        <InsightsPanel
                          insights={report.insights}
                          isLoading={report.insightsLoading}
                          error={report.insightsError}
                          onGenerate={() => generateInsights(report.preset.id)}
                          hasData={!!report.data && report.data.rows.length > 0}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Dealer Comparison Modal */}
      {showComparison && (
        <DealerComparisonTool
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
