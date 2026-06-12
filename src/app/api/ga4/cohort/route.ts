import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { runCohortReport, getServiceAccountToken } from "@/lib/ga4";
import { generateDemoCohort } from "@/lib/demoData";

export async function POST(req: NextRequest) {
  try {
    const { propertyId, weeksBack, hostnameFilter } = await req.json();
    if (!propertyId) {
      return NextResponse.json({ error: "Missing propertyId." }, { status: 400 });
    }

    // ── Demo mode ───────────────────────────────────────────────────
    if (
      process.env.DEMO_MODE === "true" ||
      propertyId === "properties/000000000" ||
      propertyId === "properties/DEMO"
    ) {
      return NextResponse.json(generateDemoCohort(weeksBack ?? 8));
    }

    // ── Live GA4 ───────────────────────────────────────────────────
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

    const result = await runCohortReport({
      propertyId,
      accessToken,
      weeksBack: weeksBack ?? 8,
      hostnameFilter,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[Cohort API Error]", JSON.stringify(err, Object.getOwnPropertyNames(err as object)));
    const e = err as Record<string, unknown>;
    const message = (e?.message as string) || "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
