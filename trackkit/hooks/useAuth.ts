import { useState, useEffect } from "react";
import { useTrackkitStore } from "@/lib/store";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const user = useTrackkitStore((s) => s.user);
  const setUser = useTrackkitStore((s) => s.setUser);

  // Auto-refresh token on initial mount
  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
        } else {
          // If refresh fails, session is expired
          setUser(null);
        }
      } catch (err) {
        console.error("Auth session initialization error:", err);
      }
    }
    initSession();
  }, [setUser]);

  const requestOtp = async (phoneNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to request OTP");
      }
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to request OTP";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (phoneNumber: string, otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify OTP";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error("Auth session logout API error:", err);
    } finally {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    isLoading,
    error,
    requestOtp,
    verifyOtp,
    logout,
  };
}
