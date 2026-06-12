import { GA4ReportResult, GA4CohortResult, CohortRow } from "./ga4";

// Generates a date series for the last N days
function dateSeries(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ""));
  }
  return dates;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function trend(base: number, days: number, variance = 0.15): number[] {
  return Array.from({ length: days }, (_, i) => {
    const growth = 1 + (i / days) * 0.2;
    const noise = 1 + (Math.random() - 0.5) * variance;
    return Math.round(base * growth * noise);
  });
}

const DAYS = 30;
const dates = dateSeries(DAYS);

// ── Total Users ───────────────────────────────────────────────────────────────
const totalUsersValues = trend(3200, DAYS);
const newUsersValues = totalUsersValues.map((v) => Math.round(v * 0.62));
const activeUsersValues = totalUsersValues.map((v) => Math.round(v * 0.78));

export const MOCK_TOTAL_USERS: GA4ReportResult = {
  headers: ["date", "totalUsers", "newUsers", "activeUsers"],
  rows: dates.map((date, i) => ({
    date,
    totalUsers: String(totalUsersValues[i]),
    newUsers: String(newUsersValues[i]),
    activeUsers: String(activeUsersValues[i]),
  })),
  totals: {
    totalUsers: String(totalUsersValues.reduce((a, b) => a + b, 0)),
    newUsers: String(newUsersValues.reduce((a, b) => a + b, 0)),
    activeUsers: String(activeUsersValues.reduce((a, b) => a + b, 0)),
  },
  rowCount: DAYS,
};

// ── Sessions ──────────────────────────────────────────────────────────────────
const sessionsValues = trend(4800, DAYS);
export const MOCK_SESSIONS: GA4ReportResult = {
  headers: ["date", "sessions", "sessionsPerUser", "bounceRate"],
  rows: dates.map((date, i) => ({
    date,
    sessions: String(sessionsValues[i]),
    sessionsPerUser: (1.3 + Math.random() * 0.4).toFixed(2),
    bounceRate: (0.38 + (Math.random() - 0.5) * 0.08).toFixed(4),
  })),
  totals: {
    sessions: String(sessionsValues.reduce((a, b) => a + b, 0)),
    sessionsPerUser: "1.48",
    bounceRate: "0.4012",
  },
  rowCount: DAYS,
};

// ── Traffic Sources ───────────────────────────────────────────────────────────
export const MOCK_TRAFFIC_SOURCE: GA4ReportResult = {
  headers: ["sessionSource", "sessionMedium", "sessions", "totalUsers"],
  rows: [
    { sessionSource: "google", sessionMedium: "organic", sessions: "18420", totalUsers: "15340" },
    { sessionSource: "(direct)", sessionMedium: "(none)", sessions: "9810", totalUsers: "8220" },
    { sessionSource: "google", sessionMedium: "cpc", sessions: "7650", totalUsers: "6890" },
    { sessionSource: "facebook.com", sessionMedium: "referral", sessions: "4230", totalUsers: "3760" },
    { sessionSource: "bing", sessionMedium: "organic", sessions: "3140", totalUsers: "2890" },
    { sessionSource: "email", sessionMedium: "email", sessions: "2870", totalUsers: "2540" },
    { sessionSource: "instagram.com", sessionMedium: "referral", sessions: "1980", totalUsers: "1740" },
    { sessionSource: "youtube.com", sessionMedium: "referral", sessions: "1340", totalUsers: "1180" },
    { sessionSource: "dealer.com", sessionMedium: "referral", sessions: "980", totalUsers: "870" },
    { sessionSource: "autotrader.com", sessionMedium: "referral", sessions: "760", totalUsers: "690" },
  ],
  totals: { sessions: "51180", totalUsers: "43930" },
  rowCount: 10,
};

// ── New vs Returning ──────────────────────────────────────────────────────────
export const MOCK_NEW_VS_RETURNING: GA4ReportResult = {
  headers: ["newVsReturning", "newUsers", "activeUsers"],
  rows: [
    { newVsReturning: "new", newUsers: "28640", activeUsers: "28640" },
    { newVsReturning: "returning", newUsers: "0", activeUsers: "14920" },
  ],
  totals: { newUsers: "28640", activeUsers: "43560" },
  rowCount: 2,
};

// ── Engagement Rate ───────────────────────────────────────────────────────────
const engagedValues = trend(2100, DAYS, 0.12);
export const MOCK_ENGAGEMENT: GA4ReportResult = {
  headers: ["date", "engagementRate", "averageSessionDuration", "engagedSessions"],
  rows: dates.map((date, i) => ({
    date,
    engagementRate: (0.61 + (Math.random() - 0.5) * 0.06).toFixed(4),
    averageSessionDuration: String(rand(145, 210)),
    engagedSessions: String(engagedValues[i]),
  })),
  totals: {
    engagementRate: "0.6312",
    averageSessionDuration: "178",
    engagedSessions: String(engagedValues.reduce((a, b) => a + b, 0)),
  },
  rowCount: DAYS,
};

// ── Page Views ────────────────────────────────────────────────────────────────
const pvValues = trend(12400, DAYS);
export const MOCK_PAGE_VIEWS: GA4ReportResult = {
  headers: ["date", "screenPageViews", "screenPageViewsPerSession"],
  rows: dates.map((date, i) => ({
    date,
    screenPageViews: String(pvValues[i]),
    screenPageViewsPerSession: (3.1 + (Math.random() - 0.5) * 0.6).toFixed(2),
  })),
  totals: {
    screenPageViews: String(pvValues.reduce((a, b) => a + b, 0)),
    screenPageViewsPerSession: "3.24",
  },
  rowCount: DAYS,
};

// ── Top Pages ─────────────────────────────────────────────────────────────────
export const MOCK_TOP_PAGES: GA4ReportResult = {
  headers: ["pagePath", "pageTitle", "screenPageViews", "totalUsers", "averageSessionDuration"],
  rows: [
    { pagePath: "/", pageTitle: "CarNow – Find Your Next Car", screenPageViews: "42180", totalUsers: "28340", averageSessionDuration: "94" },
    { pagePath: "/inventory", pageTitle: "Browse Inventory | CarNow", screenPageViews: "31640", totalUsers: "21890", averageSessionDuration: "187" },
    { pagePath: "/inventory/new", pageTitle: "New Cars | CarNow", screenPageViews: "18920", totalUsers: "14210", averageSessionDuration: "203" },
    { pagePath: "/inventory/used", pageTitle: "Used Cars | CarNow", screenPageViews: "16340", totalUsers: "12780", averageSessionDuration: "198" },
    { pagePath: "/financing", pageTitle: "Auto Financing | CarNow", screenPageViews: "11280", totalUsers: "9430", averageSessionDuration: "142" },
    { pagePath: "/trade-in", pageTitle: "Get Your Trade-In Value | CarNow", screenPageViews: "8940", totalUsers: "7620", averageSessionDuration: "167" },
    { pagePath: "/contact", pageTitle: "Contact Us | CarNow", screenPageViews: "6720", totalUsers: "5890", averageSessionDuration: "78" },
    { pagePath: "/specials", pageTitle: "Current Specials & Deals | CarNow", screenPageViews: "5430", totalUsers: "4780", averageSessionDuration: "154" },
    { pagePath: "/service", pageTitle: "Service Center | CarNow", screenPageViews: "4890", totalUsers: "4120", averageSessionDuration: "112" },
    { pagePath: "/about", pageTitle: "About CarNow", screenPageViews: "2340", totalUsers: "2080", averageSessionDuration: "65" },
  ],
  totals: { screenPageViews: "148680", totalUsers: "43930", averageSessionDuration: "160" },
  rowCount: 10,
};

// ── Events ────────────────────────────────────────────────────────────────────
export const MOCK_EVENTS: GA4ReportResult = {
  headers: ["eventName", "eventCount", "totalUsers"],
  rows: [
    { eventName: "page_view", eventCount: "148680", totalUsers: "43930" },
    { eventName: "session_start", eventCount: "51180", totalUsers: "43930" },
    { eventName: "first_visit", eventCount: "28640", totalUsers: "28640" },
    { eventName: "view_item", eventCount: "24310", totalUsers: "18740" },
    { eventName: "scroll", eventCount: "19870", totalUsers: "16320" },
    { eventName: "click", eventCount: "14230", totalUsers: "12840" },
    { eventName: "vehicle_detail_view", eventCount: "11480", totalUsers: "9870" },
    { eventName: "financing_calculator_use", eventCount: "6340", totalUsers: "5920" },
    { eventName: "lead_form_submit", eventCount: "3120", totalUsers: "3120" },
    { eventName: "phone_call_click", eventCount: "2870", totalUsers: "2650" },
    { eventName: "trade_in_start", eventCount: "2340", totalUsers: "2180" },
    { eventName: "test_drive_request", eventCount: "1890", totalUsers: "1890" },
  ],
  totals: { eventCount: "314950", totalUsers: "43930" },
  rowCount: 12,
};

// ── Revenue ───────────────────────────────────────────────────────────────────
const revenueValues = trend(8400, DAYS, 0.2);
export const MOCK_REVENUE: GA4ReportResult = {
  headers: ["date", "totalRevenue", "purchaseRevenue", "averagePurchaseRevenue"],
  rows: dates.map((date, i) => ({
    date,
    totalRevenue: revenueValues[i].toFixed(2),
    purchaseRevenue: (revenueValues[i] * 0.91).toFixed(2),
    averagePurchaseRevenue: (revenueValues[i] / rand(8, 14)).toFixed(2),
  })),
  totals: {
    totalRevenue: revenueValues.reduce((a, b) => a + b, 0).toFixed(2),
    purchaseRevenue: (revenueValues.reduce((a, b) => a + b, 0) * 0.91).toFixed(2),
    averagePurchaseRevenue: "684.20",
  },
  rowCount: DAYS,
};

// ── Conversions ───────────────────────────────────────────────────────────────
const convValues = trend(48, DAYS, 0.25);
export const MOCK_CONVERSIONS: GA4ReportResult = {
  headers: ["date", "conversions", "sessionConversionRate"],
  rows: dates.map((date, i) => ({
    date,
    conversions: String(convValues[i]),
    sessionConversionRate: (convValues[i] / sessionsValues[i]).toFixed(4),
  })),
  totals: {
    conversions: String(convValues.reduce((a, b) => a + b, 0)),
    sessionConversionRate: "0.0312",
  },
  rowCount: DAYS,
};

// ── Retention ─────────────────────────────────────────────────────────────────
const dauValues = trend(0.18, DAYS, 0.08);
export const MOCK_RETENTION: GA4ReportResult = {
  headers: ["date", "dauPerMau", "dauPerWau", "wauPerMau"],
  rows: dates.map((date, i) => ({
    date,
    dauPerMau: (0.18 + (Math.random() - 0.5) * 0.03).toFixed(4),
    dauPerWau: (0.42 + (Math.random() - 0.5) * 0.05).toFixed(4),
    wauPerMau: (0.48 + (Math.random() - 0.5) * 0.04).toFixed(4),
  })),
  totals: { dauPerMau: "0.1842", dauPerWau: "0.4218", wauPerMau: "0.4834" },
  rowCount: DAYS,
};

// ── Devices ───────────────────────────────────────────────────────────────────
export const MOCK_DEVICES: GA4ReportResult = {
  headers: ["deviceCategory", "sessions", "totalUsers"],
  rows: [
    { deviceCategory: "mobile", sessions: "28140", totalUsers: "24380" },
    { deviceCategory: "desktop", sessions: "18920", totalUsers: "16340" },
    { deviceCategory: "tablet", sessions: "4120", totalUsers: "3210" },
  ],
  totals: { sessions: "51180", totalUsers: "43930" },
  rowCount: 3,
};

// ── Geography ─────────────────────────────────────────────────────────────────
export const MOCK_GEOGRAPHY: GA4ReportResult = {
  headers: ["country", "totalUsers", "sessions"],
  rows: [
    { country: "United States", totalUsers: "41280", sessions: "48340" },
    { country: "Canada", totalUsers: "980", sessions: "1140" },
    { country: "United Kingdom", totalUsers: "420", sessions: "490" },
    { country: "Australia", totalUsers: "310", sessions: "360" },
    { country: "Germany", totalUsers: "180", sessions: "210" },
    { country: "Mexico", totalUsers: "160", sessions: "190" },
    { country: "France", totalUsers: "140", sessions: "165" },
    { country: "India", totalUsers: "120", sessions: "142" },
    { country: "Brazil", totalUsers: "98", sessions: "115" },
    { country: "Japan", totalUsers: "87", sessions: "101" },
  ],
  totals: { totalUsers: "43930", sessions: "51180" },
  rowCount: 10,
};

// ── Lead Events ───────────────────────────────────────────────────────────────
export const MOCK_LEAD_EVENTS: GA4ReportResult = {
  headers: ["eventName", "eventCount", "totalUsers"],
  rows: [
    { eventName: "lead_form_submit", eventCount: "3120", totalUsers: "3120" },
    { eventName: "phone_call_click", eventCount: "2870", totalUsers: "2650" },
    { eventName: "financing_calculator_use", eventCount: "2340", totalUsers: "2180" },
    { eventName: "trade_in_start", eventCount: "1890", totalUsers: "1760" },
    { eventName: "test_drive_request", eventCount: "1480", totalUsers: "1480" },
    { eventName: "schedule_service", eventCount: "980", totalUsers: "920" },
  ],
  totals: { eventCount: "12680", totalUsers: "9820" },
  rowCount: 6,
};

// ── CTA Analysis ──────────────────────────────────────────────────────────────
export const MOCK_CTA_ANALYSIS: GA4ReportResult = {
  headers: ["eventName", "eventCount", "totalUsers", "engagementRate", "sessionConversionRate", "eventCountPerUser"],
  rows: [
    { eventName: "check_availability",       eventCount: "3241", totalUsers: "2187", engagementRate: "0.6912", sessionConversionRate: "0.1512", eventCountPerUser: "1.48" },
    { eventName: "unlock_todays_price",      eventCount: "2103", totalUsers: "1456", engagementRate: "0.7134", sessionConversionRate: "0.1823", eventCountPerUser: "1.44" },
    { eventName: "calculate_payment",        eventCount: "1876", totalUsers: "1234", engagementRate: "0.7421", sessionConversionRate: "0.2234", eventCountPerUser: "1.52" },
    { eventName: "view_additional_pricing",  eventCount: "1247", totalUsers: "891",  engagementRate: "0.6823", sessionConversionRate: "0.1234", eventCountPerUser: "1.40" },
    { eventName: "trade_in_value",           eventCount: "987",  totalUsers: "734",  engagementRate: "0.6634", sessionConversionRate: "0.0923", eventCountPerUser: "1.34" },
    { eventName: "schedule_test_drive",      eventCount: "654",  totalUsers: "521",  engagementRate: "0.7812", sessionConversionRate: "0.3112", eventCountPerUser: "1.26" },
  ],
  totals: { eventCount: "10108", totalUsers: "7023" },
  rowCount: 6,
};

// ── New Car VDP ───────────────────────────────────────────────────────────────
export const MOCK_NEW_CAR_VDP: GA4ReportResult = {
  headers: ["pagePath", "screenPageViews", "totalUsers", "averageSessionDuration", "bounceRate", "conversions"],
  rows: [
    { pagePath: "/new/2024-ford-f150",               screenPageViews: "2341", totalUsers: "1567", averageSessionDuration: "165.4", bounceRate: "0.4512", conversions: "112" },
    { pagePath: "/new/2025-chevrolet-silverado",      screenPageViews: "1987", totalUsers: "1321", averageSessionDuration: "178.2", bounceRate: "0.4321", conversions: "94"  },
    { pagePath: "/new/2024-toyota-rav4",             screenPageViews: "1789", totalUsers: "1187", averageSessionDuration: "211.7", bounceRate: "0.3623", conversions: "87"  },
    { pagePath: "/new/2024-honda-accord",            screenPageViews: "1876", totalUsers: "1234", averageSessionDuration: "187.3", bounceRate: "0.4201", conversions: "89"  },
    { pagePath: "/new/2024-honda-cr-v",              screenPageViews: "1654", totalUsers: "1098", averageSessionDuration: "198.1", bounceRate: "0.3912", conversions: "79"  },
    { pagePath: "/new/2024-toyota-camry",            screenPageViews: "1654", totalUsers: "1098", averageSessionDuration: "203.4", bounceRate: "0.3801", conversions: "76"  },
    { pagePath: "/new/2024-jeep-grand-cherokee",     screenPageViews: "1543", totalUsers: "1023", averageSessionDuration: "195.6", bounceRate: "0.4012", conversions: "71"  },
    { pagePath: "/new/2024-ram-1500",                screenPageViews: "1432", totalUsers: "956",  averageSessionDuration: "172.8", bounceRate: "0.4423", conversions: "68"  },
  ],
  totals: { screenPageViews: "14276", totalUsers: "9484", conversions: "676" },
  rowCount: 8,
};

// ── Used Car VDP ──────────────────────────────────────────────────────────────
export const MOCK_USED_CAR_VDP: GA4ReportResult = {
  headers: ["pagePath", "screenPageViews", "totalUsers", "averageSessionDuration", "bounceRate", "conversions"],
  rows: [
    { pagePath: "/used/2022-ford-f150",              screenPageViews: "2156", totalUsers: "1432", averageSessionDuration: "245.3", bounceRate: "0.3312", conversions: "134" },
    { pagePath: "/used/2021-toyota-camry",           screenPageViews: "1876", totalUsers: "1243", averageSessionDuration: "232.1", bounceRate: "0.3512", conversions: "98"  },
    { pagePath: "/used/2022-honda-accord",           screenPageViews: "1654", totalUsers: "1098", averageSessionDuration: "228.7", bounceRate: "0.3601", conversions: "87"  },
    { pagePath: "/used/2023-chevrolet-silverado",    screenPageViews: "1543", totalUsers: "1023", averageSessionDuration: "198.4", bounceRate: "0.3823", conversions: "76"  },
    { pagePath: "/used/2022-toyota-rav4",            screenPageViews: "1456", totalUsers: "967",  averageSessionDuration: "221.2", bounceRate: "0.3512", conversions: "72"  },
    { pagePath: "/used/2021-jeep-grand-cherokee",    screenPageViews: "1432", totalUsers: "956",  averageSessionDuration: "212.8", bounceRate: "0.3712", conversions: "71"  },
    { pagePath: "/used/2022-ram-1500",               screenPageViews: "1321", totalUsers: "876",  averageSessionDuration: "189.5", bounceRate: "0.4012", conversions: "65"  },
    { pagePath: "/used/2021-honda-cr-v",             screenPageViews: "1234", totalUsers: "821",  averageSessionDuration: "215.6", bounceRate: "0.3712", conversions: "61"  },
  ],
  totals: { screenPageViews: "12672", totalUsers: "8416", conversions: "664" },
  rowCount: 8,
};

// ── Form Completion Rate ───────────────────────────────────────────────────────
export const MOCK_FORM_COMPLETION: GA4ReportResult = {
  headers: ["eventName", "eventCount", "totalUsers", "sessionConversionRate"],
  rows: [
    { eventName: "form_start",           eventCount: "4521", totalUsers: "3234", sessionConversionRate: "0.0812" },
    { eventName: "form_submit",          eventCount: "2876", totalUsers: "2154", sessionConversionRate: "0.4234" },
    { eventName: "generate_lead",        eventCount: "2543", totalUsers: "1987", sessionConversionRate: "0.4812" },
    { eventName: "contact_dealer",       eventCount: "1234", totalUsers: "987",  sessionConversionRate: "0.6234" },
    { eventName: "schedule_test_drive",  eventCount: "876",  totalUsers: "721",  sessionConversionRate: "0.7112" },
  ],
  totals: { eventCount: "12050", totalUsers: "9083" },
  rowCount: 5,
};

// ── Service Conversion Trends ─────────────────────────────────────────────────
const serviceConvValues = trend(18, DAYS, 0.28);
const serviceTotalUsers = serviceConvValues.map((v) => Math.round(v * 5.4));
export const MOCK_SERVICE_CONVERSIONS: GA4ReportResult = {
  headers: ["date", "conversions", "totalUsers", "sessionConversionRate"],
  rows: dates.map((date, i) => ({
    date,
    conversions: String(serviceConvValues[i]),
    totalUsers: String(serviceTotalUsers[i]),
    sessionConversionRate: (serviceConvValues[i] / serviceTotalUsers[i]).toFixed(4),
  })),
  totals: {
    conversions: String(serviceConvValues.reduce((a, b) => a + b, 0)),
    totalUsers: String(serviceTotalUsers.reduce((a, b) => a + b, 0)),
  },
  rowCount: DAYS,
};

// ── Sales Conversion Trends ───────────────────────────────────────────────────
const salesConvValues = trend(48, DAYS, 0.22);
const salesTotalUsers = salesConvValues.map((v) => Math.round(v * 4.1));
export const MOCK_SALES_CONVERSIONS: GA4ReportResult = {
  headers: ["date", "conversions", "totalUsers", "sessionConversionRate"],
  rows: dates.map((date, i) => ({
    date,
    conversions: String(salesConvValues[i]),
    totalUsers: String(salesTotalUsers[i]),
    sessionConversionRate: (salesConvValues[i] / salesTotalUsers[i]).toFixed(4),
  })),
  totals: {
    conversions: String(salesConvValues.reduce((a, b) => a + b, 0)),
    totalUsers: String(salesTotalUsers.reduce((a, b) => a + b, 0)),
  },
  rowCount: DAYS,
};

// ── Sources of Conversions ────────────────────────────────────────────────────
export const MOCK_CONVERSION_SOURCES: GA4ReportResult = {
  headers: ["sessionSourceMedium", "conversions", "totalUsers", "sessionConversionRate", "engagementRate"],
  rows: [
    { sessionSourceMedium: "google / organic",       conversions: "1876", totalUsers: "12456", sessionConversionRate: "0.1507", engagementRate: "0.6823" },
    { sessionSourceMedium: "google / cpc",           conversions: "1543", totalUsers: "8765",  sessionConversionRate: "0.1760", engagementRate: "0.7134" },
    { sessionSourceMedium: "direct / (none)",        conversions: "987",  totalUsers: "6543",  sessionConversionRate: "0.1509", engagementRate: "0.6512" },
    { sessionSourceMedium: "autotrader / referral",  conversions: "543",  totalUsers: "3421",  sessionConversionRate: "0.1587", engagementRate: "0.7234" },
    { sessionSourceMedium: "cars.com / referral",    conversions: "487",  totalUsers: "3156",  sessionConversionRate: "0.1543", engagementRate: "0.7123" },
    { sessionSourceMedium: "facebook / cpc",         conversions: "432",  totalUsers: "4321",  sessionConversionRate: "0.1000", engagementRate: "0.6234" },
    { sessionSourceMedium: "email / newsletter",     conversions: "321",  totalUsers: "1876",  sessionConversionRate: "0.1711", engagementRate: "0.7456" },
    { sessionSourceMedium: "bing / cpc",             conversions: "298",  totalUsers: "2156",  sessionConversionRate: "0.1382", engagementRate: "0.6712" },
    { sessionSourceMedium: "carfax / referral",      conversions: "187",  totalUsers: "1234",  sessionConversionRate: "0.1516", engagementRate: "0.6934" },
  ],
  totals: { conversions: "6674", totalUsers: "43928" },
  rowCount: 9,
};

// ── Site Speed Analysis ───────────────────────────────────────────────────────
export const MOCK_SITE_SPEED: GA4ReportResult = {
  headers: ["pagePath", "averageSessionDuration", "screenPageViews", "bounceRate", "engagementRate"],
  rows: [
    { pagePath: "/",           averageSessionDuration: "145.2", screenPageViews: "18765", bounceRate: "0.3812", engagementRate: "0.6188" },
    { pagePath: "/new/",       averageSessionDuration: "198.4", screenPageViews: "12456", bounceRate: "0.4201", engagementRate: "0.5799" },
    { pagePath: "/used/",      averageSessionDuration: "212.7", screenPageViews: "11234", bounceRate: "0.3956", engagementRate: "0.6044" },
    { pagePath: "/specials/",  averageSessionDuration: "167.3", screenPageViews: "8765",  bounceRate: "0.3512", engagementRate: "0.6488" },
    { pagePath: "/service/",   averageSessionDuration: "189.6", screenPageViews: "7654",  bounceRate: "0.4412", engagementRate: "0.5588" },
    { pagePath: "/finance/",   averageSessionDuration: "234.1", screenPageViews: "6543",  bounceRate: "0.3301", engagementRate: "0.6699" },
    { pagePath: "/inventory/", averageSessionDuration: "221.8", screenPageViews: "5432",  bounceRate: "0.3623", engagementRate: "0.6377" },
    { pagePath: "/about/",     averageSessionDuration: "123.4", screenPageViews: "4321",  bounceRate: "0.4812", engagementRate: "0.5188" },
    { pagePath: "/contact/",   averageSessionDuration: "156.7", screenPageViews: "3456",  bounceRate: "0.2934", engagementRate: "0.7066" },
  ],
  totals: { screenPageViews: "78626" },
  rowCount: 9,
};

/**
 * Returns a copy of a GA4ReportResult with numeric values scaled by `factor`.
 * Used in demo mode to simulate a "previous period" comparison.
 */
export function shiftMockData(data: GA4ReportResult, factor = 0.88): GA4ReportResult {
  const shiftVal = (key: string, v: string): string => {
    if (key === "date" || isNaN(parseFloat(v))) return v;
    const scaled = parseFloat(v) * factor * (0.93 + Math.random() * 0.14);
    return v.includes(".") ? scaled.toFixed(2) : String(Math.round(scaled));
  };
  return {
    ...data,
    rows: data.rows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([k, v]) => [k, shiftVal(k, v)]))
    ),
    totals: data.totals
      ? Object.fromEntries(Object.entries(data.totals).map(([k, v]) => [k, shiftVal(k, v)]))
      : undefined,
  };
}

// ── Mock Cohort Retention ─────────────────────────────────────────────────────
function buildMockCohort(): GA4CohortResult {
  const weeksBack = 8;
  // Retention curve: week0=100%, then realistic auto-dealer site re-visit rates
  const retentionCurve = [1.0, 0.24, 0.16, 0.12, 0.09, 0.08, 0.07, 0.06];

  const cohortLabels = ["Mar 10","Mar 17","Mar 24","Mar 31","Apr 7","Apr 14","Apr 21","Apr 28"];
  const cohortSizes  = [1240, 1180, 1090, 1320, 1150, 1260, 1080, 1310];

  const cohorts: CohortRow[] = cohortLabels.map((label, ci) => {
    const total = cohortSizes[ci];
    const available = weeksBack - ci; // later cohorts have fewer weeks of data
    const weeklyUsers: (number | null)[] = retentionCurve.map((rate, wi) => {
      if (wi >= available) return null; // future weeks not yet available
      const noise = 0.9 + Math.random() * 0.2;
      return wi === 0 ? total : Math.round(total * rate * noise);
    });
    return {
      cohortLabel: label,
      cohortStartDate: `2026-0${3 + Math.floor(ci / 4)}-${String(10 + (ci % 4) * 7).padStart(2, "0")}`,
      totalUsers: total,
      weeklyUsers,
    };
  });

  return { cohorts, maxWeeks: weeksBack };
}

export const MOCK_COHORT_DATA: GA4CohortResult = buildMockCohort();

export const MOCK_DATA_MAP: Record<string, GA4ReportResult> = {
  "total-users": MOCK_TOTAL_USERS,
  "sessions": MOCK_SESSIONS,
  "traffic-source": MOCK_TRAFFIC_SOURCE,
  "new-vs-returning": MOCK_NEW_VS_RETURNING,
  "engagement-rate": MOCK_ENGAGEMENT,
  "page-views": MOCK_PAGE_VIEWS,
  "top-pages": MOCK_TOP_PAGES,
  "events": MOCK_EVENTS,
  "revenue": MOCK_REVENUE,
  "conversions": MOCK_CONVERSIONS,
  "retention": MOCK_RETENTION,
  "devices": MOCK_DEVICES,
  "geography": MOCK_GEOGRAPHY,
  "lead-events": MOCK_LEAD_EVENTS,
  // Dealership Intelligence
  "cta-analysis": MOCK_CTA_ANALYSIS,
  "new-car-vdp": MOCK_NEW_CAR_VDP,
  "used-car-vdp": MOCK_USED_CAR_VDP,
  "form-completion": MOCK_FORM_COMPLETION,
  "service-conversions": MOCK_SERVICE_CONVERSIONS,
  "sales-conversions": MOCK_SALES_CONVERSIONS,
  "conversion-sources": MOCK_CONVERSION_SOURCES,
  "site-speed": MOCK_SITE_SPEED,
};
