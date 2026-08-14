import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, supabaseAdmin } from "@/lib/supabase";

// Local in-memory attempts cache per phone number
const attemptsStore = new Map<string, number>();
const MAX_ATTEMPTS = 3;

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const { phoneNumber, otp } = body;

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Keep track of remaining attempts
    const attempts = attemptsStore.get(phoneNumber) ?? MAX_ATTEMPTS;

    if (attempts <= 0) {
      return NextResponse.json(
        {
          error: "Too many failed attempts. Please request a new OTP.",
          code: "TOO_MANY_FAILED_ATTEMPTS",
          attemptsRemaining: 0,
        },
        { status: 400 }
      );
    }

    // Temporary bypass while no SMS provider is configured (see
    // request-otp/route.ts and hand off/bug.md). Real OTPs never get
    // generated right now, so this can't go through supabase.auth.verifyOtp
    // at all — instead it finds-or-creates the phone number's row directly
    // in the public `users` table via the admin client and issues an
    // app-level session. This is intentionally NOT a real Supabase Auth
    // JWT (only Supabase's own Auth service can mint those) — routes that
    // require one (e.g. /api/margins) will fail closed and fall back to
    // their existing local-only computation rather than erroring visibly.
    const bypassCode = process.env.OTP_BYPASS_CODE;
    if (bypassCode) {
      if (otp !== bypassCode) {
        const newAttempts = attempts - 1;
        attemptsStore.set(phoneNumber, newAttempts);
        return NextResponse.json(
          {
            error: "Invalid or expired OTP",
            code: "INVALID_OTP",
            attemptsRemaining: Math.max(0, newAttempts),
          },
          { status: 400 }
        );
      }

      attemptsStore.delete(phoneNumber);

      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("phone_number", phoneNumber)
        .single();

      let dbUser = existingUser;
      if (!dbUser) {
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from("users")
          .insert({ id: crypto.randomUUID(), phone_number: phoneNumber, shop_name: null })
          .select()
          .single();
        if (insertError) {
          return NextResponse.json(
            { error: insertError.message, code: "DB_ERROR" },
            { status: 500 }
          );
        }
        dbUser = newUser;
      }

      const bypassToken = `bypass-token:${dbUser.id}`;
      const bypassRefreshToken = `bypass-refresh:${dbUser.id}`;
      const expiresIn = 3600;

      const cookieStore = await cookies();
      cookieStore.set("token", bypassToken, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: expiresIn,
      });
      cookieStore.set("refreshToken", bypassRefreshToken, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
      });

      return NextResponse.json({
        success: true,
        token: bypassToken,
        refreshToken: bypassRefreshToken,
        expiresIn,
        user: {
          id: dbUser.id,
          phoneNumber: dbUser.phone_number,
          shopName: dbUser.shop_name,
          createdAt: dbUser.created_at,
        },
      });
    }

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: otp,
      type: "sms",
    });

    if (error) {
      const newAttempts = attempts - 1;
      attemptsStore.set(phoneNumber, newAttempts);

      // Check if expired
      const isExpired =
        error.message.toLowerCase().includes("expired") || error.status === 401;

      if (isExpired) {
        return NextResponse.json(
          { error: "OTP has expired", code: "OTP_EXPIRED" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: "Invalid or expired OTP",
          code: "INVALID_OTP",
          attemptsRemaining: Math.max(0, newAttempts),
        },
        { status: 400 }
      );
    }

    // Success -> Clear attempts count
    attemptsStore.delete(phoneNumber);

    const { session, user } = data;
    if (!session || !user) {
      return NextResponse.json(
        { error: "Failed to establish user session", code: "AUTH_SESSION_FAILED" },
        { status: 500 }
      );
    }

    // Verify if user exists in public users table, create if not
    let dbUser = null;
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (findError || !existingUser) {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: user.id,
          phone_number: user.phone || phoneNumber,
          shop_name: null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to insert user into public.users:", insertError);
      } else {
        dbUser = newUser;
      }
    } else {
      dbUser = existingUser;
    }

    const userData = {
      id: user.id,
      phoneNumber: dbUser?.phone_number || user.phone || phoneNumber,
      shopName: dbUser?.shop_name || null,
      createdAt: dbUser?.created_at || user.created_at || new Date().toISOString(),
    };

    // Save tokens in HttpOnly/Secure Cookies
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
      success: true,
      token: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in ?? 3600,
      user: userData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
