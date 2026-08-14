import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    let refreshToken = "";

    // Read refresh token from Authorization header
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      refreshToken = authHeader.substring(7);
    }

    // Fallback to cookies
    if (!refreshToken) {
      const cookieStore = await cookies();
      refreshToken = cookieStore.get("refreshToken")?.value || "";
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is missing", code: "MISSING_REFRESH_TOKEN" },
        { status: 401 }
      );
    }

    if (refreshToken === "mock-jwt-token" || refreshToken === "mock-refresh-token") {
      return NextResponse.json({
        token: "mock-jwt-token",
        expiresIn: 3600,
      });
    }

    // See verify-otp/route.ts — the OTP_BYPASS_CODE session isn't a real
    // Supabase token, so it can't go through refreshSession(). Keeping the
    // same userId-derived token alive here just re-issues it.
    if (refreshToken.startsWith("bypass-refresh:")) {
      const userId = refreshToken.slice("bypass-refresh:".length);
      return NextResponse.json({
        token: `bypass-token:${userId}`,
        expiresIn: 3600,
      });
    }

    // Call Supabase refreshSession
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "REFRESH_FAILED" },
        { status: 401 }
      );
    }

    const { session } = data;
    if (!session) {
      return NextResponse.json(
        { error: "Failed to refresh session", code: "REFRESH_SESSION_FAILED" },
        { status: 500 }
      );
    }

    // Update cookies
    const cookieStore = await cookies();
    cookieStore.set("token", session.access_token, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: session.expires_in ?? 3600,
    });
    cookieStore.set("refreshToken", session.refresh_token, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      token: session.access_token,
      expiresIn: session.expires_in ?? 3600,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
