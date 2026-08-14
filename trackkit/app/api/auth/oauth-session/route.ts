import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

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

    const { accessToken, refreshToken } = body;
    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Missing session tokens", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Confirm this is a real Supabase-issued token before trusting anything
    // in it — the client only *claims* it just finished a Google sign-in.
    const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userResult.user) {
      return NextResponse.json(
        { error: "Invalid session", code: "INVALID_SESSION" },
        { status: 401 }
      );
    }

    const authUser = userResult.user;

    let dbUser = null;
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (existingUser) {
      dbUser = existingUser;
    } else {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: authUser.id,
          phone_number: authUser.phone || null,
          email: authUser.email || null,
          shop_name: null,
          auth_provider: "google",
        })
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

    const cookieStore = await cookies();
    cookieStore.set("token", accessToken, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600,
    });
    cookieStore.set("refreshToken", refreshToken, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        phoneNumber: dbUser.phone_number,
        email: dbUser.email,
        shopName: dbUser.shop_name,
        createdAt: dbUser.created_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
