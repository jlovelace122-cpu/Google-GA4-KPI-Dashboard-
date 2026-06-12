import OpenAI from "openai";
import { GA4ReportResult } from "@/lib/ga4";
import { KpiPreset } from "@/lib/kpiPresets";

// Lazy-init so the client is only created at request time, not during build
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export interface InsightResult {
  summary: string;          // 1-sentence headline
  insights: Insight[];      // 3-5 bullets
  recommendations: string[]; // 2-3 action items
  sentiment: "positive" | "neutral" | "warning" | "critical";
  generatedAt: string;
}

export interface Insight {
  type: "trend" | "anomaly" | "opportunity" | "risk";
  title: string;
  detail: string;
  metric?: string;
  change?: string;
}

// ─── Format report data into a compact prompt-friendly summary ────────────────
function formatDataForPrompt(preset: KpiPreset, data: GA4ReportResult): string {
  const lines: string[] = [];

  lines.push(`Report: ${preset.label}`);
  lines.push(`Metrics tracked: ${preset.metrics.join(", ")}`);
  lines.push(`Total rows: ${data.rowCount ?? data.rows.length}`);

  // Totals
  if (data.totals && Object.keys(data.totals).length > 0) {
    lines.push("\nAggregate Totals:");
    for (const [key, val] of Object.entries(data.totals)) {
      lines.push(`  ${key}: ${val}`);
    }
  }

  // Top rows (max 20 to keep prompt size reasonable)
  if (data.rows.length > 0) {
    lines.push(`\nTop ${Math.min(data.rows.length, 20)} rows:`);
    data.rows.slice(0, 20).forEach((row, i) => {
      const rowStr = Object.entries(row)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      lines.push(`  [${i + 1}] ${rowStr}`);
    });
  }

  return lines.join("\n");
}

// ─── Main insight generator ───────────────────────────────────────────────────
export async function generateInsights(
  preset: KpiPreset,
  data: GA4ReportResult,
  propertyLabel: string,
  dateRange: { startDate: string; endDate: string; label: string }
): Promise<InsightResult> {
  const dataStr = formatDataForPrompt(preset, data);

  const systemPrompt = `You are an expert digital marketing analyst specializing in automotive dealership analytics.
You analyze Google Analytics 4 data for car dealerships and provide sharp, actionable intelligence.
Your tone is confident, specific, and executive-level — like a senior analyst briefing a Chief Revenue Officer.
Always connect metrics to real business outcomes: leads, inventory views, form fills, test drives, sales.`;

  const userPrompt = `Analyze the following GA4 report data for ${propertyLabel} (${dateRange.label}) and provide intelligent insights.

${dataStr}

Return a JSON object with EXACTLY this structure:
{
  "summary": "One sharp headline sentence summarizing the most important finding",
  "insights": [
    {
      "type": "trend|anomaly|opportunity|risk",
      "title": "Short insight title (5-8 words)",
      "detail": "2-3 sentence explanation connecting the metric to business impact. Be specific with numbers.",
      "metric": "primary metric name",
      "change": "e.g. +18% or -12% if applicable"
    }
  ],
  "recommendations": [
    "Specific action the CRO or marketing team should take (start with a verb)"
  ],
  "sentiment": "positive|neutral|warning|critical"
}

Rules:
- Include 3-5 insights
- Include 2-3 recommendations  
- Be specific: mention actual numbers from the data
- For automotive context: think inventory pages, VDP views, lead forms, phone calls, chat starts
- If data is sparse or empty, note that and recommend data collection improvements
- sentiment: positive = good metrics, warning = mixed or concerning, critical = significant drops`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 1200,
  });

  const raw = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    summary: parsed.summary ?? "Analysis complete.",
    insights: parsed.insights ?? [],
    recommendations: parsed.recommendations ?? [],
    sentiment: parsed.sentiment ?? "neutral",
    generatedAt: new Date().toISOString(),
  };
}
