"use client";

import { useState } from "react";
import { DATE_RANGE_PRESETS, DateRange, DateRangePreset } from "@/lib/dateRanges";
import clsx from "clsx";
import { CalendarDays, ChevronDown } from "lucide-react";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  dark?: boolean;
}

export default function DateRangePicker({ value, onChange, dark = false }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const isCustom = value.preset === 'custom';

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          "w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
          dark
            ? "bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500"
            : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
        )}
      >
        <CalendarDays className={clsx("w-3.5 h-3.5 shrink-0", dark ? "text-blue-400" : "text-blue-500")} />
        <span className="flex-1 text-left truncate">{value.label}</span>
        <ChevronDown className={clsx("w-3.5 h-3.5 shrink-0 transition-transform", open && "rotate-180", dark ? "text-slate-500" : "text-slate-400")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={clsx(
          "absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl z-50 overflow-hidden",
          dark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
        )}>
          {DATE_RANGE_PRESETS.map((preset) => (
            <button
              key={preset.preset}
              onClick={() => { onChange(preset); setOpen(false); }}
              className={clsx(
                "w-full text-left px-4 py-2.5 text-sm transition-colors",
                value.preset === preset.preset
                  ? dark
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-blue-50 text-blue-700 font-medium"
                  : dark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {preset.label}
            </button>
          ))}
          {/* Custom divider */}
          <div className={clsx("border-t", dark ? "border-slate-700" : "border-slate-100")} />
          <div className="px-3 py-2.5 flex flex-col gap-1.5">
            <span className={clsx("text-[10px] font-bold uppercase tracking-wider", dark ? "text-slate-500" : "text-slate-400")}>Custom range</span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={value.startDate}
                onChange={(e) => onChange({ ...value, preset: 'custom' as DateRangePreset, label: 'Custom', startDate: e.target.value })}
                className={clsx(
                  "flex-1 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500",
                  dark ? "bg-slate-800 border-slate-600 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                )}
              />
              <span className={clsx("text-xs", dark ? "text-slate-600" : "text-slate-300")}>→</span>
              <input
                type="date"
                value={value.endDate}
                onChange={(e) => onChange({ ...value, preset: 'custom' as DateRangePreset, label: 'Custom', endDate: e.target.value })}
                className={clsx(
                  "flex-1 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500",
                  dark ? "bg-slate-800 border-slate-600 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                )}
              />
            </div>
            {isCustom && (
              <button
                onClick={() => setOpen(false)}
                className="w-full mt-0.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
