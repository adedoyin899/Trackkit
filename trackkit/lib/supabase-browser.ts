import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Browser-only client used solely for the Google OAuth redirect flow.
 * Unlike `lib/supabase.ts`'s server-side client, this one persists its own
 * session and completes the PKCE code exchange — but that session is only
 * a stepping stone: app/auth/callback/page.tsx immediately hands the
 * resulting tokens to /api/auth/oauth-session, which re-issues them as the
 * same httpOnly cookies phone-OTP login already uses, so the rest of the
 * app (useAuth, /api/auth/refresh, etc.) never needs to know which method
 * a user signed in with.
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    detectSessionInUrl: false,
  },
});
