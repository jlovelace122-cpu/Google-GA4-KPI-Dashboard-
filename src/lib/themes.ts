export type ThemeKey = 'light' | 'dark' | 'executive';

export interface DashboardTheme {
  key: ThemeKey;
  label: string;
  description: string;
  // Page
  page: string;
  // Header
  header: string;
  logoBox: string;
  headerTitle: string;
  headerSub: string;
  // Demo banner
  banner: string;
  bannerText: string;
  bannerLink: string;
  // Buttons in header
  signInBtn: string;
  demoBadge: string;
  // Sections
  section: string;
  sectionPadded: string;
  sectionTitle: string;
  // Empty state
  emptyBox: string;
  emptyIconClass: string;
  emptyTitle: string;
  emptyBody: string;
  // Footer
  footer: string;
  // Charts / cards
  dark: boolean;
  chartColors: string[];
  darkPresetButtons: boolean;
}

export const THEMES: Record<ThemeKey, DashboardTheme> = {
  light: {
    key: 'light',
    label: 'Demo 1',
    description: 'Clean & Minimal',
    page: 'bg-slate-50',
    header: 'border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm',
    logoBox: 'w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0',
    headerTitle: 'text-sm font-bold text-slate-900 leading-tight',
    headerSub: 'text-xs text-slate-400 leading-tight',
    banner: 'bg-amber-50 border-b border-amber-200 px-6 py-3',
    bannerText: 'text-sm text-amber-800',
    bannerLink: 'ml-2 underline font-medium hover:text-amber-900',
    signInBtn: 'inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm',
    demoBadge: 'inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-full',
    section: 'bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm',
    sectionPadded: 'bg-white border border-slate-200 rounded-2xl px-5 py-5 shadow-sm',
    sectionTitle: 'text-sm font-semibold text-slate-500 mb-5',
    emptyBox: 'w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4',
    emptyIconClass: 'w-7 h-7 text-slate-300',
    emptyTitle: 'text-slate-500 font-medium mb-1',
    emptyBody: 'text-slate-400 text-sm max-w-sm',
    footer: 'border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400',
    dark: false,
    chartColors: ['#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f97316', '#eab308'],
    darkPresetButtons: false,
  },

  dark: {
    key: 'dark',
    label: 'Demo 2',
    description: 'Executive Dark',
    page: 'bg-slate-900',
    header: 'border-b border-slate-700 bg-slate-800 sticky top-0 z-30 shadow-lg',
    logoBox: 'w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0',
    headerTitle: 'text-sm font-bold text-white leading-tight',
    headerSub: 'text-xs text-slate-400 leading-tight',
    banner: 'bg-amber-950/60 border-b border-amber-800/50 px-6 py-3',
    bannerText: 'text-sm text-amber-300',
    bannerLink: 'ml-2 underline font-medium hover:text-amber-200',
    signInBtn: 'inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold px-4 py-2 rounded-xl transition-colors',
    demoBadge: 'inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded-full',
    section: 'bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 shadow-sm',
    sectionPadded: 'bg-slate-800 border border-slate-700 rounded-2xl px-5 py-5 shadow-sm',
    sectionTitle: 'text-sm font-semibold text-slate-400 mb-5',
    emptyBox: 'w-16 h-16 rounded-2xl bg-slate-700 border border-slate-600 flex items-center justify-center mb-4',
    emptyIconClass: 'w-7 h-7 text-slate-500',
    emptyTitle: 'text-slate-400 font-medium mb-1',
    emptyBody: 'text-slate-500 text-sm max-w-sm',
    footer: 'border-t border-slate-700 px-6 py-4 text-center text-xs text-slate-500',
    dark: true,
    chartColors: ['#f59e0b', '#34d399', '#f87171', '#a78bfa', '#fb923c', '#4ade80'],
    darkPresetButtons: true,
  },

  executive: {
    key: 'executive',
    label: 'Demo 3',
    description: 'Dealership Premium',
    page: 'bg-stone-50',
    header: 'border-b border-stone-800 bg-stone-900 sticky top-0 z-30 shadow-lg',
    logoBox: 'w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0',
    headerTitle: 'text-sm font-bold text-white leading-tight',
    headerSub: 'text-xs text-stone-400 leading-tight',
    banner: 'bg-emerald-50 border-b border-emerald-200 px-6 py-3',
    bannerText: 'text-sm text-emerald-900',
    bannerLink: 'ml-2 underline font-medium hover:text-emerald-800',
    signInBtn: 'inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm',
    demoBadge: 'inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full',
    section: 'bg-white border border-stone-200 rounded-2xl px-5 py-4 shadow-sm',
    sectionPadded: 'bg-white border border-stone-200 rounded-2xl px-5 py-5 shadow-sm',
    sectionTitle: 'text-sm font-semibold text-stone-500 mb-5',
    emptyBox: 'w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mb-4',
    emptyIconClass: 'w-7 h-7 text-stone-300',
    emptyTitle: 'text-stone-500 font-medium mb-1',
    emptyBody: 'text-stone-400 text-sm max-w-sm',
    footer: 'border-t border-stone-200 px-6 py-4 text-center text-xs text-stone-400',
    dark: false,
    chartColors: ['#059669', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2'],
    darkPresetButtons: false,
  },
};
