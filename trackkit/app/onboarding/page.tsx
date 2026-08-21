"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Storefront,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Coins,
  TrendUp,
  Package,
  Plus,
  ShieldCheck,
  GoogleLogo,
  Phone,
  Buildings,
  User,
  MapPin,
  Tag,
  Check,
  Sparkle,
  Warning,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { useTrackkitStore } from "@/lib/store";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { NewProduct } from "@/lib/types";

const CATEGORIES = [
  "General Provisions & FMCG",
  "Groceries & Foodstuff",
  "Drinks & Cold Store",
  "Pharmacy & Cosmetics",
  "Fashion, Fabrics & Shoes",
  "Electronics & Gadgets",
  "Building Materials",
  "Other Retail Shop",
];

const POPULAR_MARKETS = [
  "Balogun Market, Lagos",
  "Makola Market, Accra",
  "Bodija Market, Ibadan",
  "Wuse Market, Abuja",
  "Tejuosho Market, Yaba",
  "Alaba International, Lagos",
  "Neighborhood Shop / Storefront",
];

const CURRENCIES = [
  { symbol: "₦", label: "Naira", country: "Nigeria" },
  { symbol: "₵", label: "Cedi", country: "Ghana" },
  { symbol: "$", label: "USD", country: "Global" },
  { symbol: "£", label: "GBP", country: "UK" },
  { symbol: "€", label: "EUR", country: "Europe" },
];

const UNITS = ["Carton", "Tin", "Bag", "Pack", "Box", "Crate", "Bottle", "Piece"];

function createEmojiSvgDataUrl(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#f4efe6"/><text x="50%" y="54%" font-size="64" dominant-baseline="middle" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const STARTER_PACK: NewProduct[] = [
  {
    name: "Peak Evaporated Milk (160g)",
    category: "Dairy",
    unit: "Tin",
    current_quantity: 24,
    cost_per_unit: 800,
    selling_price_per_unit: 950,
    low_stock_threshold: 5,
    image_url: createEmojiSvgDataUrl("🥛"),
  },
  {
    name: "Dangote Refined Sugar (1kg)",
    category: "Sugar/Flour",
    unit: "Bag",
    current_quantity: 12,
    cost_per_unit: 1200,
    selling_price_per_unit: 1500,
    low_stock_threshold: 4,
    image_url: createEmojiSvgDataUrl("🍚"),
  },
  {
    name: "Indomie Instant Noodles (Super Pack)",
    category: "FMCG",
    unit: "Carton",
    current_quantity: 15,
    cost_per_unit: 6800,
    selling_price_per_unit: 8000,
    low_stock_threshold: 3,
    image_url: createEmojiSvgDataUrl("🍜"),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { signInWithGoogle, requestOtp, isLoading: authLoading } = useAuth();
  const { addProduct } = useLocalInventory();

  // Zustand Store Setters
  const setShopNameStore = useTrackkitStore((s) => s.setShopName);
  const setTraderNameStore = useTrackkitStore((s) => s.setTraderName);
  const setMarketLocationStore = useTrackkitStore((s) => s.setMarketLocation);
  const setCategoryStore = useTrackkitStore((s) => s.setCategory);
  const setCurrencyStore = useTrackkitStore((s) => s.setCurrency);
  const setTargetMarginGoalStore = useTrackkitStore((s) => s.setTargetMarginGoal);
  const setDefaultLowStockThresholdStore = useTrackkitStore((s) => s.setDefaultLowStockThreshold);
  const setHasCompletedOnboardingStore = useTrackkitStore((s) => s.setHasCompletedOnboarding);

  // Wizard Step (1: Shop & Trader, 2: Financial Goals, 3: Starter Inventory, 4: Storage & Finish)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Shop & Identity
  const [shopName, setShopName] = useState("");
  const [traderName, setTraderName] = useState("");
  const [marketLocation, setMarketLocation] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Step 2: Currency & Goals
  const [currency, setCurrency] = useState("₦");
  const [targetMarginGoal, setTargetMarginGoal] = useState<number>(20);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // Step 3: Starter Inventory Mode
  const [inventoryMode, setInventoryMode] = useState<"custom" | "starter_pack" | "skip">("custom");
  const [customProductName, setCustomProductName] = useState("");
  const [customUnit, setCustomUnit] = useState("Carton");
  const [customCost, setCustomCost] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQuantity, setCustomQuantity] = useState("10");

  // Step 4: Auth & Completion State
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculated Margin for Custom Product Preview
  const marginPreview = useMemo(() => {
    const cost = Number(customCost);
    const price = Number(customPrice);
    const qty = Number(customQuantity) || 0;

    if (!cost || !price || cost <= 0 || price <= 0 || price <= cost) {
      if (cost > 0 && price > 0 && price <= cost) {
        return {
          profitPerUnit: price - cost,
          marginPercent: ((price - cost) / price) * 100,
          totalProfit: (price - cost) * qty,
          isLoss: true,
        };
      }
      return null;
    }

    const profitPerUnit = price - cost;
    const marginPercent = (profitPerUnit / price) * 100;
    const totalProfit = profitPerUnit * qty;

    return {
      profitPerUnit,
      marginPercent,
      totalProfit,
      isLoss: false,
    };
  }, [customCost, customPrice, customQuantity]);

  // Navigation Handlers with Step Validation
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setErrorMsg("Please enter your shop or stall name.");
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStep(3);
  };

  const handleStep3Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (inventoryMode === "custom" && customProductName.trim()) {
      if (!customCost || !customPrice) {
        setErrorMsg("Please enter both buying cost and selling price to calculate your profit margin.");
        return;
      }
    }
    setErrorMsg(null);
    setStep(4);
  };

  // Final Setup & Persistence
  const finalizeWorkspace = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save preferences to persistent store
      const trimmedShop = shopName.trim();
      const trimmedTrader = traderName.trim();
      const trimmedMarket = marketLocation.trim();

      setShopNameStore(trimmedShop);
      setTraderNameStore(trimmedTrader);
      setMarketLocationStore(trimmedMarket);
      setCategoryStore(category);
      setCurrencyStore(currency);
      setTargetMarginGoalStore(targetMarginGoal);
      setDefaultLowStockThresholdStore(lowStockThreshold);
      setHasCompletedOnboardingStore(true);

      // 2. Insert Starter Products into local SQLite if chosen
      if (inventoryMode === "custom" && customProductName.trim()) {
        await addProduct({
          name: customProductName.trim(),
          category: category.split(" ")[0] || "General",
          unit: customUnit,
          current_quantity: Math.max(0, Number(customQuantity) || 1),
          cost_per_unit: Number(customCost) || null,
          selling_price_per_unit: Number(customPrice) || null,
          low_stock_threshold: lowStockThreshold,
        });
      } else if (inventoryMode === "starter_pack") {
        for (const item of STARTER_PACK) {
          await addProduct(item);
        }
      }

      // 3. Redirect into workspace
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error setting up shop inventory.";
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignInAndFinish = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      // Save local preferences before redirecting to Google OAuth
      setShopNameStore(shopName.trim());
      setTraderNameStore(traderName.trim());
      setMarketLocationStore(marketLocation.trim());
      setCategoryStore(category);
      setCurrencyStore(currency);
      setTargetMarginGoalStore(targetMarginGoal);
      setDefaultLowStockThresholdStore(lowStockThreshold);
      setHasCompletedOnboardingStore(true);

      if (inventoryMode === "custom" && customProductName.trim()) {
        await addProduct({
          name: customProductName.trim(),
          category: category.split(" ")[0] || "General",
          unit: customUnit,
          current_quantity: Math.max(0, Number(customQuantity) || 1),
          cost_per_unit: Number(customCost) || null,
          selling_price_per_unit: Number(customPrice) || null,
          low_stock_threshold: lowStockThreshold,
        });
      } else if (inventoryMode === "starter_pack") {
        for (const item of STARTER_PACK) {
          await addProduct(item);
        }
      }

      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not complete Google Sign-In.";
      setErrorMsg(msg);
      setGoogleLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }
    setErrorMsg(null);
    try {
      let formattedPhone = phoneInput.trim();
      if (!formattedPhone.startsWith("+")) {
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+234" + formattedPhone.slice(1);
        } else {
          formattedPhone = "+" + formattedPhone;
        }
      }
      await requestOtp(formattedPhone);
      setPhoneSubmitted(true);
      await finalizeWorkspace();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not request SMS code.";
      setErrorMsg(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="mx-auto w-full max-w-2xl flex items-center justify-between py-2">
        <Link href="/welcome" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral">
            <Storefront weight="fill" size={19} />
          </span>
          <span className="font-display text-[21px] font-extrabold text-heading-charcoal tracking-tight">
            Trackkit
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[12px] font-semibold text-muted-gray">
            Step {step} of 4
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Card */}
      <main className="mx-auto w-full max-w-2xl my-auto py-6">
        <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-subtle-3">
          {/* Progress Breadcrumbs */}
          <div className="mb-6 border-b border-[var(--border-hairline)] pb-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 1, label: "Shop Profile" },
                { id: 2, label: "Currency & Goals" },
                { id: 3, label: "Starter Products" },
                { id: 4, label: "Backup & Finish" },
              ].map((s) => {
                const isCurrent = step === s.id;
                const isPast = step > s.id;
                return (
                  <div key={s.id} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="flex items-center gap-1.5 w-full">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                          isCurrent
                            ? "bg-[var(--color-hot-coral)] text-white ring-2 ring-[var(--color-hot-coral)]/30"
                            : isPast
                            ? "bg-[var(--color-grass-green)] text-white"
                            : "bg-[var(--surface-canvas)] text-muted-gray border border-[var(--border-hairline)]"
                        }`}
                      >
                        {isPast ? <Check size={13} weight="bold" /> : s.id}
                      </span>
                      <div
                        className={`hidden sm:block h-1 flex-1 rounded-full ${
                          isPast
                            ? "bg-[var(--color-grass-green)]"
                            : isCurrent
                            ? "bg-[var(--color-hot-coral)]/40"
                            : "bg-[var(--border-hairline)]"
                        }`}
                      />
                    </div>
                    <span
                      className={`mt-1.5 text-[11px] font-semibold truncate w-full ${
                        isCurrent
                          ? "text-heading-charcoal font-bold"
                          : isPast
                          ? "text-body-brown"
                          : "text-muted-gray"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-[var(--color-alert-red)]/30 bg-[var(--color-alert-red)]/10 p-3 text-[13px] text-[var(--color-alert-red)]">
              <Warning size={18} weight="fill" className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: SHOP & TRADER IDENTITY ================= */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-5">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-heading-charcoal">
                  Tell us about your business
                </h2>
                <p className="mt-1 text-[13px] text-muted-gray">
                  Set up your shop identity so Trackkit and your AI Copilot understand your operations.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-body-brown mb-1.5">
                  Shop or Stall Name <span className="text-[var(--color-alert-red)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Mama Ngozi Provisions, Amina Cold Stores"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-3 pl-10 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                  />
                  <Buildings size={18} className="absolute left-3 top-3.5 text-muted-gray" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-body-brown mb-1.5">
                  Your Name / Trader Name <span className="text-[11px] font-normal text-muted-gray">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={traderName}
                    onChange={(e) => setTraderName(e.target.value)}
                    placeholder="e.g. Mama Ngozi, Amara, Kofi"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-3 pl-10 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                  />
                  <User size={18} className="absolute left-3 top-3.5 text-muted-gray" />
                </div>
                <p className="mt-1 text-[11px] text-muted-gray">
                  Used for personalized daily greetings and custom copilot recommendations.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-body-brown mb-1.5">
                  Market Location
                </label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={marketLocation}
                    onChange={(e) => setMarketLocation(e.target.value)}
                    placeholder="e.g. Balogun Market, Lagos or Enter custom location"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-3 pl-10 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                  />
                  <MapPin size={18} className="absolute left-3 top-3.5 text-muted-gray" />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_MARKETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarketLocation(m)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                        marketLocation === m
                          ? "bg-ink-black text-[var(--color-ink-black-text)] border-ink-black"
                          : "bg-[var(--surface-canvas)] text-muted-gray border-[var(--border-hairline)] hover:text-heading-charcoal"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-body-brown mb-1.5">
                  Primary Retail Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-[var(--color-link-blue)] bg-[var(--color-link-blue)]/10 text-heading-charcoal font-semibold shadow-sm"
                            : "border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-muted-gray hover:text-heading-charcoal"
                        }`}
                      >
                        <Tag size={16} className={isSelected ? "text-[var(--color-link-blue)]" : "text-muted-gray"} />
                        <span className="text-[13px]">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-buttons bg-ink-black py-3.5 text-[15px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 cursor-pointer transition-opacity"
                >
                  Continue to Currency & Goals <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: CURRENCY & BENCHMARKS ================= */}
          {step === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-6">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-heading-charcoal">
                  Currency & Profit Benchmarks
                </h2>
                <p className="mt-1 text-[13px] text-muted-gray">
                  Configure how Trackkit calculates your margins, low-stock warnings, and prices.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-body-brown mb-2">
                  Primary Currency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {CURRENCIES.map((c) => {
                    const isSelected = currency === c.symbol;
                    return (
                      <button
                        key={c.symbol}
                        type="button"
                        onClick={() => setCurrency(c.symbol)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[var(--color-link-blue)] bg-[var(--color-link-blue)]/10 text-heading-charcoal font-bold shadow-sm"
                            : "border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-muted-gray hover:text-heading-charcoal"
                        }`}
                      >
                        <span className="text-[22px] font-bold">{c.symbol}</span>
                        <span className="text-[12px] font-semibold">{c.label}</span>
                        <span className="text-[10px] text-muted-gray">{c.country}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[13px] font-semibold text-body-brown">
                    Target Profit Margin Goal
                  </label>
                  <span className="text-[13px] font-bold text-[var(--color-grass-green)]">
                    {targetMarginGoal}% Margin Goal
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[15, 20, 25, 30, 40].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setTargetMarginGoal(goal)}
                      className={`rounded-xl border py-2.5 text-[13px] font-semibold cursor-pointer transition-all ${
                        targetMarginGoal === goal
                          ? "border-[var(--color-grass-green)] bg-[var(--color-grass-green)]/15 text-heading-charcoal"
                          : "border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-muted-gray hover:text-heading-charcoal"
                      }`}
                    >
                      {goal}%
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-muted-gray">
                  Products yielding at least <strong className="text-heading-charcoal">{targetMarginGoal}%</strong> margin will receive a healthy green badge on your dashboard.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[13px] font-semibold text-body-brown">
                    Default Low Stock Warning Threshold
                  </label>
                  <span className="text-[13px] font-bold text-[var(--color-alert-red)]">
                    {lowStockThreshold} units
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 10, 20].map((threshold) => (
                    <button
                      key={threshold}
                      type="button"
                      onClick={() => setLowStockThreshold(threshold)}
                      className={`rounded-xl border py-2.5 text-[13px] font-semibold cursor-pointer transition-all ${
                        lowStockThreshold === threshold
                          ? "border-[var(--color-alert-red)] bg-[var(--color-alert-red)]/10 text-heading-charcoal"
                          : "border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-muted-gray hover:text-heading-charcoal"
                      }`}
                    >
                      {threshold} units
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-muted-gray">
                  Trackkit will alert you before best sellers run out so you can restock in time.
                </p>
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-buttons bg-ink-black py-3.5 text-[15px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 cursor-pointer transition-opacity"
                >
                  Continue to Starter Inventory <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: STARTER INVENTORY & LIVE MARGIN ================= */}
          {step === 3 && (
            <form onSubmit={handleStep3Next} className="space-y-6">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-heading-charcoal">
                  Add Your Starter Inventory
                </h2>
                <p className="mt-1 text-[13px] text-muted-gray">
                  Experience instant profit margin calculations and stock visibility right away.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-2 border-b border-[var(--border-hairline)] pb-4">
                <button
                  type="button"
                  onClick={() => setInventoryMode("custom")}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition-all cursor-pointer ${
                    inventoryMode === "custom"
                      ? "border border-[var(--color-link-blue)] bg-[var(--color-link-blue)]/10 text-heading-charcoal font-semibold"
                      : "border border-transparent text-muted-gray hover:bg-[var(--surface-canvas)]"
                  }`}
                >
                  <Plus size={18} className={inventoryMode === "custom" ? "text-[var(--color-link-blue)]" : "text-muted-gray"} />
                  <span className="text-[12px]">Add 1st Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInventoryMode("starter_pack")}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition-all cursor-pointer ${
                    inventoryMode === "starter_pack"
                      ? "border border-[var(--color-grass-green)] bg-[var(--color-grass-green)]/10 text-heading-charcoal font-semibold"
                      : "border border-transparent text-muted-gray hover:bg-[var(--surface-canvas)]"
                  }`}
                >
                  <Package size={18} className={inventoryMode === "starter_pack" ? "text-[var(--color-grass-green)]" : "text-muted-gray"} />
                  <span className="text-[12px]">Market Starter Pack</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInventoryMode("skip")}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition-all cursor-pointer ${
                    inventoryMode === "skip"
                      ? "border border-ink-black bg-ink-black/10 text-heading-charcoal font-semibold"
                      : "border border-transparent text-muted-gray hover:bg-[var(--surface-canvas)]"
                  }`}
                >
                  <Sparkle size={18} className={inventoryMode === "skip" ? "text-heading-charcoal" : "text-muted-gray"} />
                  <span className="text-[12px]">Skip & Start Fresh</span>
                </button>
              </div>

              {/* MODE 1: CUSTOM PRODUCT WITH LIVE MARGIN CALCULATION */}
              {inventoryMode === "custom" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[13px] font-semibold text-body-brown mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                        placeholder="e.g. Peak Milk, Dangote Sugar, Milo"
                        className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-body-brown mb-1">
                        Unit
                      </label>
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[13px] font-semibold text-body-brown mb-1">
                        Buying Cost ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={customCost}
                        onChange={(e) => setCustomCost(e.target.value)}
                        placeholder="e.g. 800"
                        className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-body-brown mb-1">
                        Selling Price ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-body-brown mb-1">
                        Initial Stock Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        placeholder="e.g. 24"
                        className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-4 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                      />
                    </div>
                  </div>

                  {/* Interactive Live Margin Preview Badge */}
                  {marginPreview && (
                    <div
                      className={`rounded-xl border p-4 transition-all ${
                        marginPreview.isLoss
                          ? "border-[var(--color-alert-red)]/40 bg-[var(--color-alert-red)]/10"
                          : marginPreview.marginPercent >= targetMarginGoal
                          ? "border-[var(--color-grass-green)]/40 bg-[var(--color-grass-green)]/10"
                          : "border-[var(--color-warm-orange)]/40 bg-[var(--color-warm-orange)]/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendUp
                            size={20}
                            weight="bold"
                            className={
                              marginPreview.isLoss
                                ? "text-[var(--color-alert-red)]"
                                : marginPreview.marginPercent >= targetMarginGoal
                                ? "text-[var(--color-grass-green)]"
                                : "text-[var(--color-warm-orange)]"
                            }
                          />
                          <span className="text-[14px] font-bold text-heading-charcoal">
                            Live Margin Calculation
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-3 py-0.5 text-[12px] font-bold ${
                            marginPreview.isLoss
                              ? "bg-[var(--color-alert-red)] text-white"
                              : marginPreview.marginPercent >= targetMarginGoal
                              ? "bg-[var(--color-grass-green)] text-white"
                              : "bg-[var(--color-warm-orange)] text-white"
                          }`}
                        >
                          {marginPreview.marginPercent.toFixed(1)}% Margin
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                        <div>
                          <span className="text-muted-gray">Profit per {customUnit}:</span>{" "}
                          <strong className="text-heading-charcoal">
                            {currency}
                            {marginPreview.profitPerUnit.toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span className="text-muted-gray">Batch Profit ({customQuantity} {customUnit}s):</span>{" "}
                          <strong className="text-heading-charcoal">
                            {currency}
                            {marginPreview.totalProfit.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: POPULAR STARTER PACK */}
              {inventoryMode === "starter_pack" && (
                <div className="space-y-3">
                  <p className="text-[13px] text-body-brown">
                    We will pre-populate 3 common market items with realistic Nigerian baseline pricing:
                  </p>
                  <div className="space-y-2">
                    {STARTER_PACK.map((item) => {
                      const cost = item.cost_per_unit || 0;
                      const price = item.selling_price_per_unit || 0;
                      const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0.0";
                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-3"
                        >
                          <div>
                            <p className="text-[14px] font-semibold text-heading-charcoal">{item.name}</p>
                            <p className="text-[12px] text-muted-gray">
                              {item.current_quantity} {item.unit}s · Cost: {currency}{cost.toLocaleString()} · Sell: {currency}{price.toLocaleString()}
                            </p>
                          </div>
                          <span className="rounded-full bg-[var(--color-grass-green)]/15 px-2.5 py-1 text-[11px] font-bold text-[var(--color-grass-green)]">
                            +{margin}% Margin
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE 3: SKIP */}
              {inventoryMode === "skip" && (
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-5 text-center">
                  <Package size={32} className="mx-auto text-muted-gray mb-2" />
                  <p className="text-[15px] font-semibold text-heading-charcoal">Start with an empty inventory</p>
                  <p className="mt-1 text-[12px] text-muted-gray">
                    You can quickly add products or import CSV files at any time directly from the dashboard.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center justify-center gap-1.5 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-5 py-3 text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-buttons bg-ink-black py-3.5 text-[15px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 cursor-pointer transition-opacity"
                >
                  Continue to Backup Options <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 4: STORAGE & CLOUD BACKUP ================= */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-heading-charcoal">
                  Storage & Backup Preferences
                </h2>
                <p className="mt-1 text-[13px] text-muted-gray">
                  Choose how you want to access and protect your shop data.
                </p>
              </div>

              {/* Summary of what will be configured */}
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-gray">
                  Your Configuration Summary
                </p>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <span className="text-muted-gray">Shop:</span>{" "}
                    <strong className="text-heading-charcoal">{shopName || "My Retail Shop"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-gray">Trader:</span>{" "}
                    <strong className="text-heading-charcoal">{traderName || "Shop Owner"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-gray">Location:</span>{" "}
                    <strong className="text-heading-charcoal">{marketLocation || "West Africa"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-gray">Currency & Goal:</span>{" "}
                    <strong className="text-heading-charcoal">{currency} ({targetMarginGoal}% Goal)</strong>
                  </div>
                </div>
              </div>

              {/* OPTION 1: 100% OFFLINE-FIRST (INSTANT START) */}
              <div className="rounded-2xl border-2 border-ink-black bg-[var(--surface-card)] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink-black text-[var(--color-ink-black-text)]">
                      <Storefront size={18} weight="fill" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-bold text-heading-charcoal">
                        100% Offline Mode (Instant Start)
                      </h3>
                      <p className="text-[12px] text-muted-gray">
                        No password, no email, and zero internet required.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--color-grass-green)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-grass-green)]">
                    Recommended
                  </span>
                </div>

                <p className="text-[12px] text-body-brown leading-relaxed">
                  Your entire product catalog, transactions, and margins will be stored securely on your phone&rsquo;s local storage. You can back up to CSV or connect cloud sync whenever you wish.
                </p>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={finalizeWorkspace}
                  className="flex w-full items-center justify-center gap-2 rounded-buttons bg-ink-black py-3.5 text-[15px] font-bold text-[var(--color-ink-black-text)] hover:opacity-90 cursor-pointer transition-opacity"
                >
                  {isSubmitting ? "Launching Shop..." : "Start Using Trackkit Now"} <CheckCircle size={18} weight="fill" />
                </button>
              </div>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[var(--border-hairline)]" />
                <span className="absolute bg-[var(--surface-card)] px-3 text-[11px] font-semibold text-muted-gray uppercase">
                  or connect cloud backup
                </span>
              </div>

              {/* OPTION 2: GOOGLE SIGN-IN */}
              <button
                type="button"
                disabled={googleLoading || isSubmitting}
                onClick={handleGoogleSignInAndFinish}
                className="flex w-full items-center justify-center gap-3 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-3 px-4 text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
              >
                <GoogleLogo size={20} weight="bold" className="text-red-500" />
                {googleLoading ? "Connecting to Google..." : "Connect Google Account for Cloud Sync"}
              </button>

              {/* OPTION 3: PHONE NUMBER BACKUP */}
              <form onSubmit={handlePhoneSubmit} className="space-y-2">
                <label className="block text-[12px] font-semibold text-body-brown">
                  Or Save with Mobile Number (SMS OTP)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2.5 pl-9 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                    />
                    <Phone size={16} className="absolute left-3 top-3 text-muted-gray" />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading || isSubmitting}
                    className="rounded-buttons bg-[var(--surface-card-secondary)] border border-[var(--border-hairline)] px-4 py-2.5 text-[13px] font-semibold text-heading-charcoal hover:opacity-90 cursor-pointer"
                  >
                    Send OTP & Start
                  </button>
                </div>
              </form>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center justify-center gap-1.5 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-5 py-2.5 text-[13px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
                >
                  <ArrowLeft size={15} /> Back to Products
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-2xl text-center py-4 text-[12px] text-muted-gray">
        Trackkit Offline-First Retail Workspace · Designed for West African markets.
      </footer>
    </div>
  );
}
