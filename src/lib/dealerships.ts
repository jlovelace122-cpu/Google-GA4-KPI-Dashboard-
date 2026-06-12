// ─── Dealership Registry ───────────────────────────────────────────────────────
// Populate DEALER_REGISTRY with your real dealerships + competitors.
// Set lat/lng for each to enable radius filtering.
// Set ga4PropertyId for dealerships you have GA4 access to.

export interface DealerRecord {
  id: string;
  name: string;
  brand: string;
  tier: 'small' | 'medium' | 'large';
  city: string;
  state: string;
  lat: number;
  lng: number;
  isOwn?: boolean;         // true = your own dealership (GA4 access available)
  ga4PropertyId?: string;  // ONLY for your own stores — never for competitors

  // ── Publicly available data (scraped / third-party estimates) ──────────────
  website?: string;
  address?: string;
  phone?: string;
  annualUnits?: number;           // approx annual sales (public OEM reports, news)
  inventoryCount?: number;        // live inventory page count (scrapeable)
  newInventoryCount?: number;
  usedInventoryCount?: number;
  googleRating?: number;          // Google Maps rating (public)
  googleReviewCount?: number;     // Google Maps review count (public)
  dealerRaterRating?: number;     // DealerRater.com rating (public)
  dealerRaterReviews?: number;
  carsDotComRating?: number;      // Cars.com rating (public)
  carsDotComReviews?: number;
  estimatedMonthlyVisits?: number; // SimilarWeb / Semrush estimate (public)
  estimatedOrganicKeywords?: number; // Semrush organic keyword count (public)
  avgResponseTimeMinutes?: number;   // publicly claimed / mystery-shopped
  hasOnlineFinancing?: boolean;      // visible on website
  hasInstantCashOffer?: boolean;     // visible on website
  hasChatWidget?: boolean;           // visible on website
  certifications?: string[];         // e.g. ["CarNow", "FordDirect", "Dealer.com"]
}

/** Haversine formula — returns distance in miles */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Returns dealers within radiusMiles of base, sorted by distance (excludes base itself) */
export function getDealersInRadius(
  base: DealerRecord,
  all: DealerRecord[],
  radiusMiles: number,
): (DealerRecord & { distance: number })[] {
  return all
    .filter(d => d.id !== base.id)
    .map(d => ({
      ...d,
      distance: haversineDistance(base.lat, base.lng, d.lat, d.lng),
    }))
    .filter(d => d.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
}

/** All radius options in miles */
export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;
export type RadiusMiles = typeof RADIUS_OPTIONS[number];

export const TIER_LABELS: Record<DealerRecord['tier'], string> = {
  small:  'Small  (<200 units/yr)',
  medium: 'Medium (200–600 units/yr)',
  large:  'Large  (600+ units/yr)',
};

export const TIER_COLORS: Record<DealerRecord['tier'], string> = {
  small:  'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  large:  'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── DEALER REGISTRY ──────────────────────────────────────────────────────────
// ✏️  Replace / extend these with your real dealerships + local competitors.
//
// ⚠️  IMPORTANT — GA4 Data Privacy:
//    ga4PropertyId is ONLY valid for your own stores (isOwn: true).
//    Competitor GA4 data is private and cannot be accessed or shared.
//    All competitor comparison data must come from PUBLIC sources:
//      • Google Maps ratings/review count (scrapeable)
//      • Inventory counts from their public website
//      • SimilarWeb / Semrush estimated traffic
//      • DealerRater / Cars.com public ratings
//      • Annual sales from OEM reports, news articles, NADA data
// ─────────────────────────────────────────────────────────────────────────────
export const DEALER_REGISTRY: DealerRecord[] = [
  // ── YOUR DEALERSHIPS (GA4 access available) ─────────────────────────────────
  {
    id: 'own-main',
    name: 'My Auto Group – Main',
    brand: 'Multi-Brand',
    tier: 'large',
    city: 'Tampa',
    state: 'FL',
    lat: 27.9506,
    lng: -82.4572,
    isOwn: true,
    ga4PropertyId: 'properties/496741172',
    annualUnits: 800,
    address: '1234 Main St, Tampa, FL 33601',
    website: 'myautogroup.com',
  },
  {
    id: 'own-north',
    name: 'My Auto Group – North',
    brand: 'Multi-Brand',
    tier: 'medium',
    city: 'Wesley Chapel',
    state: 'FL',
    lat: 28.1806,
    lng: -82.3568,
    isOwn: true,
    annualUnits: 400,
    address: '5678 North Blvd, Wesley Chapel, FL 33543',
    website: 'myautogroup.com/north',
  },

  // ── COMPETITOR DEALERSHIPS (public data only — no GA4 access) ───────────────
  // All fields below are sourced from public information only.
  {
    id: 'comp-1',
    name: 'AutoNation Ford Tampa',
    brand: 'Ford',
    tier: 'large',
    city: 'Tampa',
    state: 'FL',
    lat: 27.9220,
    lng: -82.4700,
    website: 'autonation.com',
    annualUnits: 1200,
    inventoryCount: 380,
    newInventoryCount: 210,
    usedInventoryCount: 170,
    googleRating: 4.2,
    googleReviewCount: 2840,
    dealerRaterRating: 4.5,
    dealerRaterReviews: 1120,
    estimatedMonthlyVisits: 42000,
    estimatedOrganicKeywords: 3800,
    hasOnlineFinancing: true,
    hasInstantCashOffer: true,
    hasChatWidget: true,
  },
  {
    id: 'comp-2',
    name: 'Brandon Honda',
    brand: 'Honda',
    tier: 'medium',
    city: 'Brandon',
    state: 'FL',
    lat: 27.9381,
    lng: -82.3029,
    website: 'brandonhonda.com',
    annualUnits: 550,
    inventoryCount: 220,
    newInventoryCount: 130,
    usedInventoryCount: 90,
    googleRating: 4.4,
    googleReviewCount: 1950,
    dealerRaterRating: 4.6,
    dealerRaterReviews: 870,
    estimatedMonthlyVisits: 28000,
    estimatedOrganicKeywords: 2100,
    hasOnlineFinancing: true,
    hasInstantCashOffer: false,
    hasChatWidget: true,
  },
  {
    id: 'comp-3',
    name: 'Ferman Chevrolet',
    brand: 'Chevrolet',
    tier: 'large',
    city: 'Tampa',
    state: 'FL',
    lat: 28.0140,
    lng: -82.4937,
    website: 'ferman.com',
    annualUnits: 900,
    inventoryCount: 310,
    newInventoryCount: 180,
    usedInventoryCount: 130,
    googleRating: 4.1,
    googleReviewCount: 2210,
    dealerRaterRating: 4.3,
    dealerRaterReviews: 640,
    estimatedMonthlyVisits: 31000,
    estimatedOrganicKeywords: 2700,
    hasOnlineFinancing: true,
    hasInstantCashOffer: true,
    hasChatWidget: false,
  },
  {
    id: 'comp-4',
    name: 'Germain Toyota of Tampa',
    brand: 'Toyota',
    tier: 'large',
    city: 'Tampa',
    state: 'FL',
    lat: 27.9638,
    lng: -82.5250,
    website: 'germaintoyota.com',
    annualUnits: 1100,
    inventoryCount: 420,
    newInventoryCount: 260,
    usedInventoryCount: 160,
    googleRating: 4.5,
    googleReviewCount: 3100,
    dealerRaterRating: 4.7,
    dealerRaterReviews: 1400,
    estimatedMonthlyVisits: 55000,
    estimatedOrganicKeywords: 5200,
    hasOnlineFinancing: true,
    hasInstantCashOffer: true,
    hasChatWidget: true,
  },
  {
    id: 'comp-5',
    name: 'Sun Toyota',
    brand: 'Toyota',
    tier: 'large',
    city: 'Holiday',
    state: 'FL',
    lat: 28.1850,
    lng: -82.7408,
    website: 'suntoyota.com',
    annualUnits: 700,
    inventoryCount: 290,
    newInventoryCount: 160,
    usedInventoryCount: 130,
    googleRating: 4.3,
    googleReviewCount: 1820,
    dealerRaterRating: 4.4,
    dealerRaterReviews: 760,
    estimatedMonthlyVisits: 34000,
    estimatedOrganicKeywords: 2900,
    hasOnlineFinancing: true,
    hasInstantCashOffer: false,
    hasChatWidget: true,
  },
  {
    id: 'comp-6',
    name: 'Lakeland Automall',
    brand: 'Multi-Brand',
    tier: 'medium',
    city: 'Lakeland',
    state: 'FL',
    lat: 28.0395,
    lng: -81.9498,
    annualUnits: 480,
    inventoryCount: 195,
    newInventoryCount: 100,
    usedInventoryCount: 95,
    googleRating: 4.0,
    googleReviewCount: 980,
    estimatedMonthlyVisits: 18000,
    hasOnlineFinancing: false,
    hasInstantCashOffer: false,
    hasChatWidget: false,
  },
  {
    id: 'comp-7',
    name: 'Crown Automotive',
    brand: 'Multi-Brand',
    tier: 'large',
    city: 'St. Petersburg',
    state: 'FL',
    lat: 27.7731,
    lng: -82.6400,
    website: 'crownautomotive.com',
    annualUnits: 950,
    inventoryCount: 350,
    newInventoryCount: 200,
    usedInventoryCount: 150,
    googleRating: 4.3,
    googleReviewCount: 2560,
    dealerRaterRating: 4.5,
    dealerRaterReviews: 1050,
    estimatedMonthlyVisits: 39000,
    estimatedOrganicKeywords: 3400,
    hasOnlineFinancing: true,
    hasInstantCashOffer: true,
    hasChatWidget: true,
  },
  {
    id: 'comp-8',
    name: 'Courtesy Ford',
    brand: 'Ford',
    tier: 'medium',
    city: 'Brandon',
    state: 'FL',
    lat: 27.9412,
    lng: -82.3150,
    annualUnits: 320,
    inventoryCount: 145,
    newInventoryCount: 80,
    usedInventoryCount: 65,
    googleRating: 3.9,
    googleReviewCount: 740,
    estimatedMonthlyVisits: 14000,
    hasOnlineFinancing: true,
    hasInstantCashOffer: false,
    hasChatWidget: false,
  },
  {
    id: 'comp-9',
    name: 'Clearwater Toyota',
    brand: 'Toyota',
    tier: 'medium',
    city: 'Clearwater',
    state: 'FL',
    lat: 27.9659,
    lng: -82.8001,
    annualUnits: 420,
    inventoryCount: 180,
    newInventoryCount: 105,
    usedInventoryCount: 75,
    googleRating: 4.2,
    googleReviewCount: 1340,
    dealerRaterRating: 4.4,
    dealerRaterReviews: 520,
    estimatedMonthlyVisits: 22000,
    estimatedOrganicKeywords: 1800,
    hasOnlineFinancing: true,
    hasInstantCashOffer: false,
    hasChatWidget: true,
  },
];
