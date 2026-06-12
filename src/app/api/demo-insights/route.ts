import { NextRequest, NextResponse } from "next/server";
import { generateInsights } from "@/lib/insights";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { preset, data, propertyLabel, dateRange } = body;

    if (!preset || !data) {
      return NextResponse.json({ error: "Missing preset or data." }, { status: 400 });
    }

    const result = await generateInsights(preset, data, propertyLabel ?? "Demo Property", dateRange);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[Demo Insights API Error]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
