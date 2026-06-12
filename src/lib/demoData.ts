// ─── Demo Data Generator ───────────────────────────────────────────────────────
// Returns realistic synthetic automotive dealership KPI data for every preset.
// Used when DEMO_MODE=true or when the property is the demo placeholder.

import { GA4ReportResult, GA4ReportRow, GA4CohortResult } from "./ga4";
import { format, parseISO, eachDayOfInterval, subWeeks, startOfWeek } from "date-fns";

// ─── Seeded random for stable values ─────────────────────────────────────────
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function rnd(min: number, max: number, r: () => number) {
  return Math.round(min + r() * (max - min));
}

function rndF(min: number, max: number, r: () => number) {
  return parseFloat((min + r() * (max - min)).toFixed(4));
}

// ─── Generate daily time-series rows ────────────────────────────────────────
function dailySeries(
  startDate: string,
  endDate: string,
  metrics: string[],
): GA4ReportRow[] {
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  return days.map((day, i) => {
    const r = seeded(i * 97 + 13);
    // Weekday / weekend factor
    const dow = day.getDay();
    const wf = (dow === 0 || dow === 6) ? 0.6 : 1.0;
    // Slight upward trend
    const trend = 1 + (i / days.length) * 0.15;

    const row: GA4ReportRow = {
      date: format(day, "yyyyMMdd"),
    };
    for (const m of metrics) {
      row[m] = metricValue(m, r, wf, trend);
    }
    return row;
  });
}

function metricValue(m: string, r: () => number, wf = 1, trend = 1): string {
  switch (m) {
    case "totalUsers":          return String(Math.round(rnd(420, 780, r) * wf * trend));
    case "newUsers":            return String(Math.round(rnd(280, 560, r) * wf * trend));
    case "activeUsers":         return String(Math.round(rnd(400, 750, r) * wf * trend));
    case "sessions":            return String(Math.round(rnd(550, 1100, r) * wf * trend));
    case "sessionsPerUser":     return rndF(1.2, 1.9, r).toString();
    case "bounceRate":          return rndF(0.28, 0.52, r).toString();
    case "engagementRate":      return rndF(0.48, 0.75, r).toString();
    case "engagedSessions":     return String(Math.round(rnd(260, 600, r) * wf * trend));
    case "averageSessionDuration": return rndF(95, 230, r).toString();
    case "screenPageViews":     return String(Math.round(rnd(1200, 3400, r) * wf * trend));
    case "screenPageViewsPerSession": return rndF(2.1, 4.8, r).toString();
    case "eventCount":          return String(Math.round(rnd(800, 2200, r) * wf * trend));
    case "eventCountPerUser":   return rndF(1.8, 5.2, r).toString();
    case "totalRevenue":        return rndF(1800, 9200, r).toFixed(2);
    case "purchaseRevenue":     return rndF(1500, 8800, r).toFixed(2);
    case "averagePurchaseRevenue": return rndF(380, 920, r).toFixed(2);
    case "conversions":         return String(Math.round(rnd(18, 75, r) * wf * trend));
    case "sessionConversionRate": return rndF(0.022, 0.089, r).toString();
    case "dauPerMau":           return rndF(0.08, 0.22, r).toString();
    case "dauPerWau":           return rndF(0.18, 0.42, r).toString();
    case "wauPerMau":           return rndF(0.32, 0.62, r).toString();
    case "totalUsers_dim":      return String(rnd(50, 800, r));
    default:                    return String(rnd(100, 5000, r));
  }
}

// ─── Totals row from rows ────────────────────────────────────────────────────
function computeTotals(rows: GA4ReportRow[], metrics: string[]): GA4ReportRow {
  const totals: GA4ReportRow = {};
  for (const m of metrics) {
    const rateMetrics = ["bounceRate", "engagementRate", "sessionsPerUser",
      "averageSessionDuration", "sessionConversionRate", "eventCountPerUser",
      "dauPerMau", "dauPerWau", "wauPerMau", "screenPageViewsPerSession"];
    if (rateMetrics.includes(m)) {
      const vals = rows.map(r => parseFloat(r[m] ?? "0")).filter(v => !isNaN(v));
      totals[m] = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4) : "0";
    } else {
      const sum = rows.reduce((acc, r) => acc + parseFloat(r[m] ?? "0"), 0);
      totals[m] = sum % 1 === 0 ? String(sum) : sum.toFixed(2);
    }
  }
  return totals;
}

// ─── Dimension-specific generators ───────────────────────────────────────────
function trafficSourceRows(metrics: string[]): GA4ReportRow[] {
  const sources = [
    { sessionSource: "google",    sessionMedium: "organic",  factor: 1.0 },
    { sessionSource: "google",    sessionMedium: "cpc",      factor: 0.7 },
    { sessionSource: "(direct)",  sessionMedium: "(none)",   factor: 0.5 },
    { sessionSource: "cars.com",  sessionMedium: "referral", factor: 0.35 },
    { sessionSource: "autotrader",sessionMedium: "referral", factor: 0.3 },
    { sessionSource: "facebook",  sessionMedium: "paid_social", factor: 0.22 },
    { sessionSource: "bing",      sessionMedium: "cpc",      factor: 0.18 },
    { sessionSource: "carmax",    sessionMedium: "referral", factor: 0.12 },
    { sessionSource: "email",     sessionMedium: "newsletter",factor: 0.1 },
    { sessionSource: "youtube",   sessionMedium: "paid_video",factor: 0.08 },
  ];
  return sources.map((s, i) => {
    const r = seeded(i * 43 + 7);
    const { factor, ...dims } = s;
    const row: GA4ReportRow = { ...dims };
    for (const m of metrics) row[m] = metricValue(m, r, factor);
    return row;
  });
}

function newVsReturningRows(metrics: string[]): GA4ReportRow[] {
  return [
    { newVsReturning: "new",       ...Object.fromEntries(metrics.map((m, i) => [m, metricValue(m, seeded(i + 1), 1.1)])) },
    { newVsReturning: "returning", ...Object.fromEntries(metrics.map((m, i) => [m, metricValue(m, seeded(i + 20), 0.7)])) },
  ];
}

function deviceRows(metrics: string[]): GA4ReportRow[] {
  const devices = [
    { deviceCategory: "mobile",  factor: 1.0 },
    { deviceCategory: "desktop", factor: 0.75 },
    { deviceCategory: "tablet",  factor: 0.18 },
  ];
  return devices.map((d, i) => {
    const r = seeded(i * 19 + 3);
    const row: GA4ReportRow = { deviceCategory: d.deviceCategory };
    for (const m of metrics) row[m] = metricValue(m, r, d.factor);
    return row;
  });
}

function geographyRows(metrics: string[]): GA4ReportRow[] {
  const countries = [
    { country: "United States",   factor: 1.0 },
    { country: "Canada",          factor: 0.15 },
    { country: "United Kingdom",  factor: 0.07 },
    { country: "Australia",       factor: 0.05 },
    { country: "Germany",         factor: 0.04 },
    { country: "Mexico",          factor: 0.04 },
    { country: "France",          factor: 0.03 },
    { country: "India",           factor: 0.03 },
    { country: "Brazil",          factor: 0.02 },
    { country: "Japan",           factor: 0.02 },
  ];
  return countries.map((c, i) => {
    const r = seeded(i * 31 + 11);
    const row: GA4ReportRow = { country: c.country };
    for (const m of metrics) row[m] = metricValue(m, r, c.factor);
    return row;
  });
}

function topPagesRows(metrics: string[]): GA4ReportRow[] {
  const pages = [
    { pagePath: "/", pageTitle: "Home | Auto Group" },
    { pagePath: "/new-cars/",           pageTitle: "New Cars | Auto Group" },
    { pagePath: "/used-cars/",          pageTitle: "Used Cars | Auto Group" },
    { pagePath: "/new/toyota/camry/",   pageTitle: "2026 Toyota Camry | Auto Group" },
    { pagePath: "/new/ford/f150/",      pageTitle: "2026 Ford F-150 | Auto Group" },
    { pagePath: "/service/",            pageTitle: "Service Center | Auto Group" },
    { pagePath: "/finance/",            pageTitle: "Finance | Auto Group" },
    { pagePath: "/used/toyota/rav4/",   pageTitle: "Used Toyota RAV4 | Auto Group" },
    { pagePath: "/contact/",            pageTitle: "Contact Us | Auto Group" },
    { pagePath: "/specials/",           pageTitle: "Current Specials | Auto Group" },
    { pagePath: "/trade-in/",           pageTitle: "Trade-In Value | Auto Group" },
    { pagePath: "/schedule-service/",   pageTitle: "Schedule Service | Auto Group" },
    { pagePath: "/new/chevrolet/silverado/", pageTitle: "2026 Chevy Silverado | Auto Group" },
    { pagePath: "/used/honda/accord/",  pageTitle: "Used Honda Accord | Auto Group" },
    { pagePath: "/about/",              pageTitle: "About Us | Auto Group" },
  ];
  return pages.map((p, i) => {
    const factor = Math.max(0.05, 1 - i * 0.065);
    const r = seeded(i * 53 + 17);
    const row: GA4ReportRow = { ...p };
    for (const m of metrics) row[m] = metricValue(m, r, factor);
    return row;
  });
}

function newVdpRows(metrics: string[]): GA4ReportRow[] {
  const pages = [
    "/new/toyota/camry/2026-vdp-12345/",
    "/new/ford/f150/2026-vdp-23456/",
    "/new/chevrolet/silverado/2026-vdp-34567/",
    "/new/honda/crv/2026-vdp-45678/",
    "/new/toyota/tacoma/2026-vdp-56789/",
    "/new/ford/explorer/2026-vdp-67890/",
    "/new/jeep/grand-cherokee/2026-vdp-78901/",
    "/new/ram/1500/2026-vdp-89012/",
  ];
  return pages.map((p, i) => {
    const factor = Math.max(0.08, 1 - i * 0.11);
    const r = seeded(i * 61 + 23);
    const row: GA4ReportRow = { pagePath: p };
    for (const m of metrics) row[m] = metricValue(m, r, factor);
    return row;
  });
}

function usedVdpRows(metrics: string[]): GA4ReportRow[] {
  const pages = [
    "/used/toyota/rav4/2023-vdp-11111/",
    "/used/honda/accord/2022-vdp-22222/",
    "/used/ford/f150/2021-vdp-33333/",
    "/used/chevrolet/silverado/2022-vdp-44444/",
    "/used/toyota/camry/2023-vdp-55555/",
    "/used/honda/crv/2022-vdp-66666/",
    "/used/jeep/wrangler/2021-vdp-77777/",
    "/used/ford/explorer/2022-vdp-88888/",
    "/used/ram/1500/2023-vdp-99999/",
  ];
  return pages.map((p, i) => {
    const factor = Math.max(0.07, 1 - i * 0.1);
    const r = seeded(i * 67 + 29);
    const row: GA4ReportRow = { pagePath: p };
    for (const m of metrics) row[m] = metricValue(m, r, factor);
    return row;
  });
}

function siteSpeedRows(metrics: string[]): GA4ReportRow[] {
  const pages = [
    "/", "/new-cars/", "/used-cars/", "/service/", "/finance/",
    "/trade-in/", "/contact/", "/specials/", "/schedule-service/", "/about/",
  ];
  return pages.map((p, i) => {
    const factor = Math.max(0.1, 1 - i * 0.09);
    const r = seeded(i * 71 + 37);
    const row: GA4ReportRow = { pagePath: p };
    for (const m of metrics) row[m] = metricValue(m, r, factor);
    return row;
  });
}

function eventRows(metrics: string[], filterValues?: string[]): GA4ReportRow[] {
  const allEvents = [
    { name: "page_view",                  factor: 1.0 },
    { name: "session_start",              factor: 0.95 },
    { name: "first_visit",                factor: 0.7 },
    { name: "scroll",                     factor: 0.9 },
    { name: "click",                      factor: 0.65 },
    { name: "view_item",                  factor: 0.45 },
    { name: "lead_form_submit",           factor: 0.15 },
    { name: "phone_call_click",           factor: 0.22 },
    { name: "test_drive_request",         factor: 0.08 },
    { name: "trade_in_start",             factor: 0.12 },
    { name: "financing_calculator_use",   factor: 0.18 },
    { name: "schedule_service",           factor: 0.19 },
    { name: "form_start",                 factor: 0.32 },
    { name: "form_submit",                factor: 0.18 },
    { name: "generate_lead",              factor: 0.14 },
    { name: "contact_dealer",             factor: 0.11 },
    { name: "schedule_test_drive",        factor: 0.09 },
    { name: "view_additional_pricing",    factor: 0.25 },
    { name: "unlock_todays_price",        factor: 0.21 },
    { name: "calculate_payment",          factor: 0.2 },
    { name: "check_availability",         factor: 0.17 },
    { name: "trade_in_value",             factor: 0.14 },
    { name: "service_appointment",        factor: 0.13 },
    { name: "service_inquiry",            factor: 0.16 },
    { name: "purchase",                   factor: 0.04 },
  ];

  const events = filterValues
    ? allEvents.filter(e => filterValues.includes(e.name))
    : allEvents.slice(0, 12);

  return events.map((e, i) => {
    const r = seeded(i * 41 + 5);
    const row: GA4ReportRow = { eventName: e.name };
    for (const m of metrics) row[m] = metricValue(m, r, e.factor);
    return row;
  });
}

function sourcesMediumRows(metrics: string[]): GA4ReportRow[] {
  const sources = [
    { sessionSourceMedium: "google / organic",   factor: 1.0 },
    { sessionSourceMedium: "google / cpc",        factor: 0.65 },
    { sessionSourceMedium: "(direct) / (none)",   factor: 0.5 },
    { sessionSourceMedium: "cars.com / referral", factor: 0.32 },
    { sessionSourceMedium: "autotrader / referral", factor: 0.28 },
    { sessionSourceMedium: "facebook / paid_social", factor: 0.2 },
    { sessionSourceMedium: "bing / cpc",          factor: 0.16 },
    { sessionSourceMedium: "email / newsletter",  factor: 0.1 },
  ];
  return sources.map((s, i) => {
    const r = seeded(i * 37 + 9);
    const row: GA4ReportRow = { sessionSourceMedium: s.sessionSourceMedium };
    for (const m of metrics) row[m] = metricValue(m, r, s.factor);
    return row;
  });
}

// ─── Main generator ───────────────────────────────────────────────────────────
export function generateDemoReport(params: {
  metrics: string[];
  dimensions?: string[];
  startDate: string;
  endDate: string;
  dimensionFilters?: { fieldName: string; values?: string[]; contains?: string }[];
}): GA4ReportResult {
  const { metrics, dimensions = [], startDate, endDate, dimensionFilters } = params;
  const filterValues = dimensionFilters?.[0]?.values;
  const filterContains = dimensionFilters?.[0]?.contains;
  const firstDim = dimensions[0];

  let rows: GA4ReportRow[] = [];

  if (firstDim === "date") {
    rows = dailySeries(startDate, endDate, metrics);
  } else if (firstDim === "sessionSource" || firstDim === "sessionMedium") {
    rows = trafficSourceRows(metrics);
  } else if (firstDim === "newVsReturning") {
    rows = newVsReturningRows(metrics);
  } else if (firstDim === "deviceCategory") {
    rows = deviceRows(metrics);
  } else if (firstDim === "country") {
    rows = geographyRows(metrics);
  } else if (firstDim === "pagePath" && dimensions.includes("pageTitle")) {
    rows = topPagesRows(metrics);
  } else if (firstDim === "pagePath" && filterContains?.includes("/new/")) {
    rows = newVdpRows(metrics);
  } else if (firstDim === "pagePath" && filterContains?.includes("/used/")) {
    rows = usedVdpRows(metrics);
  } else if (firstDim === "pagePath") {
    rows = siteSpeedRows(metrics);
  } else if (firstDim === "eventName") {
    rows = eventRows(metrics, filterValues);
  } else if (firstDim === "sessionSourceMedium") {
    rows = sourcesMediumRows(metrics);
  } else {
    // No dimensions / unknown — return a single totals-like row
    const r = seeded(42);
    const row: GA4ReportRow = {};
    for (const m of metrics) row[m] = metricValue(m, r);
    rows = [row];
  }

  const headers = [...dimensions, ...metrics];
  const totals = computeTotals(rows, metrics);

  return { headers, rows, totals, rowCount: rows.length };
}

// ─── Cohort demo data ────────────────────────────────────────────────────────
export function generateDemoCohort(weeksBack = 8): GA4CohortResult {
  const cohorts = Array.from({ length: weeksBack }).map((_, i) => {
    const weekNum = weeksBack - i;
    const weekStart = startOfWeek(subWeeks(new Date(), weekNum), { weekStartsOn: 1 });
    const seed = i * 83 + 17;
    const r = seeded(seed);
    const totalUsers = rnd(280, 680, r);
    const weeklyUsers: (number | null)[] = [];

    for (let w = 0; w < weeksBack; w++) {
      if (w === 0) {
        weeklyUsers.push(totalUsers);
      } else if (w >= weekNum) {
        weeklyUsers.push(null); // future data not yet available
      } else {
        // Realistic retention curve: ~40% wk1, ~25% wk2, ~18% wk3, etc.
        const retention = Math.pow(0.62, w) * (0.85 + r() * 0.3);
        weeklyUsers.push(Math.round(totalUsers * retention));
      }
    }

    return {
      cohortLabel: format(weekStart, "MMM d"),
      cohortStartDate: format(weekStart, "yyyy-MM-dd"),
      totalUsers,
      weeklyUsers,
    };
  });

  return { cohorts, maxWeeks: weeksBack };
}
