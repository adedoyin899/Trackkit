import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    const { phoneNumber } = body;

    // E.164 phone number regex validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format", code: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    // Temporary bypass while no SMS provider is configured in Supabase
    // (real signInWithOtp currently fails with "Unsupported phone
    // provider" for every number). Only active when OTP_BYPASS_CODE is
    // set — unset it once a provider is configured to restore the real
    // flow. See hand off/bug.md for the full writeup.
    if (process.env.OTP_BYPASS_CODE) {
      return NextResponse.json({
        success: true,
        message: `OTP sent to ${phoneNumber}`,
        expiresIn: 600,
      });
    }

    // Call Supabase to trigger phone OTP
    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });

    if (error) {
      if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
        return NextResponse.json(
          { error: "Too many OTP requests. Try again in 2 minutes.", code: "RATE_LIMIT_OTP" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: error.message, code: "OTP_REQUEST_FAILED" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${phoneNumber}`,
      expiresIn: 600,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
