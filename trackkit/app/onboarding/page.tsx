"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Storefront,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Phone,
  Lock,
  GoogleLogo,
  CurrencyNgn,
  Tag,
  Buildings,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { useTrackkitStore } from "@/lib/store";
import { ThemeToggle } from "@/components/ThemeToggle";

const CATEGORIES = [
  "General Provisions",
  "Supermarket / Grocery",
  "Electronics & Gadgets",
  "Fashion & Clothing",
  "Pharmacy & Cosmetics",
  "Building Materials",
  "Other Retail Shop",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { signInWithGoogle, requestOtp, verifyOtp, isLoading } = useAuth();

  const setShopNameStore = useTrackkitStore((s) => s.setShopName);
  const setCurrencyStore = useTrackkitStore((s) => s.setCurrency);

  // Wizard Step: 1 = Auth Setup, 2 = Shop Setup
  const [step, setStep] = useState<1 | 2>(1);

  // Form State - Step 1
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State - Step 2
  const [shopName, setShopName] = useState("");
  const [currency, setCurrency] = useState("₦");
  const [category, setCategory] = useState("General Provisions");

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not complete Google Sign-In.";
      setErrorMsg(msg);
      setGoogleLoading(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) {
      setErrorMsg("Please enter your email or phone number.");
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setErrorMsg("Please enter a shop name.");
      return;
    }

    setShopNameStore(shopName.trim());
    setCurrencyStore(currency);

    // Redirect to main workspace
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="mx-auto w-full max-w-xl flex items-center justify-between py-2">
        <Link href="/welcome" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-black text-[var(--color-ink-black-text)] shadow-sm">
            <Storefront weight="fill" size={18} />
          </span>
          <span className="font-display text-[20px] font-bold text-heading-charcoal">
            Trackkit
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Card */}
      <main className="mx-auto w-full max-w-xl my-auto py-8">
        <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-lg">
          {/* Progress Indicator */}
          <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                  step === 1
                    ? "bg-ink-black text-[var(--color-ink-black-text)]"
                    : "bg-[var(--color-grass-green)] text-white"
                }`}
              >
                {step > 1 ? <CheckCircle size={16} weight="fill" /> : "1"}
              </span>
              <span className="text-[13px] font-semibold text-heading-charcoal">
                Account Setup
              </span>
            </div>

            <div className="h-0.5 w-8 bg-[var(--border-hairline)]" />

            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                  step === 2
                    ? "bg-ink-black text-[var(--color-ink-black-text)]"
                    : "bg-[var(--surface-canvas)] text-muted-gray border border-[var(--border-hairline)]"
                }`}
              >
                2
              </span>
              <span className="text-[13px] font-semibold text-heading-charcoal">
                Shop Details
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-[var(--color-alert-red)]/30 bg-[var(--color-alert-red)]/10 p-3 text-[13px] text-[var(--color-alert-red)]">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Authentication */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[22px] font-bold text-heading-charcoal">Create Your Account</h2>
                <p className="mt-1 text-[13px] text-muted-gray">
                  Sign in or create an account to back up your shop inventory.
                </p>
              </div>

              {/* Google Sign In Pathway */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-3 px-4 text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
              >
                <GoogleLogo size={20} weight="bold" className="text-red-500" />
                {googleLoading ? "Connecting to Google..." : "Continue with Google"}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[var(--border-hairline)]" />
                <span className="absolute bg-[var(--surface-card)] px-3 text-[11px] font-semibold text-muted-gray uppercase">
                  or sign up with email/phone
                </span>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-body-brown mb-1">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="e.g. mama@ngozi.com or +2348012345678"
                      className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-3 pl-10 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                    />
                    <Phone size={18} className="absolute left-3 top-3.5 text-muted-gray" />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-body-brown mb-1">
                    Password (Optional for local mode)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-3 pl-10 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                    />
                    <Lock size={18} className="absolute left-3 top-3.5 text-muted-gray" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-buttons bg-ink-black py-3.5 text-[15px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 cursor-pointer transition-opacity"
                >
                  Continue to Shop Setup <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Shop Customization */}
          {step === 2 && (
            <form onSubmit={handleCompleteOnboarding} className="space-y-6">
              <div>
                <h2 className="text-[22px] font-bold text-heading-charcoal">Configure Your Shop</h2>
                <p className="mt-1 text-[13px] text-muted-gray">
                  Set up your business identity and currency for daily calculations.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-body-brown mb-1">
                  Shop Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Mama Ngozi Provisions"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-3 pl-10 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                  />
                  <Buildings size={18} className="absolute left-3 top-3.5 text-muted-gray" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-body-brown mb-1">
                  Primary Currency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { symbol: "₦", label: "Naira" },
                    { symbol: "$", label: "USD" },
                    { symbol: "£", label: "GBP" },
                    { symbol: "€", label: "EUR" },
                  ].map((c) => (
                    <button
                      key={c.symbol}
                      type="button"
                      onClick={() => setCurrency(c.symbol)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 cursor-pointer transition-all ${
                        currency === c.symbol
                          ? "border-[var(--color-link-blue)] bg-[var(--color-link-blue)]/10 text-heading-charcoal font-bold"
                          : "border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-muted-gray hover:text-heading-charcoal"
                      }`}
                    >
                      <span className="text-[20px] font-bold">{c.symbol}</span>
                      <span className="text-[11px] font-medium">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-body-brown mb-1">
                  Retail Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-3 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)] cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-5 py-3 text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-buttons bg-[var(--color-grass-green)] py-3 text-[15px] font-bold text-white hover:opacity-90 cursor-pointer transition-opacity"
                >
                  Open My Inventory <CheckCircle size={18} weight="fill" />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-xl text-center py-4 text-[12px] text-muted-gray">
        Trackkit Offline-First Retail Workspace · All data saved locally on this device.
      </footer>
    </div>
  );
}
