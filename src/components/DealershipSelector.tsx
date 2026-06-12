"use client";

import { ChevronDown, Store } from "lucide-react";

export interface DealerOption {
  hostname: string; // e.g. "johnsonauto.com" — used as GA4 hostname filter
  label: string;    // e.g. "Johnson Auto Group"
}

interface DealershipSelectorProps {
  dealers: DealerOption[];
  selectedHostname: string; // "" = All Dealerships
  onChange: (hostname: string) => void;
  dark?: boolean;
}

export default function DealershipSelector({
  dealers,
  selectedHostname,
  onChange,
  dark = false,
}: DealershipSelectorProps) {
  if (dealers.length === 0) return null;

  return (
    <div className="relative inline-flex items-center gap-2">
      <Store className={`w-4 h-4 shrink-0 ${dark ? "text-slate-400" : "text-slate-400"}`} />
      <div className="relative">
        <select
          value={selectedHostname}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none border rounded-xl px-3 py-2 pr-8 text-sm
                      focus:outline-none cursor-pointer transition-colors ${
            dark
              ? "bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-400 focus:border-amber-500"
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 focus:border-blue-500"
          }`}
        >
          <option value="">All Dealerships</option>
          {dealers.map((d) => (
            <option key={d.hostname} value={d.hostname}>
              {d.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>
      {selectedHostname && (
        <span className="text-xs text-slate-400 font-mono hidden lg:block">{selectedHostname}</span>
      )}
    </div>
  );
}
