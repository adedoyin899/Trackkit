import { supabaseAdmin } from "./supabase";

/**
 * Resolves a session token (from the "token" cookie/Authorization header)
 * to a user id. Handles both a real Supabase-issued JWT (Google sign-in,
 * or phone OTP once an SMS provider is configured) and the temporary
 * `bypass-token:<userId>` format issued by verify-otp's OTP_BYPASS_CODE
 * path (see hand off/bug.md) — that one was never issued by Supabase, so
 * it can't be verified via auth.getUser(); the id is just read back out
 * of the token string directly.
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  if (!token) return null;

  if (token.startsWith("bypass-token:")) {
    return token.slice("bypass-token:".length) || null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
