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
  const { requestOtp, verifyOtp, isLoading } = useAuth();

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
      setUiSuccess(`OTP code sent to ${formattedPhone}`);
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
    <div className="w-full max-w-md rounded-cards bg-white p-6 shadow-subtle-3 border border-stone-surface">
      <div className="flex flex-col items-center text-center mb-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-black text-white mb-3">
          <Storefront weight="fill" size={24} />
        </span>
        <h2 className="font-display text-[22px] font-semibold tracking-tight text-heading-charcoal">
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
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2.5 text-[13px] text-[var(--color-alert-red)]">
          <Warning className="shrink-0 mt-0.5" size={18} />
          <span>{uiError}</span>
        </div>
      )}

      {uiSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 flex items-start gap-2.5 text-[13px] text-grass-green">
          <CheckCircle className="shrink-0 mt-0.5" size={18} />
          <span>{uiSuccess}</span>
        </div>
      )}

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
                className="w-full rounded-lg border border-stone-surface bg-cream-canvas pl-10 pr-3 py-3 text-[16px] outline-none focus:border-[var(--color-link-blue)] focus:ring-1 focus:ring-[var(--color-link-blue)] transition-all placeholder-stone-400"
              />
            </div>
            <p className="text-[11px] text-muted-gray mt-1">
              Include country code prefix (e.g. +234 for Nigeria, +233 for Ghana).
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-buttons bg-ink-black py-3 text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? "Requesting OTP..." : "Request OTP Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[13px] font-medium text-body-brown">
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
                className="text-[12px] text-muted-gray hover:text-ink-black flex items-center gap-1 font-medium"
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
                className="w-full rounded-lg border border-stone-surface bg-cream-canvas pl-10 pr-3 py-3 text-[18px] tracking-[0.2em] font-semibold text-center outline-none focus:border-[var(--color-link-blue)] focus:ring-1 focus:ring-[var(--color-link-blue)] transition-all"
              />
            </div>
            <div className="flex justify-between items-center text-[12px] text-muted-gray mt-1.5 px-0.5">
              <span>Code expires in: <strong className="font-semibold text-ink-black">{formatTime(timeLeft)}</strong></span>
              {attemptsRemaining !== null && (
                <span className="text-[var(--color-alert-red)] font-medium">
                  {attemptsRemaining} {attemptsRemaining === 1 ? "attempt" : "attempts"} remaining
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || timeLeft <= 0}
            className="w-full rounded-buttons bg-ink-black py-3 text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>

          {timeLeft <= 0 && (
            <button
              type="button"
              onClick={handlePhoneSubmit}
              disabled={isLoading}
              className="w-full rounded-buttons border border-stone-surface bg-cream-canvas py-3 text-[14px] font-semibold text-ink-black hover:bg-stone-50 transition-all flex items-center justify-center cursor-pointer"
            >
              Resend OTP Code
            </button>
          )}
        </form>
      )}
    </div>
  );
}
