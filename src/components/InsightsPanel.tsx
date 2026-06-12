"use client";

import { InsightResult, Insight } from "@/lib/insights";
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Loader2, Sparkles, ChevronRight } from "lucide-react";
import clsx from "clsx";

const SENTIMENT_CONFIG = {
  positive: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
    label: "Positive",
  },
  neutral: {
    bar: "bg-blue-500",
    badge: "bg-blue-50 text-blue-600 border-blue-200",
    label: "Neutral",
  },
  warning: {
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-600 border-amber-200",
    label: "Watch",
  },
  critical: {
    bar: "bg-red-500",
    badge: "bg-red-50 text-red-600 border-red-200",
    label: "Action Needed",
  },
};

const INSIGHT_TYPE_CONFIG: Record<Insight["type"], { icon: React.ElementType; color: string }> = {
  trend: { icon: TrendingUp, color: "text-blue-500" },
  anomaly: { icon: AlertTriangle, color: "text-amber-500" },
  opportunity: { icon: Lightbulb, color: "text-emerald-500" },
  risk: { icon: TrendingDown, color: "text-red-500" },
};

interface InsightsPanelProps {
  insights: InsightResult | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  hasData: boolean;
}

export default function InsightsPanel({
  insights,
  isLoading,
  error,
  onGenerate,
  hasData,
}: InsightsPanelProps) {
  const sentiment = insights ? SENTIMENT_CONFIG[insights.sentiment] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-900">AI Insights</h2>
          {sentiment && (
            <span className={clsx("text-xs px-2 py-0.5 rounded-full border font-medium", sentiment.badge)}>
              {sentiment.label}
            </span>
          )}
        </div>
        <button
          onClick={onGenerate}
          disabled={!hasData || isLoading}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            hasData && !isLoading
              ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> {insights ? "Refresh Insights" : "Generate Insights"}</>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {/* Error */}
        {error && !isLoading && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
            <div className="h-3 bg-slate-100 rounded w-4/6" />
            <div className="mt-4 h-3 bg-slate-100 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-3/4" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && !insights && (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {hasData
                ? "Click \"Generate Insights\" to get AI analysis of this report."
                : "Load a report first, then generate AI insights."}
            </p>
          </div>
        )}

        {/* Insights */}
        {!isLoading && insights && (
          <div className="space-y-5">
            {/* Sentiment bar + summary */}
            <div>
              <div className={clsx("h-0.5 w-full rounded mb-3", sentiment?.bar)} />
              <p className="text-sm font-medium text-slate-900 leading-snug">{insights.summary}</p>
            </div>

            {/* Insight bullets */}
            <div className="space-y-3">
              {insights.insights.map((insight, i) => {
                const cfg = INSIGHT_TYPE_CONFIG[insight.type];
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <Icon className={clsx("w-4 h-4 mt-0.5 shrink-0", cfg.color)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900">{insight.title}</span>
                        {insight.change && (
                          <span className={clsx(
                            "text-xs font-bold px-1.5 py-0.5 rounded",
                            insight.change.startsWith("+")
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          )}>
                            {insight.change}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{insight.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Recommended Actions
                </h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <ChevronRight className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generated timestamp */}
            <p className="text-xs text-slate-400 pt-1">
              Generated {new Date(insights.generatedAt).toLocaleTimeString()} · GPT-4o
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const filesExclude = {
  "**/.env.local": false
}
