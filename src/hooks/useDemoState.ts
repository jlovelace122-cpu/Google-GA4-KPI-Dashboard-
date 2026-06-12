'use client';

import { useState } from 'react';
import { DATE_RANGE_PRESETS, DateRange } from '@/lib/dateRanges';
import { GA4ReportResult, GA4CohortResult } from '@/lib/ga4';
import { KpiPreset } from '@/lib/kpiPresets';
import { InsightResult } from '@/lib/insights';
import { MOCK_DATA_MAP, shiftMockData, MOCK_COHORT_DATA } from '@/lib/mockData';

export function useDemoState() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGE_PRESETS[3]);
  const [activePreset, setActivePreset] = useState<KpiPreset | null>(null);
  const [reportData, setReportData] = useState<GA4ReportResult | null>(null);
  const [previousData, setPreviousData] = useState<GA4ReportResult | null>(null);
  const [cohortData, setCohortData] = useState<GA4CohortResult | null>(null);
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const handlePresetSelect = (preset: KpiPreset) => {
    setActivePreset(preset);
    setInsights(null);
    setInsightsError(null);
    setCohortData(null);
    if (preset.reportType === 'cohort') {
      setCohortData(MOCK_COHORT_DATA);
      setReportData(null);
      setPreviousData(null);
      return;
    }
    const current = MOCK_DATA_MAP[preset.id] ?? null;
    setReportData(current);
    setPreviousData(current ? shiftMockData(current) : null);
  };

  // dateRange is always fresh from closure — safe to use directly
  const generateInsights = async () => {
    if (!activePreset || !reportData) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetch('/api/demo-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: activePreset,
          data: reportData,
          propertyLabel: 'CarNow (Demo)',
          dateRange,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to generate insights');
      }
      const result: InsightResult = await res.json();
      setInsights(result);
    } catch (e: unknown) {
      setInsightsError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setInsightsLoading(false);
    }
  };

  return {
    dateRange,
    setDateRange,
    activePreset,
    reportData,
    previousData,
    cohortData,
    insights,
    insightsLoading,
    insightsError,
    handlePresetSelect,
    generateInsights,
  };
}
