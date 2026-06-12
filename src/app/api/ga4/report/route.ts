import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { runGA4Report, getServiceAccountToken } from "@/lib/ga4";
import { generateDemoReport } from "@/lib/demoData";

function isDemoProperty(propertyId: string) {
  return (
    process.env.DEMO_MODE === "true" ||
    propertyId === "properties/000000000" ||
    propertyId === "properties/DEMO"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, startDate, endDate, metrics, dimensions, limit, orderBy, dimensionFilters, hostnameFilter } = body;

    if (!propertyId || !startDate || !endDate || !metrics?.length) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    // ── Demo mode: return synthetic data without hitting GA4 ──────────────
    if (isDemoProperty(propertyId)) {
      const demo = generateDemoReport({ metrics, dimensions, startDate, endDate, dimensionFilters });
      return NextResponse.json(demo);
    }

    // ── Live GA4 ──────────────────────────────────────────────────────────
    let accessToken: string;

    if (process.env.BYPASS_AUTH === "true") {
      accessToken = await getServiceAccountToken();
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized. Please sign in with Google." }, { status: 401 });
      }
      accessToken = session.accessToken;
    }

    const result = await runGA4Report({
      propertyId,
      startDate,
      endDate,
      metrics,
      dimensions,
      limit,
      orderBy,
      dimensionFilters,
      hostnameFilter,
      accessToken,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[GA4 API Error]", JSON.stringify(err, Object.getOwnPropertyNames(err as object)));
    const e = err as Record<string, unknown>;
    const message = (e?.message as string) || (e?.details as string) || (e?.code as string) || "Internal server error";
    return NextResponse.json({ error: message, details: e?.details, code: e?.code }, { status: 500 });
  }
}
