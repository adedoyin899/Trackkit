"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Key,
  Storefront,
  ArrowLeft,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";

export function AuthFlow() {
  const router = useRouter();
  const { requestOtp, verifyOtp, signInWithGoogle, isLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Redirects away on success; only reaches here on failure.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not start Google sign-in.";
      setUiError(msg);
      setGoogleLoading(false);
    }
  };

  // Navigation states: 'phone' or 'otp'
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Error and UI notification states
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Timer states (600s = 10 min)
  const [timeLeft, setTimeLeft] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Focus ref for code input
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Expiry Timer Logic
  useEffect(() => {
    if (step === "otp" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setUiError("OTP has expired. Please request a new one.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timeLeft]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);
    setUiSuccess(null);

    // E.164 normalization check (if user enters without + prefix, auto add default)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      // Default to Nigerian country code if only digits entered
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+234" + formattedPhone.slice(1);
      } else {
        formattedPhone = "+" + formattedPhone;
      }
    }

    // Quick regex validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formattedPhone)) {
      setUiError("Invalid phone number. Ensure it starts with a country code (e.g. +234).");
      return;
    }

    try {
      await requestOtp(formattedPhone);
      setPhoneNumber(formattedPhone);
      setAttemptsRemaining(null);
      setTimeLeft(600); // 10 minutes
      setOtpCode("000000");
      setUiSuccess(`Verification code ready for ${formattedPhone}`);
      setStep("otp");
      // Auto focus OTP input on next render
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to request OTP. Please try again.";
      setUiError(msg);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (otpCode.length !== 6 || isNaN(Number(otpCode))) {
      setUiError("Please enter a valid 6-digit verification code.");
      return;
    }

    if (timeLeft <= 0) {
      setUiError("OTP has expired. Please go back and request a new one.");
      return;
    }

    try {
      await verifyOtp(phoneNumber, otpCode);
      setUiSuccess("Verification successful! Opening inventory...");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Invalid code. Check and try again.";
      setUiError(errMsg);
      const errWithDetails = err as { message?: string; attemptsRemaining?: number };
      if (errWithDetails.message?.includes("attempts") || errWithDetails.attemptsRemaining !== undefined) {
        // Parse attempts if returned from API
        const match = errWithDetails.message?.match(/\d+/);
        const remaining = match ? parseInt(match[0], 10) : errWithDetails.attemptsRemaining;
        if (remaining !== undefined) {
          setAttemptsRemaining(remaining);
        }
      } else {
        // Fallback decrement local state
        setAttemptsRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : 2));
      }
    }
  };

  return (
    <div className="w-full max-w-md rounded-cards bg-[var(--surface-card)] p-6 sm:p-7 shadow-subtle-3 border border-[var(--border-hairline)]">
      <div className="flex flex-col items-center text-center mb-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral mb-3">
          <Storefront weight="fill" size={24} />
        </span>
        <h2 className="font-display text-[24px] font-extrabold tracking-tight text-heading-charcoal">
          Welcome to Trackkit
        </h2>
        <p className="text-[13px] text-muted-gray mt-1">
          {step === "phone"
            ? "Enter your phone number to sign in or register"
            : "We sent a 6-digit code to your phone"}
        </p>
      </div>

      {/* Notifications banner */}
      {uiError && (
        <div className="mb-4 rounded-xl bg-[var(--color-alert-red)]/10 border border-[var(--color-alert-red)]/30 p-3 flex items-start gap-2.5 text-[13px] text-[var(--color-alert-red)]">
          <Warning className="shrink-0 mt-0.5" size={18} />
          <span>{uiError}</span>
        </div>
      )}

      {uiSuccess && (
        <div className="mb-4 rounded-xl bg-[var(--color-grass-green)]/10 border border-[var(--color-grass-green)]/30 p-3 flex items-start gap-2.5 text-[13px] text-[var(--color-grass-green)]">
          <CheckCircle className="shrink-0 mt-0.5" size={18} />
          <span>{uiSuccess}</span>
        </div>
      )}

      {step === "phone" ? (
        <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="monzo-pill mb-4 flex w-full items-center justify-center gap-2.5 border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-3 text-[14px] font-bold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
            </svg>
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-hairline)]" />
            <span className="text-[12px] font-medium text-muted-gray">OR</span>
            <div className="h-px flex-1 bg-[var(--border-hairline)]" />
          </div>
        </>
      ) : null}

      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-body-brown mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-gray">
                <Phone size={18} />
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +2348031234567"
                disabled={isLoading}
                required
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] pl-10 pr-3 py-3 text-[16px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)] focus:ring-1 focus:ring-[var(--color-link-blue)] transition-all placeholder-muted-gray"
              />
            </div>
            <p className="text-[11px] text-muted-gray mt-1">
              Include country code prefix (e.g. +234 for Nigeria, +233 for Ghana).
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="monzo-pill w-full bg-ink-black py-3 text-[14px] font-bold text-[var(--color-ink-black-text)] hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isLoading ? "Requesting Code..." : "Request Verification Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[13px] font-semibold text-body-brown">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setUiError(null);
                  setUiSuccess(null);
                  setOtpCode("");
                }}
                className="text-[12px] text-muted-gray hover:text-heading-charcoal flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft size={14} /> Change Phone
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-gray">
                <Key size={18} />
              </span>
              <input
                ref={otpInputRef}
                type="text"
                maxLength={6}
                pattern="\d{6}"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                disabled={isLoading}
                required
                className="w-full rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] pl-10 pr-3 py-3 text-[18px] tracking-[0.2em] font-extrabold text-heading-charcoal text-center outline-none focus:border-[var(--color-hot-coral)] focus:ring-1 focus:ring-[var(--color-hot-coral)] transition-all font-display"
              />
            </div>
            <div className="flex justify-between items-center text-[12px] text-muted-gray mt-1.5 px-0.5">
              <span>Code expires in: <strong className="font-semibold text-heading-charcoal">{formatTime(timeLeft)}</strong></span>
              {attemptsRemaining !== null && (
                <span className="text-[var(--color-alert-red)] font-medium">
                  {attemptsRemaining} {attemptsRemaining === 1 ? "attempt" : "attempts"} remaining
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-gray mt-1 text-center">
              Default instant test code: <strong className="text-heading-charcoal font-semibold">000000</strong>
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || timeLeft <= 0}
            className="monzo-pill w-full bg-[var(--color-hot-coral)] py-3 text-[14px] font-bold text-white shadow-coral hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? "Verifying..." : "Verify & Open Shop"}
          </button>

          {timeLeft <= 0 && (
            <button
              type="button"
              onClick={handlePhoneSubmit}
              disabled={isLoading}
              className="monzo-pill w-full border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-3 text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-all flex items-center justify-center cursor-pointer"
            >
              Resend OTP Code
            </button>
          )}
        </form>
      )}
    </div>
  );
}
