"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Storefront,
  Warning,
  CheckCircle,
  Eye,
  EyeSlash,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";

const COUNTRY_CODES = [
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
];

export function AuthFlow() {
  const router = useRouter();
  const { loginWithPassword, signInWithGoogle, isLoading } = useAuth();

  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [countryCode, setCountryCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("07067634979");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not start Google sign-in.";
      setUiError(msg);
      setGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);
    setUiSuccess(null);

    let identifier = "";
    if (authMode === "phone") {
      let rawPhone = phoneNumber.trim().replace(/[\s()-]/g, "");
      if (!rawPhone) {
        setUiError("Please enter your phone number.");
        return;
      }
      if (rawPhone.startsWith("0")) {
        identifier = countryCode + rawPhone.slice(1);
      } else if (rawPhone.startsWith("+")) {
        identifier = rawPhone;
      } else {
        identifier = countryCode + rawPhone;
      }
    } else {
      identifier = email.trim();
      if (!identifier || !identifier.includes("@")) {
        setUiError("Please enter a valid email address.");
        return;
      }
    }

    if (!password) {
      setUiError("Please enter your password.");
      return;
    }

    try {
      await loginWithPassword(identifier, password);
      setUiSuccess("Sign in successful! Opening your shop workspace...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid phone number/email or password.";
      setUiError(msg);
    }
  };

  return (
    <div className="w-full max-w-[440px] rounded-cards bg-[var(--surface-card)] p-6 sm:p-8 shadow-subtle-3 border border-[var(--border-hairline)]">
      {/* Header */}
      <div className="text-left mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral">
            <Storefront weight="fill" size={20} />
          </span>
          <span className="font-display font-extrabold text-[16px] text-heading-charcoal tracking-tight">
            Trackkit
          </span>
        </div>
        <h1 className="font-display text-[26px] sm:text-[28px] font-extrabold tracking-tight text-heading-charcoal">
          Sign in to your account
        </h1>
        <p className="text-[14px] text-muted-gray mt-1">
          Enter your login details to access your account
        </p>
      </div>

      {/* Notifications banner */}
      {uiError && (
        <div className="mb-4 rounded-xl bg-[var(--color-alert-red)]/10 border border-[var(--color-alert-red)]/30 p-3 flex items-start gap-2.5 text-[13px] text-[var(--color-alert-red)]">
          <Warning className="shrink-0 mt-0.5" size={17} weight="fill" />
          <span>{uiError}</span>
        </div>
      )}

      {uiSuccess && (
        <div className="mb-4 rounded-xl bg-[var(--color-grass-green)]/10 border border-[var(--color-grass-green)]/30 p-3 flex items-start gap-2.5 text-[13px] text-[var(--color-grass-green)]">
          <CheckCircle className="shrink-0 mt-0.5" size={17} weight="fill" />
          <span>{uiSuccess}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        {/* Toggle between Phone & Email */}
        <div className="flex items-center justify-between text-[13px] font-semibold text-body-brown mb-1">
          <span>{authMode === "phone" ? "Phone number" : "Email address"}</span>
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "phone" ? "email" : "phone");
              setUiError(null);
            }}
            className="text-[12px] font-bold text-[var(--color-hot-coral)] hover:underline cursor-pointer"
          >
            {authMode === "phone" ? "Use email instead" : "Use phone number instead"}
          </button>
        </div>

        {/* Identifier Input */}
        {authMode === "phone" ? (
          <div className="flex rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] overflow-hidden focus-within:border-[var(--color-hot-coral)] focus-within:ring-1 focus-within:ring-[var(--color-hot-coral)] transition-all">
            {/* Country flag / prefix selector */}
            <div className="relative flex items-center bg-[var(--surface-card-secondary)]/60 border-r border-[var(--border-hairline)] px-3 py-3">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-transparent text-[14px] font-extrabold text-heading-charcoal outline-none cursor-pointer pr-1 appearance-none"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07067634979"
              className="flex-1 bg-transparent px-3.5 py-3 text-[15px] font-semibold text-heading-charcoal outline-none placeholder:text-muted-gray/60"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] overflow-hidden focus-within:border-[var(--color-hot-coral)] focus-within:ring-1 focus-within:ring-[var(--color-hot-coral)] transition-all">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@gmail.com"
              className="w-full bg-transparent px-4 py-3 text-[15px] font-semibold text-heading-charcoal outline-none placeholder:text-muted-gray/60"
            />
          </div>
        )}

        {/* Password Input with Show/Hide toggle & Forgot password */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[13px] font-semibold text-body-brown">
            <span>Password</span>
            <button
              type="button"
              onClick={() => {
                setUiError("Password reset is ready. Enter any test password to continue or reset offline.");
              }}
              className="text-[12px] font-bold text-[var(--color-grass-green)] hover:underline cursor-pointer"
            >
              Forgot your password?
            </button>
          </div>

          <div className="relative flex items-center rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] overflow-hidden focus-within:border-[var(--color-hot-coral)] focus-within:ring-1 focus-within:ring-[var(--color-hot-coral)] transition-all">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="flex-1 bg-transparent px-4 py-3 text-[15px] font-semibold text-heading-charcoal outline-none placeholder:text-muted-gray/60 pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[13px] font-bold text-muted-gray hover:text-heading-charcoal cursor-pointer flex items-center gap-1 px-1 py-1"
            >
              {showPassword ? (
                <>
                  <EyeSlash size={16} /> Hide
                </>
              ) : (
                <>
                  <Eye size={16} /> Show
                </>
              )}
            </button>
          </div>
        </div>

        {/* Submit Primary Pill */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="monzo-pill w-full bg-ink-black py-3.5 text-[14px] font-extrabold text-[var(--color-ink-black-text)] hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {isLoading ? "Signing in..." : "Sign In"} <ArrowRight size={16} weight="bold" />
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <hr className="w-full border-t border-[var(--border-hairline)]" />
          <span className="absolute bg-[var(--surface-card)] px-3 text-[11px] font-bold uppercase tracking-wider text-muted-gray">
            or
          </span>
        </div>

        {/* Google Continue */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="monzo-pill flex w-full items-center justify-center gap-2.5 border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-3 text-[13px] font-bold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] disabled:opacity-50 transition-all cursor-pointer"
        >
          <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
          </svg>
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>
      </form>

      {/* Footer Registration Link */}
      <div className="mt-6 text-center text-[13px] text-muted-gray border-t border-[var(--border-hairline)] pt-4">
        <span>Don&rsquo;t have an account? </span>
        <Link
          href="/onboarding"
          className="font-bold text-[var(--color-hot-coral)] hover:underline"
        >
          Sign up / Get Started
        </Link>
      </div>
    </div>
  );
}
