import { NextResponse } from "next/server";

const BUILD_TIME = new Date().toISOString();
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "2.0.0";

export async function GET() {
  // Check Supabase reachability (non-blocking)
  let dbStatus: "ok" | "not_configured" | "unreachable" = "not_configured";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "HEAD",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        },
        signal: AbortSignal.timeout(3000), // 3s timeout
      });
      dbStatus = res.ok || res.status === 401 ? "ok" : "unreachable";
    } catch {
      dbStatus = "unreachable";
    }
  }

  const payload = {
    status: dbStatus === "unreachable" ? "degraded" : "ok",
    version: VERSION,
    buildTime: BUILD_TIME,
    timestamp: new Date().toISOString(),
    services: {
      api: "ok",
      database: dbStatus,
    },
  };

  const httpStatus = payload.status === "ok" ? 200 : 503;
  return NextResponse.json(payload, { status: httpStatus });
}
