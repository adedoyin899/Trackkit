"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useTrackkitStore } from "@/lib/store";

export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useTrackkitStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeSignIn() {
      const { data, error: exchangeError } = await supabaseBrowser.auth.exchangeCodeForSession(
        window.location.href,
      );

      if (cancelled) return;

      if (exchangeError || !data.session) {
        setError(exchangeError?.message ?? "Could not complete Google sign-in.");
        return;
      }

      const res = await fetch("/api/auth/oauth-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        }),
      });

      if (cancelled) return;

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not complete Google sign-in.");
        return;
      }

      const body = await res.json();
      setUser(body.user);
      router.push("/");
      router.refresh();
    }

    completeSignIn();
    return () => {
      cancelled = true;
    };
  }, [router, setUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-canvas p-4 text-center">
      {error ? (
        <>
          <p className="text-[15px] font-medium text-[var(--color-alert-red)]">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="mt-4 rounded-buttons bg-ink-black px-4 py-2 text-[14px] font-semibold text-white"
          >
            Back to login
          </button>
        </>
      ) : (
        <p className="text-[15px] text-muted-gray">Signing you in…</p>
      )}
    </div>
  );
}
