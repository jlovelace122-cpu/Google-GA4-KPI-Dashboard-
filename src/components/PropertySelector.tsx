"use client";

import { ChevronDown, Building2 } from "lucide-react";

export interface PropertyOption {
  id: string;   // "properties/XXXXXXXXX"
  label: string;
}

interface PropertySelectorProps {
  properties: PropertyOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

export default function PropertySelector({ properties, selectedId, onChange }: PropertySelectorProps) {
  const selected = properties.find((p) => p.id === selectedId);

  return (
    <div className="relative inline-flex items-center gap-2">
      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="relative">
        <select
          value={selectedId}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm text-slate-700
                     focus:outline-none focus:border-blue-500 cursor-pointer hover:border-slate-400 transition-colors"
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>
      {selected && (
        <span className="text-xs text-slate-400 font-mono hidden lg:block">{selected.id}</span>
      )}
    </div>
  );
}
