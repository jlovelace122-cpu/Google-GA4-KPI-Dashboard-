import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

export type DateRangePreset =
  | "last7"
  | "last14"
  | "last28"
  | "last30"
  | "last90"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface DateRange {
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  label: string;
  preset: DateRangePreset;
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export const DATE_RANGE_PRESETS: DateRange[] = [
  {
    preset: "last7",
    label: "Last 7 days",
    startDate: fmt(subDays(new Date(), 7)),
    endDate: fmt(subDays(new Date(), 1)),
  },
  {
    preset: "last14",
    label: "Last 14 days",
    startDate: fmt(subDays(new Date(), 14)),
    endDate: fmt(subDays(new Date(), 1)),
  },
  {
    preset: "last28",
    label: "Last 28 days",
    startDate: fmt(subDays(new Date(), 28)),
    endDate: fmt(subDays(new Date(), 1)),
  },
  {
    preset: "last30",
    label: "Last 30 days",
    startDate: fmt(subDays(new Date(), 30)),
    endDate: fmt(subDays(new Date(), 1)),
  },
  {
    preset: "last90",
    label: "Last 90 days",
    startDate: fmt(subDays(new Date(), 90)),
    endDate: fmt(subDays(new Date(), 1)),
  },
  {
    preset: "thisMonth",
    label: "This month",
    startDate: fmt(startOfMonth(new Date())),
    endDate: fmt(endOfMonth(new Date())),
  },
  {
    preset: "lastMonth",
    label: "Last month",
    startDate: fmt(startOfMonth(subMonths(new Date(), 1))),
    endDate: fmt(endOfMonth(subMonths(new Date(), 1))),
  },
];

/**
 * Returns the previous period of equal length immediately before the given range.
 * e.g. "last 30 days" → the 30 days before that.
 */
export function getPreviousPeriod(range: DateRange): { startDate: string; endDate: string } {
  const start = new Date(range.startDate + "T00:00:00");
  const end = new Date(range.endDate + "T00:00:00");
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return {
    startDate: fmt(subDays(start, days)),
    endDate: fmt(subDays(start, 1)),
  };
}
