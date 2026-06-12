# GA4 KPI Dashboard – CarNow

Executive analytics dashboard powered by Google Analytics 4, built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS.

## Features

- **KPI Preset Buttons** — One-click reports grouped by category: Acquisition, Engagement, Monetization, Retention, Technical
- **Date Range Picker** — Last 7/14/28/30/90 days, This Month, Last Month, or fully custom date range
- **Property Selector** — Switch between multiple GA4 properties instantly
- **Live Charts** — Line charts for time-series data, horizontal bar charts for categorical breakdowns
- **Auto-refresh** — Refresh button re-fetches the current report on demand
- **Secure Server-Side API** — GA4 credentials never exposed to the browser

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure credentials
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

| Variable | Description |
|---|---|
| `GA4_PROPERTY_ID` | e.g. `properties/123456789` |
| `GA4_CLIENT_EMAIL` | Service account email |
| `GA4_PRIVATE_KEY` | Private key from JSON key file |
| `NEXT_PUBLIC_GA4_PROPERTY_IDS` | Comma-separated property IDs |
| `NEXT_PUBLIC_GA4_PROPERTY_LABELS` | Comma-separated display names |

### 3. Google Cloud / GA4 Setup
1. **Google Cloud Console** → IAM & Admin → Service Accounts → Create service account → Download JSON key
2. **GA4 Admin** → Property Access Management → Add service account email with **Viewer** role

### 4. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/ga4/report/route.ts   # Server-side GA4 Data API endpoint
│   ├── layout.tsx                 # Root layout (dark theme)
│   ├── page.tsx                   # Main dashboard page
│   └── globals.css
├── components/
│   ├── KpiPresetButtons.tsx       # Category-grouped KPI preset buttons
│   ├── DateRangePicker.tsx        # Date range selector with presets + custom
│   ├── PropertySelector.tsx       # GA4 property dropdown
│   └── ReportCard.tsx             # Chart card (line / bar / table)
└── lib/
    ├── ga4.ts                     # GA4 Data API client and runReport helper
    ├── kpiPresets.ts              # All KPI preset definitions
    └── dateRanges.ts              # Date range preset helpers
```

## Adding KPI Presets

Add an entry to the `KPI_PRESETS` array in `src/lib/kpiPresets.ts`. All GA4 metric and dimension names are supported. See the [GA4 Dimensions & Metrics Explorer](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema).

## Deployment

Deploy to Vercel and add environment variables in the Vercel dashboard. GA4 service account credentials stay server-side only.
