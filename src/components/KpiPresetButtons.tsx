"use client";

import React from "react";
import { KpiPreset, CATEGORY_LABELS } from "@/lib/kpiPresets";
import clsx from "clsx";
import {
  Users, Activity, Share2, RefreshCw, TrendingUp, Eye, FileText, Zap,
  DollarSign, Target, Heart, Monitor, Globe, Grid3X3, PhoneCall,
  MousePointerClick, Car, Truck, ClipboardCheck, Wrench, BadgeDollarSign,
  GitMerge, Gauge, ChevronDown, X as XIcon,
} from "lucide-react";

// Map icon string names to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  Users, Activity, Share2, RefreshCw, TrendingUp, Eye, FileText, Zap,
  DollarSign, Target, Heart, Monitor, Globe, Grid3x3: Grid3X3, PhoneCall,
  MousePointerClick, Car, Truck, ClipboardCheck, Wrench, BadgeDollarSign,
  GitMerge, Gauge,
};

const COLOR_MAP: Record<string, string> = {
  blue:   "border-blue-200 hover:border-blue-400 hover:bg-blue-50 data-[active=true]:border-blue-500 data-[active=true]:bg-blue-50",
  indigo: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 data-[active=true]:border-indigo-500 data-[active=true]:bg-indigo-50",
  violet: "border-violet-200 hover:border-violet-400 hover:bg-violet-50 data-[active=true]:border-violet-500 data-[active=true]:bg-violet-50",
  purple: "border-purple-200 hover:border-purple-400 hover:bg-purple-50 data-[active=true]:border-purple-500 data-[active=true]:bg-purple-50",
  emerald:"border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 data-[active=true]:border-emerald-500 data-[active=true]:bg-emerald-50",
  teal:   "border-teal-200 hover:border-teal-400 hover:bg-teal-50 data-[active=true]:border-teal-500 data-[active=true]:bg-teal-50",
  cyan:   "border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50 data-[active=true]:border-cyan-500 data-[active=true]:bg-cyan-50",
  sky:    "border-sky-200 hover:border-sky-400 hover:bg-sky-50 data-[active=true]:border-sky-500 data-[active=true]:bg-sky-50",
  green:  "border-green-200 hover:border-green-400 hover:bg-green-50 data-[active=true]:border-green-500 data-[active=true]:bg-green-50",
  lime:   "border-lime-200 hover:border-lime-400 hover:bg-lime-50 data-[active=true]:border-lime-500 data-[active=true]:bg-lime-50",
  rose:   "border-rose-200 hover:border-rose-400 hover:bg-rose-50 data-[active=true]:border-rose-500 data-[active=true]:bg-rose-50",
  orange: "border-orange-200 hover:border-orange-400 hover:bg-orange-50 data-[active=true]:border-orange-500 data-[active=true]:bg-orange-50",
  amber:  "border-amber-200 hover:border-amber-400 hover:bg-amber-50 data-[active=true]:border-amber-500 data-[active=true]:bg-amber-50",
};

const CATEGORY_PILL: Record<string, string> = {
  acquisition: "bg-blue-100 text-blue-700 border border-blue-200",
  engagement:  "bg-violet-100 text-violet-700 border border-violet-200",
  monetization:"bg-amber-100 text-amber-700 border border-amber-200",
  retention:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
  technical:   "bg-slate-100 text-slate-600 border border-slate-200",
  dealership:  "bg-orange-100 text-orange-700 border border-orange-200",
};

const ACTIVE_BG: Record<string, string> = {
  blue:    "!bg-blue-500 !text-white !border-blue-500",
  indigo:  "!bg-indigo-500 !text-white !border-indigo-500",
  violet:  "!bg-violet-500 !text-white !border-violet-500",
  purple:  "!bg-purple-500 !text-white !border-purple-500",
  emerald: "!bg-emerald-500 !text-white !border-emerald-500",
  teal:    "!bg-teal-500 !text-white !border-teal-500",
  cyan:    "!bg-cyan-500 !text-white !border-cyan-500",
  sky:     "!bg-sky-500 !text-white !border-sky-500",
  green:   "!bg-green-500 !text-white !border-green-500",
  lime:    "!bg-lime-500 !text-white !border-lime-500",
  rose:    "!bg-rose-500 !text-white !border-rose-500",
  orange:  "!bg-orange-500 !text-white !border-orange-500",
  amber:   "!bg-amber-500 !text-white !border-amber-500",
};

const ACTIVE_ICON: Record<string, string> = {
  blue: "text-white", indigo: "text-white", violet: "text-white", purple: "text-white",
  emerald: "text-white", teal: "text-white", cyan: "text-white", sky: "text-white",
  green: "text-white", lime: "text-white", rose: "text-white", orange: "text-white", amber: "text-white",
};

const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-blue-500", indigo: "text-indigo-500", violet: "text-violet-500",
  purple: "text-purple-500", emerald: "text-emerald-500", teal: "text-teal-500",
  cyan: "text-cyan-500", sky: "text-sky-500", green: "text-green-500",
  lime: "text-lime-500", rose: "text-rose-500", orange: "text-orange-500",
  amber: "text-amber-500",
};

interface KpiPresetButtonsProps {
  presets: KpiPreset[];
  openPresetIds: Set<string>;
  onSelect: (preset: KpiPreset) => void;
  onClose?: (presetId: string) => void;
  dark?: boolean;
}

export default function KpiPresetButtons({
  presets,
  openPresetIds,
  onSelect,
  onClose,
  dark = false,
}: KpiPresetButtonsProps) {
  // Group by category
  const grouped = presets.reduce<Record<string, KpiPreset[]>>((acc, p) => {
    acc[p.category] = acc[p.category] ?? [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const categories = Object.keys(grouped) as KpiPreset["category"][];

  // Find categories that have at least one open preset
  const openCategories_auto = new Set<string>(
    Array.from(openPresetIds)
      .map(id => presets.find(p => p.id === id)?.category)
      .filter((c): c is NonNullable<typeof c> => c != null) as string[]
  );

  const [openCategories, setOpenCategories] = React.useState<Set<string>>(
    () => new Set([...openCategories_auto])
  );

  // Auto-expand categories that gain an open preset
  React.useEffect(() => {
    if (openCategories_auto.size > 0) {
      setOpenCategories(prev => new Set([...prev, ...openCategories_auto]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPresetIds]);

  const toggle = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const CATEGORY_ACCENT: Record<string, string> = {
    acquisition:  dark ? "text-blue-400"   : "text-blue-600",
    engagement:   dark ? "text-violet-400" : "text-violet-600",
    monetization: dark ? "text-amber-400"  : "text-amber-600",
    retention:    dark ? "text-emerald-400": "text-emerald-600",
    technical:    dark ? "text-slate-400"  : "text-slate-500",
    dealership:   dark ? "text-orange-400" : "text-orange-600",
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const isOpen = openCategories.has(category);
        const hasActive = grouped[category].some(p => openPresetIds.has(p.id));
        return (
          <div key={category} className={clsx(
            "rounded-xl overflow-hidden border transition-colors",
            dark
              ? isOpen ? "border-slate-700 bg-slate-800/40" : "border-slate-800 bg-transparent"
              : isOpen ? "border-slate-200 bg-white"        : "border-transparent bg-transparent"
          )}>
            {/* Category header — clickable */}
            <button
              onClick={() => toggle(category)}
              className={clsx(
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                dark
                  ? "hover:bg-slate-700/50"
                  : "hover:bg-slate-50"
              )}
            >
              {hasActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
              <span className={clsx(
                "flex-1 text-xs font-semibold uppercase tracking-wider",
                hasActive
                  ? dark ? "text-white" : "text-slate-900"
                  : dark ? "text-slate-400" : "text-slate-500",
                CATEGORY_ACCENT[category]
              )}>
                {CATEGORY_LABELS[category]}
              </span>
              <ChevronDown className={clsx(
                "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                isOpen ? "rotate-180" : "",
                dark ? "text-slate-600" : "text-slate-400"
              )} />
            </button>

            {/* Preset list — shown when open */}
            {isOpen && (
              <div className={clsx("px-2 pb-2 flex flex-col gap-0.5")}>
                {grouped[category].map((preset) => {
                  const Icon = ICON_MAP[preset.icon] ?? Activity;
                  const isOpen = openPresetIds.has(preset.id);
                  return (
                    <div key={preset.id} className="relative group/item">
                      <button
                        onClick={() => onSelect(preset)}
                        title={preset.description}
                        className={clsx(
                          "w-full flex items-center gap-2.5 px-3 py-2 pr-8 rounded-lg text-sm font-medium transition-all duration-150",
                          isOpen
                            ? dark
                              ? "bg-blue-600 text-white"
                              : (ACTIVE_BG[preset.color] ?? "bg-blue-500 text-white")
                            : dark
                              ? "text-slate-300 hover:bg-slate-700/70 hover:text-white"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Icon className={clsx(
                          "w-4 h-4 shrink-0",
                          isOpen ? "text-white" : ICON_COLOR_MAP[preset.color]
                        )} />
                        <span className="flex-1 text-left">{preset.label}</span>
                        {isOpen && (
                          <span className={clsx(
                            "text-[9px] font-bold px-1 py-0.5 rounded shrink-0",
                            dark ? "bg-white/20 text-white" : "bg-white/40 text-white"
                          )}>OPEN</span>
                        )}
                      </button>
                      {isOpen && onClose && (
                        <button
                          onClick={e => { e.stopPropagation(); onClose(preset.id); }}
                          title="Close report"
                          className={clsx(
                            "absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center transition-colors z-10",
                            dark
                              ? "text-white/60 hover:text-white hover:bg-white/20"
                              : "text-white/70 hover:text-white hover:bg-white/30"
                          )}
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
