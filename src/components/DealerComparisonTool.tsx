"use client";

import React, { useState } from "react";
import {
  X, MapPin, Search, CheckCircle2, Circle, BarChart3,
  ChevronDown, Building2, Star, Globe, Car, Wifi,
  MessageSquare, CreditCard, DollarSign, TrendingUp, Info,
} from "lucide-react";
import {
  DEALER_REGISTRY, DealerRecord, RADIUS_OPTIONS, RadiusMiles,
  TIER_COLORS, getDealersInRadius,
} from "@/lib/dealerships";

interface Props {
  onClose: () => void;
}

type RowDef = {
  key: string;
  label: string;
  icon: React.ReactNode;
  note?: string;
  format: (d: DealerRecord) => React.ReactNode;
};

const REVIEW_ROWS: RowDef[] = [
  {
    key: "googleRating", label: "Google Rating",
    icon: <Star className="w-3.5 h-3.5 text-yellow-500" />,
    note: "Source: Google Maps (public)",
    format: (d) =>
      d.googleRating != null ? (
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="text-yellow-500">★</span> {d.googleRating.toFixed(1)}
          {d.googleReviewCount != null && (
            <span className="text-[10px] text-slate-400 font-normal">({d.googleReviewCount.toLocaleString()})</span>
          )}
        </span>
      ) : <span className="text-slate-300 text-xs">—</span>,
  },
  {
    key: "dealerRaterRating", label: "DealerRater Rating",
    icon: <Star className="w-3.5 h-3.5 text-orange-400" />,
    note: "Source: DealerRater.com (public)",
    format: (d) =>
      d.dealerRaterRating != null ? (
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="text-orange-400">★</span> {d.dealerRaterRating.toFixed(1)}
          {d.dealerRaterReviews != null && (
            <span className="text-[10px] text-slate-400 font-normal">({d.dealerRaterReviews.toLocaleString()})</span>
          )}
        </span>
      ) : <span className="text-slate-300 text-xs">—</span>,
  },
  {
    key: "carsDotComRating", label: "Cars.com Rating",
    icon: <Car className="w-3.5 h-3.5 text-blue-500" />,
    note: "Source: Cars.com (public)",
    format: (d) =>
      d.carsDotComRating != null ? (
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="text-blue-400">★</span> {d.carsDotComRating.toFixed(1)}
          {d.carsDotComReviews != null && (
            <span className="text-[10px] text-slate-400 font-normal">({d.carsDotComReviews.toLocaleString()})</span>
          )}
        </span>
      ) : <span className="text-slate-300 text-xs">—</span>,
  },
];

const INVENTORY_ROWS: RowDef[] = [
  {
    key: "inventoryCount", label: "Total Inventory",
    icon: <Car className="w-3.5 h-3.5 text-slate-500" />,
    note: "Source: Dealer website inventory page (public)",
    format: (d) => d.inventoryCount != null
      ? <span className="font-semibold text-slate-700">{d.inventoryCount.toLocaleString()} vehicles</span>
      : <span className="text-slate-300 text-xs">—</span>,
  },
  {
    key: "newInventoryCount", label: "New Inventory",
    icon: <Car className="w-3.5 h-3.5 text-green-500" />,
    note: "Source: Dealer website (public)",
    format: (d) => d.newInventoryCount != null
      ? <span className="font-semibold text-slate-700">{d.newInventoryCount.toLocaleString()} new</span>
      : <span className="text-slate-300 text-xs">—</span>,
  },
  {
    key: "usedInventoryCount", label: "Used Inventory",
    icon: <Car className="w-3.5 h-3.5 text-amber-500" />,
    note: "Source: Dealer website (public)",
    format: (d) => d.usedInventoryCount != null
      ? <span className="font-semibold text-slate-700">{d.usedInventoryCount.toLocaleString()} used</span>
      : <span className="text-slate-300 text-xs">—</span>,
  },
  {
    key: "annualUnits", label: "Annual Sales (est.)",
    icon: <Building2 className="w-3.5 h-3.5 text-slate-500" />,
    note: "Source: OEM reports, news, NADA estimates (public)",
    format: (d) => d.annualUnits != null
      ? <span className="font-semibold text-slate-700">~{d.annualUnits.toLocaleString()} units/yr</span>
      : <span className="text-slate-300 text-xs">—</span>,
  },
];

const DIGITAL_ROWS: RowDef[] = [
  {
    key: "estimatedMonthlyVisits", label: "Est. Monthly Website Visits",
    icon: <Globe className="w-3.5 h-3.5 text-indigo-500" />,
    note: "Source: SimilarWeb / Semrush estimates (public)",
    format: (d) => d.estimatedMonthlyVisits != null
      ? <span className="font-semibold text-slate-700">{(d.estimatedMonthlyVisits / 1000).toFixed(0)}K / mo</span>
      : <span className="text-slate-300 text-xs">—</span>,
  },
  {
    key: "estimatedOrganicKeywords", label: "Organic Keywords (SEO)",
    icon: <TrendingUp className="w-3.5 h-3.5 text-green-500" />,
    note: "Source: Semrush organic keyword report (public)",
    format: (d) => d.estimatedOrganicKeywords != null
      ? <span className="font-semibold text-slate-700">{d.estimatedOrganicKeywords.toLocaleString()} keywords</span>
      : <span className="text-slate-300 text-xs">—</span>,
  },
  {
    key: "hasOnlineFinancing", label: "Online Financing",
    icon: <CreditCard className="w-3.5 h-3.5 text-blue-500" />,
    note: "Source: Dealer website inspection (public)",
    format: (d) => d.hasOnlineFinancing == null
      ? <span className="text-slate-300 text-xs">—</span>
      : d.hasOnlineFinancing
        ? <span className="flex items-center gap-1 text-green-600 font-medium text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Yes</span>
        : <span className="text-slate-400 text-xs">No</span>,
  },
  {
    key: "hasInstantCashOffer", label: "Instant Cash Offer",
    icon: <DollarSign className="w-3.5 h-3.5 text-amber-500" />,
    note: "Source: Dealer website inspection (public)",
    format: (d) => d.hasInstantCashOffer == null
      ? <span className="text-slate-300 text-xs">—</span>
      : d.hasInstantCashOffer
        ? <span className="flex items-center gap-1 text-green-600 font-medium text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Yes</span>
        : <span className="text-slate-400 text-xs">No</span>,
  },
  {
    key: "hasChatWidget", label: "Live Chat Widget",
    icon: <MessageSquare className="w-3.5 h-3.5 text-violet-500" />,
    note: "Source: Dealer website inspection (public)",
    format: (d) => d.hasChatWidget == null
      ? <span className="text-slate-300 text-xs">—</span>
      : d.hasChatWidget
        ? <span className="flex items-center gap-1 text-green-600 font-medium text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Yes</span>
        : <span className="text-slate-400 text-xs">No</span>,
  },
];

const SECTIONS = [
  { id: "reviews",   label: "Customer Reviews",  icon: <Star className="w-4 h-4" />,  rows: REVIEW_ROWS },
  { id: "inventory", label: "Inventory & Sales",  icon: <Car className="w-4 h-4" />,   rows: INVENTORY_ROWS },
  { id: "digital",   label: "Digital Presence",   icon: <Wifi className="w-4 h-4" />,  rows: DIGITAL_ROWS },
];

export default function DealerComparisonTool({ onClose }: Props) {
  const ownDealers = DEALER_REGISTRY.filter((d) => d.isOwn);
  const [baseDealerId, setBaseDealerId]     = useState<string>(ownDealers[0]?.id ?? DEALER_REGISTRY[0]?.id ?? "");
  const [radius, setRadius]                 = useState<RadiusMiles>(25);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery]       = useState("");
  const [tierFilter, setTierFilter]         = useState<DealerRecord["tier"] | "all">("all");
  const [showComparison, setShowComparison] = useState(false);

  const baseDealer    = DEALER_REGISTRY.find((d) => d.id === baseDealerId) ?? DEALER_REGISTRY[0];
  const nearbyDealers = baseDealer ? getDealersInRadius(baseDealer, DEALER_REGISTRY, radius) : [];

  const filteredNearby = nearbyDealers.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (!q || d.name.toLowerCase().includes(q) || d.city.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q)) &&
      (tierFilter === "all" || d.tier === tierFilter)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
    setShowComparison(false);
  };

  const comparisonDealers: (DealerRecord & { distance?: number })[] = showComparison
    ? [{ ...baseDealer, distance: 0 }, ...nearbyDealers.filter((d) => selectedIds.has(d.id))]
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-6 flex flex-col">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Dealership Comparison Tool</h2>
            <p className="text-xs text-slate-500">Compare competitors using publicly available data</p>
          </div>
          <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 max-w-md">
            <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700 leading-snug">
              <strong>Public data only.</strong> Competitor GA4 analytics are private and cannot be shared per Google ToS.
              All figures here come from Google Maps, DealerRater, Cars.com, SimilarWeb/Semrush, and public dealer websites.
            </p>
          </div>
          <div className="flex-1" />
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0">

          {/* LEFT PANEL */}
          <div className="lg:w-96 lg:min-w-96 border-r border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-100 space-y-4">

              {/* Base dealer */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Your Dealership (Base)
                </label>
                <div className="relative">
                  <select
                    value={baseDealerId}
                    onChange={(e) => { setBaseDealerId(e.target.value); setSelectedIds(new Set()); setShowComparison(false); }}
                    className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(ownDealers.length > 0 ? ownDealers : DEALER_REGISTRY.slice(0, 3)).map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Radius */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Search Radius
                </label>
                <div className="flex gap-2">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRadius(r); setSelectedIds(new Set()); setShowComparison(false); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        radius === r ? "bg-blue-600 border-blue-600 text-white shadow" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                      }`}
                    >
                      {r}mi
                    </button>
                  ))}
                </div>
              </div>

              {/* Search + Tier */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text" placeholder="Search dealers…" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                  />
                </div>
                <div className="relative">
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as DealerRecord["tier"] | "all")}
                    className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All sizes</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Dealer list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {filteredNearby.length} dealers within {radius} miles
                </span>
                {selectedIds.size > 0 && (
                  <span className="text-xs text-blue-600 font-semibold">{selectedIds.size}/4 selected</span>
                )}
              </div>
              {filteredNearby.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No dealers within {radius} miles.</p>
                </div>
              ) : (
                filteredNearby.map((dealer) => {
                  const isSelected = selectedIds.has(dealer.id);
                  const canSelect  = isSelected || selectedIds.size < 4;
                  const hasData    = dealer.googleRating != null || dealer.inventoryCount != null;
                  return (
                    <button
                      key={dealer.id}
                      onClick={() => canSelect && toggleSelect(dealer.id)}
                      disabled={!canSelect}
                      className={`w-full text-left rounded-xl border p-3 transition-all ${
                        isSelected ? "bg-blue-50 border-blue-400 shadow-sm"
                          : canSelect ? "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                          : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">
                          {isSelected
                            ? <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            : <Circle className="w-4 h-4 text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-semibold text-slate-800 truncate">{dealer.name}</span>
                            {hasData && (
                              <span className="shrink-0 text-[9px] font-bold bg-teal-100 text-teal-700 border border-teal-200 px-1 rounded">DATA</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${TIER_COLORS[dealer.tier]}`}>
                              {dealer.tier}
                            </span>
                            <span className="text-[10px] text-slate-500">{dealer.brand}</span>
                            <span className="text-[10px] text-slate-500">{dealer.city}, {dealer.state}</span>
                          </div>
                          {dealer.googleRating != null && (
                            <div className="text-[10px] text-amber-600 mt-0.5 font-medium">
                              ★ {dealer.googleRating.toFixed(1)}
                              {dealer.googleReviewCount ? ` · ${dealer.googleReviewCount.toLocaleString()} reviews` : ""}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold text-indigo-600">{dealer.distance.toFixed(1)} mi</span>
                          {dealer.annualUnits && (
                            <div className="text-[10px] text-slate-400">~{dealer.annualUnits.toLocaleString()} units/yr</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => { if (selectedIds.size > 0) setShowComparison(true); }}
                disabled={selectedIds.size === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Run Comparison ({selectedIds.size} selected)
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Select up to 4 competitors · DATA badge = public data populated
              </p>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 overflow-auto p-6">
            {!showComparison ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center mb-4">
                  <BarChart3 className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-slate-600 font-semibold text-base mb-2">No comparison yet</h3>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                  Select competitors from the left panel and click <strong>Run Comparison</strong>.
                </p>
                <p className="text-slate-400 text-xs mt-3 max-w-sm leading-relaxed">
                  All competitor data comes from publicly available sources.
                  Competitor GA4 analytics are private and cannot be accessed or shared per Google ToS.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Comparison Results</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Base: {baseDealer?.name} · Radius: {radius} miles
                    </p>
                  </div>
                  <button
                    onClick={() => setShowComparison(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    Edit Selection
                  </button>
                </div>

                {SECTIONS.map((section) => (
                  <div key={section.id} className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-slate-400">{section.icon}</span>
                      <h4 className="text-sm font-bold text-slate-700">{section.label}</h4>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider py-3 px-4 w-56 border-b border-slate-200">
                              Metric
                            </th>
                            {comparisonDealers.map((d) => (
                              <th
                                key={d.id}
                                className={`text-left py-3 px-4 border-b border-slate-200 min-w-[160px] ${d.isOwn ? "bg-blue-50" : ""}`}
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  {d.isOwn && (
                                    <span className="text-[9px] font-bold bg-blue-500 text-white px-1 py-0.5 rounded">YOU</span>
                                  )}
                                  <span className="text-xs font-bold text-slate-800">{d.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">{d.city}, {d.state}</div>
                                {(d.distance ?? 0) > 0 && (
                                  <div className="text-[10px] font-semibold text-indigo-500">
                                    {(d.distance ?? 0).toFixed(1)} mi away
                                  </div>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((row, rowIdx) => (
                            <tr key={row.key} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                              <td className="py-3 px-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  {row.icon}
                                  <div>
                                    <div className="text-xs font-medium text-slate-600">{row.label}</div>
                                    {row.note && (
                                      <div className="text-[9px] text-slate-400 italic">{row.note}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {comparisonDealers.map((d) => (
                                <td
                                  key={d.id}
                                  className={`py-3 px-4 border-b border-slate-100 ${d.isOwn ? "bg-blue-50/50" : ""}`}
                                >
                                  {row.format(d)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2">
                  <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    All competitor data is derived from <strong>publicly available sources only</strong>.
                    GA4 / website analytics are proprietary to each dealership and cannot be shared across
                    organizations per Google ToS. To refresh figures, edit{" "}
                    <code className="bg-slate-100 px-1 rounded">src/lib/dealerships.ts</code> with current
                    data from Google Maps, DealerRater, Semrush, or your own market research.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
