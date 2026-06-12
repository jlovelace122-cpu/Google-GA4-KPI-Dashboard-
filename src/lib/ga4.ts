import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { GoogleAuth } from "google-auth-library";

// ─── Service-account bypass ───────────────────────────────────────────────────
// When BYPASS_AUTH=true, API routes call this instead of using the OAuth session token.
// Set GA4_SERVICE_ACCOUNT_KEY in .env.local to the raw JSON string of your service account key.
export async function getServiceAccountToken(): Promise<string> {
  // Fast path: use a pre-generated static token (e.g. from `gcloud auth print-access-token`)
  // Useful when the service account doesn't yet have GA4 property access.
  // Note: these tokens expire after ~1 hour — regenerate with `gcloud auth print-access-token`.
  if (process.env.GA4_STATIC_TOKEN) {
    return process.env.GA4_STATIC_TOKEN;
  }

  // Support either a full JSON blob (GA4_SERVICE_ACCOUNT_KEY) or the split
  // GA4_CLIENT_EMAIL + GA4_PRIVATE_KEY variables that are already in .env.local
  let credentials: Record<string, string>;

  if (process.env.GA4_SERVICE_ACCOUNT_KEY && process.env.GA4_SERVICE_ACCOUNT_KEY !== "PASTE_YOUR_SERVICE_ACCOUNT_JSON_HERE") {
    credentials = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_KEY);
  } else {
    const client_email = process.env.GA4_CLIENT_EMAIL;
    const private_key = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!client_email || !private_key) {
      throw new Error("Set GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY in .env.local");
    }
    credentials = { type: "service_account", client_email, private_key };
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error("Failed to obtain service account access token");
  return tokenResponse.token;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GA4ReportRow {
  [key: string]: string;
}

export interface GA4ReportResult {
  headers: string[];
  rows: GA4ReportRow[];
  totals?: GA4ReportRow;
  rowCount?: number;
}

export interface GA4ReportRequest {
  propertyId: string;
  startDate: string;
  endDate: string;
  metrics: string[];
  dimensions?: string[];
  limit?: number;
  orderBy?: string;
  dimensionFilters?: { fieldName: string; values?: string[]; contains?: string }[];
  hostnameFilter?: string; // filter to a specific dealership hostname
  accessToken: string;
}

// Builds a GA4 dimensionFilter expression, combining hostnameFilter + preset dimensionFilters with AND logic
function buildDimensionFilter(req: GA4ReportRequest) {
  const filters: object[] = [];

  if (req.hostnameFilter) {
    filters.push({
      filter: {
        fieldName: "hostname",
        stringFilter: { matchType: "EXACT", value: req.hostnameFilter },
      },
    });
  }

  if (req.dimensionFilters?.length) {
    const f = req.dimensionFilters[0];
    filters.push(
      f.contains
        ? { filter: { fieldName: f.fieldName, stringFilter: { matchType: "CONTAINS" as const, value: f.contains } } }
        : { filter: { fieldName: f.fieldName, inListFilter: { values: f.values ?? [] } } }
    );
  }

  if (filters.length === 0) return undefined;
  if (filters.length === 1) return filters[0];
  return { andGroup: { expressions: filters } };
}

// ─── Core report runner ───────────────────────────────────────────────────────
export async function runGA4Report(req: GA4ReportRequest): Promise<GA4ReportResult> {
  const client = new BetaAnalyticsDataClient({
    authClient: {
      getRequestHeaders: async () => ({
        Authorization: `Bearer ${req.accessToken}`,
      }),
    } as never,
  });

  const [response] = await client.runReport({
    property: req.propertyId,
    dateRanges: [{ startDate: req.startDate, endDate: req.endDate }],
    metrics: req.metrics.map((name) => ({ name })),
    dimensions: (req.dimensions ?? []).map((name) => ({ name })),
    limit: req.limit ?? 100,
    orderBys: req.orderBy
      ? [{ metric: { metricName: req.orderBy }, desc: true }]
      : undefined,
    dimensionFilter: buildDimensionFilter(req) as never,
  });

  const dimensionHeaders =
    response.dimensionHeaders?.map((h) => h.name ?? "") ?? [];
  const metricHeaders =
    response.metricHeaders?.map((h) => h.name ?? "") ?? [];
  const headers = [...dimensionHeaders, ...metricHeaders];

  const rows: GA4ReportRow[] = (response.rows ?? []).map((row) => {
    const record: GA4ReportRow = {};
    (row.dimensionValues ?? []).forEach((v, i) => {
      record[dimensionHeaders[i]] = v.value ?? "";
    });
    (row.metricValues ?? []).forEach((v, i) => {
      record[metricHeaders[i]] = v.value ?? "";
    });
    return record;
  });

  const totals: GA4ReportRow = {};
  (response.totals?.[0]?.metricValues ?? []).forEach((v, i) => {
    totals[metricHeaders[i]] = v.value ?? "";
  });

  return { headers, rows, totals, rowCount: response.rowCount ?? 0 };
}

// ─── Cohort Report ────────────────────────────────────────────────────────────
export interface CohortRow {
  cohortLabel: string;    // e.g. "Apr 6"
  cohortStartDate: string; // "yyyy-MM-dd"
  totalUsers: number;
  weeklyUsers: (number | null)[]; // index = week offset; null = future (not yet available)
}

export interface GA4CohortResult {
  cohorts: CohortRow[];
  maxWeeks: number;
}

export async function runCohortReport(props: {
  propertyId: string;
  accessToken: string;
  weeksBack?: number;
  hostnameFilter?: string;
}): Promise<GA4CohortResult> {
  const weeksBack = props.weeksBack ?? 8;

  // Build one cohort per week going back weeksBack weeks
  const cohortDefs = [];
  for (let i = weeksBack; i >= 1; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    cohortDefs.push({
      name: format(weekStart, "yyyy-MM-dd"),
      dimension: "firstSessionDate",
      dateRange: {
        startDate: format(weekStart, "yyyy-MM-dd"),
        endDate: format(weekEnd, "yyyy-MM-dd"),
      },
    });
  }

  // Use REST API directly — BetaAnalyticsDataClient gRPC client doesn't expose runCohortReport
  const body: Record<string, unknown> = {
    cohortSpec: {
      cohorts: cohortDefs,
      cohortsRange: {
        granularity: "WEEKLY",
        startOffset: 0,
        endOffset: weeksBack - 1,
      },
    },
    metrics: [{ name: "cohortActiveUsers" }],
    dimensions: [{ name: "cohort" }, { name: "cohortNthWeek" }],
  };

  if (props.hostnameFilter) {
    body.dimensionFilter = {
      filter: {
        fieldName: "hostname",
        stringFilter: { matchType: "EXACT", value: props.hostnameFilter },
      },
    };
  }

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${props.propertyId}:runCohortReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ?? `Cohort API error ${res.status}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  // Aggregate rows into a map keyed by cohort start date
  const cohortMap = new Map<string, { totalUsers: number; weeks: Map<number, number> }>();
  (data.rows ?? []).forEach((row: { dimensionValues: {value:string}[]; metricValues: {value:string}[] }) => {
    const cohortName = row.dimensionValues?.[0]?.value ?? "";
    const weekOffset = parseInt(row.dimensionValues?.[1]?.value ?? "0", 10);
    const activeUsers = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
    if (!cohortMap.has(cohortName)) {
      cohortMap.set(cohortName, { totalUsers: 0, weeks: new Map() });
    }
    const c = cohortMap.get(cohortName)!;
    c.weeks.set(weekOffset, activeUsers);
    if (weekOffset === 0) c.totalUsers = activeUsers;
  });

  const cohorts: CohortRow[] = Array.from(cohortMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cohortData]) => {
      const weeklyUsers: (number | null)[] = [];
      for (let i = 0; i < weeksBack; i++) {
        weeklyUsers.push(cohortData.weeks.has(i) ? cohortData.weeks.get(i)! : null);
      }
      return {
        cohortLabel: format(new Date(date + "T00:00:00"), "MMM d"),
        cohortStartDate: date,
        totalUsers: cohortData.totalUsers,
        weeklyUsers,
      };
    });

  return { cohorts, maxWeeks: weeksBack };
}
