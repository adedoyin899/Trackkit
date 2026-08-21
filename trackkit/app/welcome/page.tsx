"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Storefront,
  Lightning,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Package,
  Minus,
  Plus,
  Star,
  CaretDown,
  CaretUp,
  Receipt,
  UserCheck,
  Sliders,
  Sparkle,
  TrendUp,
} from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "Do I need internet to use Trackkit?",
    a: "No. Trackkit works 100% offline. You can add products, record sales, adjust prices, and check profit margins with zero internet connection. When your phone reconnects, your records sync automatically to the cloud.",
  },
  {
    q: "What if my phone gets lost or damaged?",
    a: "Your records are never lost. With cloud sync enabled, your inventory data is securely backed up. Simply log in on any new device and your entire catalog, prices, and sales history will be restored instantly.",
  },
  {
    q: "Is Trackkit really free?",
    a: "Yes. The Starter tier is completely free forever with no credit card required. You can add unlimited products, track daily stock, and receive low-stock alerts. Pro (₦500/month) unlocks advanced supplier margin tracking and cross-device sync.",
  },
  {
    q: "How long does setup take?",
    a: "Less than 3 minutes. Download or open the app, choose your market currency, add a few starter items with 1 click, and you're ready to start logging sales.",
  },
  {
    q: "Can my shop assistant or partner use it too?",
    a: "Yes. With cloud sync, multiple devices can access and update the same store inventory, keeping everyone in sync without paper logbooks.",
  },
  {
    q: "How are my profit margins calculated?",
    a: "Trackkit automatically calculates your exact gross margin percentage and cash profit per unit by comparing your supplier cost price against your retail selling price in real time.",
  },
];

const TRADER_STORIES = [
  {
    id: "akosua",
    name: "Akosua Mensah",
    shop: "Akosua's Spices & Provisions",
    location: "Makola Market · Accra, Ghana",
    image: "/images/trader-akosua.jpg",
    headline: "“I raised my milk price by ₦40 and made ₦12,000 extra this month.”",
    story:
      "I was selling milk at 1.25% margin for years without knowing. Trackkit showed me my profit percentages in bright green and red. I adjusted my prices immediately and didn’t lose a single customer.",
    metricValue: "+₦12,000",
    metricLabel: "Extra Monthly Profit",
    category: "Spices & Provisions",
  },
  {
    id: "amara",
    name: "Amara Okafor",
    shop: "Adesola Wholesale & Retail",
    location: "Balogun Market · Lagos, Nigeria",
    image: "/images/trader-amara.jpg",
    headline: "“I stopped restocking slow items and boosted my weekly cash by ₦18,500.”",
    story:
      "Before Trackkit, I tied up ₦150,000 in slow-moving snacks that barely made ₦20 profit. The Margin Pulse screen made it obvious where my capital was trapped. Now I only restock high-velocity goods.",
    metricValue: "+₦18,500",
    metricLabel: "Weekly Cashflow Boost",
    category: "FMCG & Groceries",
  },
  {
    id: "zainab",
    name: "Zainab Bello",
    shop: "Kano Grains & Spices Depot",
    location: "Central Market · Kumasi, Ghana",
    image: "/images/trader-zainab.jpg",
    headline: "“Zero stockouts on my top spices since I turned on low-stock alerts.”",
    story:
      "My biggest loss used to be running out of stock on busy Saturdays. Trackkit alerts me 3 days ahead before inventory dips below my threshold. My weekend revenue went up over 25%.",
    metricValue: "0 Stockouts",
    metricLabel: "Across 40+ Top Sellers",
    category: "Grains & Spices",
  },
];

export default function WelcomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeNavTab, setActiveNavTab] = useState<string>("inventory");

  // Interactive Live Stepper Demo state
  const [demoStockMilk, setDemoStockMilk] = useState(14);
  const [demoSalesCount, setDemoSalesCount] = useState(6);

  // Streamlined Margin Calculator state
  const [calcCost, setCalcCost] = useState<number>(800);
  const [calcSelling, setCalcSelling] = useState<number>(1200);
  const [selectedProductPreset, setSelectedProductPreset] = useState<string>("rice");

  const calcProfit = calcSelling - calcCost;
  const calcMarginPct = calcSelling > 0 ? Math.round((calcProfit / calcSelling) * 100) : 0;

  const handleSelectPreset = (preset: string) => {
    setSelectedProductPreset(preset);
    if (preset === "milk") {
      setCalcCost(800);
      setCalcSelling(810);
    } else if (preset === "sugar") {
      setCalcCost(500);
      setCalcSelling(750);
    } else if (preset === "noodles") {
      setCalcCost(350);
      setCalcSelling(500);
    } else if (preset === "rice") {
      setCalcCost(1200);
      setCalcSelling(1600);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-heading-charcoal font-sans selection:bg-[var(--color-hot-coral)] selection:text-white">
      {/* MONZO-STYLE STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 md:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral group-hover:scale-105 transition-transform">
                <Storefront weight="fill" size={22} />
              </span>
              <span className="font-display text-[22px] font-extrabold tracking-tight text-heading-charcoal">
                Trackkit
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <a
                href="#features"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Features
              </a>
              <a
                href="#margin-reality"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Margin Engine
              </a>
              <a
                href="#stories"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Trader Stories
              </a>
              <a
                href="#pricing"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                FAQ
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex text-[14px] font-bold text-body-brown hover:text-heading-charcoal transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="monzo-pill flex items-center gap-1.5 bg-ink-black px-5 py-2.5 text-[13px] font-extrabold text-[var(--color-ink-black-text)] hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              Get Started Free <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. PEOPLE-ORIENTED HERO SECTION WITH FLOATING ANIMATED IN-PRODUCT CARDS */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-18 sm:pb-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-grass-green)]/30 bg-[var(--color-grass-green)]/10 px-4 py-1.5 text-[13px] font-extrabold text-[var(--color-grass-green)] shadow-2xs">
                <Lightning weight="fill" size={15} />
                100% Offline Retail Copilot
              </div>

              <h1 className="font-display text-[42px] sm:text-[56px] lg:text-[62px] font-extrabold leading-[1.04] tracking-[-0.045em] text-heading-charcoal">
                Know Your Stock. <br />
                Protect Your Profit. <br />
                <span className="text-[var(--color-hot-coral)]">Offline Always.</span>
              </h1>

              <p className="text-[17px] sm:text-[19px] text-body-brown leading-relaxed max-w-xl">
                The smart inventory copilot built for African retail shops. See exact product profit margins, prevent costly stockouts, and manage daily sales with zero internet.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/onboarding"
                  id="download"
                  className="monzo-pill flex items-center justify-center gap-2 bg-[var(--color-hot-coral)] px-8 py-3.5 text-[15px] font-extrabold text-white shadow-coral hover:opacity-95 transition-all cursor-pointer text-center"
                >
                  Get Started Free <ArrowRight size={17} weight="bold" />
                </Link>
                <Link
                  href="/"
                  className="monzo-pill flex items-center justify-center gap-2 border border-[var(--border-hairline)] bg-[var(--surface-card)] px-6 py-3.5 text-[14px] font-bold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors cursor-pointer text-center shadow-xs"
                >
                  Open Live Workspace Demo
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-[13px] font-semibold text-muted-gray pt-3">
                <span className="flex items-center gap-1.5">
                  <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Free forever starter plan
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck weight="fill" className="text-[var(--color-link-blue)]" /> Zero data connection needed
                </span>
                <span className="flex items-center gap-1.5">
                  <Star weight="fill" className="text-[var(--color-gold)]" /> 2,000+ market traders
                </span>
              </div>
            </div>

            {/* Hero Right: High-Res Real Trader Photograph + Floating Animated Cards */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg">
                {/* Backdrop Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--color-hot-coral)]/20 to-[var(--color-grass-green)]/20 rounded-3xl blur-2xl -z-10" />

                {/* Primary Lifestyle Image Container */}
                <div className="relative h-[380px] sm:h-[460px] w-full rounded-[28px] overflow-hidden border border-[var(--border-hairline)] shadow-2xl">
                  <Image
                    src="/images/hero-market-trader.jpg"
                    alt="Adesola in her modern retail shop in Lagos"
                    fill
                    priority
                    className="object-cover"
                  />
                  {/* Subtle dark gradient overlay at bottom for clarity */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Location badge on photo */}
                  <div className="absolute bottom-4 left-5 text-white">
                    <span className="inline-block rounded-full bg-[var(--color-hot-coral)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                      Balogun Market · Lagos
                    </span>
                    <p className="font-display text-[17px] font-extrabold">Adesola Provisions & Goods</p>
                  </div>
                </div>

                {/* Floating Card 1: Monzo Hot Coral Sunset Balance Card (Animated Float) */}
                <div className="animate-float absolute -top-5 -left-4 sm:-left-8 w-[220px] sm:w-[240px] monzo-coral-card p-4 rounded-2xl shadow-coral text-white z-20 border border-white/20">
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-90 mb-1">
                    <span>SHOP VALUATION</span>
                    <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[9px] uppercase font-extrabold">Live</span>
                  </div>
                  <p className="numo-display text-[22px] font-extrabold text-white">
                    ₦1,042,500
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="monzo-pill bg-white text-[#091723] text-[10px] font-extrabold px-2.5 py-0.5 shadow-xs">
                      + Restock
                    </span>
                    <span className="monzo-pill bg-black/25 text-white text-[10px] font-bold px-2 py-0.5">
                      Log Sale
                    </span>
                  </div>
                </div>

                {/* Floating Card 2: Live Margin & Sales Badge (Animated Float Reverse) */}
                <div className="animate-float-reverse absolute -bottom-5 -right-4 sm:-right-6 w-[230px] sm:w-[250px] rounded-2xl bg-[var(--surface-card)]/95 backdrop-blur-md p-3.5 shadow-xl border border-[var(--border-hairline)] z-20">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-grass-green)]/15 text-[16px]">
                      🍚
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-heading-charcoal truncate">Dangote Sugar (500g)</p>
                      <p className="text-[11px] font-extrabold text-[var(--color-grass-green)]">
                        +50% Margin · ₦750 Price
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 3: 100% Offline Indicator */}
                <div className="absolute top-4 right-4 rounded-full bg-[#091723]/80 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold text-white flex items-center gap-1.5 shadow-lg border border-white/10 z-10">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-grass-green)] animate-pulse" />
                  100% Offline Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. "TELL ME ABOUT..." INTERACTIVE PILL NAVIGATION (Monzo Signature Feature) */}
      {/* ========================================================================= */}
      <section className="py-10 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-[22px] sm:text-[24px] font-extrabold text-heading-charcoal tracking-tight">
              Tell me about...
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "inventory", label: "📦 Inventory Tracking", target: "#features" },
                { id: "margins", label: "💰 Margin Engine", target: "#margin-reality" },
                { id: "stories", label: "💬 Trader Stories", target: "#stories" },
                { id: "pricing", label: "🏷️ Transparent Pricing", target: "#pricing" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={item.target}
                  onClick={() => setActiveNavTab(item.id)}
                  className={`monzo-pill px-4 py-2 text-[13px] font-extrabold transition-all cursor-pointer ${
                    activeNavTab === item.id
                      ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-xs"
                      : "bg-[var(--surface-card-secondary)] text-heading-charcoal hover:bg-[var(--border-hairline)]"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SIMPLIFIED, PUNCHY MARGIN COMPARISON SECTION (Easy to digest & scroll) */}
      {/* ========================================================================= */}
      <section id="margin-reality" className="py-16 sm:py-20 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          {/* Section Heading */}
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-10">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              The Reality of Retail Trading
            </span>
            <h2 className="font-display text-[32px] sm:text-[44px] font-extrabold tracking-tight text-heading-charcoal">
              The 1% Margin Trap vs. The 50% Profit Engine
            </h2>
            <p className="text-[15px] sm:text-[17px] text-body-brown leading-relaxed">
              Not all fast-moving items make you money. Trackkit instantly reveals which products actually pay your bills.
            </p>
          </div>

          {/* Clean 2-Column Visual Contrast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* Milk Trap */}
            <div className="interactive-card rounded-2xl border border-[var(--color-alert-red)]/30 bg-[var(--surface-card)] p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-[24px]">🥛</span>
                  <div>
                    <h3 className="font-display text-[17px] font-extrabold text-heading-charcoal">
                      Peak Evaporated Milk
                    </h3>
                    <p className="text-[11px] text-muted-gray">Cost: ₦800 · Sell: ₦810</p>
                  </div>
                </div>
                <span className="rounded-full bg-[var(--color-alert-red)]/15 px-2.5 py-1 text-[11px] font-extrabold text-[var(--color-alert-red)]">
                  1.25% Margin ⚠️
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[var(--surface-card-secondary)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--color-alert-red)] h-full w-[2%]" />
              </div>

              <p className="text-[13px] text-body-brown">
                <strong className="text-[var(--color-alert-red)]">The Reality:</strong> You must haul & sell <strong>100 tins</strong> just to make <strong>₦1,000 profit</strong> while tying down <strong>₦80,000</strong> in capital.
              </p>
            </div>

            {/* Sugar Engine */}
            <div className="interactive-card rounded-2xl border border-[var(--color-grass-green)]/40 bg-[var(--surface-card)] p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-[24px]">🍚</span>
                  <div>
                    <h3 className="font-display text-[17px] font-extrabold text-heading-charcoal">
                      Dangote Granulated Sugar
                    </h3>
                    <p className="text-[11px] text-muted-gray">Cost: ₦500 · Sell: ₦750</p>
                  </div>
                </div>
                <span className="rounded-full bg-[var(--color-grass-green)]/15 px-2.5 py-1 text-[11px] font-extrabold text-[var(--color-grass-green)]">
                  33.3% Margin 🟢
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[var(--surface-card-secondary)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--color-grass-green)] h-full w-[33.3%]" />
              </div>

              <p className="text-[13px] text-body-brown">
                <strong className="text-[var(--color-grass-green)]">The Insight:</strong> Selling just <strong>4 bags</strong> earns that exact same <strong>₦1,000 profit</strong> with only <strong>₦2,000</strong> capital committed.
              </p>
            </div>
          </div>

          {/* Compact Interactive Margin Calculator Bar */}
          <div className="mt-8 max-w-3xl mx-auto rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <span className="text-[13px] font-extrabold text-heading-charcoal flex items-center gap-1.5">
                <Sliders size={16} className="text-[var(--color-hot-coral)]" /> Test Your Product Margin:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: "rice", label: "🍚 Rice" },
                  { id: "sugar", label: "🍬 Sugar" },
                  { id: "milk", label: "🥛 Milk" },
                  { id: "noodles", label: "🍜 Noodles" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPreset(item.id)}
                    className={`monzo-pill px-3 py-0.5 text-[11px] font-bold cursor-pointer transition-all ${
                      selectedProductPreset === item.id
                        ? "bg-ink-black text-[var(--color-ink-black-text)] shadow-2xs"
                        : "bg-[var(--surface-card-secondary)] text-heading-charcoal"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center sm:text-left">
              <div>
                <span className="text-[11px] font-semibold text-muted-gray">Cost: ₦{calcCost}</span>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={calcCost}
                  onChange={(e) => setCalcCost(Number(e.target.value))}
                  className="w-full accent-[var(--color-hot-coral)] cursor-pointer"
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-muted-gray">Selling: ₦{calcSelling}</span>
                <input
                  type="range"
                  min={100}
                  max={6000}
                  step={50}
                  value={calcSelling}
                  onChange={(e) => setCalcSelling(Number(e.target.value))}
                  className="w-full accent-[var(--color-grass-green)] cursor-pointer"
                />
              </div>

              <div className="sm:text-right">
                <span
                  className={`numo-display text-[22px] font-extrabold ${
                    calcMarginPct >= 30
                      ? "text-[var(--color-grass-green)]"
                      : calcMarginPct >= 10
                      ? "text-[var(--color-gold)]"
                      : "text-[var(--color-alert-red)]"
                  }`}
                >
                  +{calcMarginPct}% Margin
                </span>
                <p className="text-[11px] font-bold text-heading-charcoal">+₦{calcProfit} profit / item</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MONZO BENTO FEATURE GRID */}
      {/* ========================================================================= */}
      <section id="features" className="py-16 sm:py-20 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              Built for African Retail
            </span>
            <h2 className="font-display text-[32px] sm:text-[44px] font-extrabold tracking-tight text-heading-charcoal">
              Everything You Need to Run a Profitable Shop
            </h2>
            <p className="text-[15px] sm:text-[17px] text-body-brown">
              No complicated spreadsheets. Just tap to sell, tap to restock, and keep 100% control of your margins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1: Fast 1-Tap Inventory Stepper */}
            <div className="interactive-card rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral mb-4">
                  <Package size={22} weight="fill" />
                </div>
                <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal">
                  1-Tap Sales & Restock
                </h3>
                <p className="text-[13px] text-body-brown mt-1">
                  Log sales and restocks in under a second. No counting registers or messy paper books.
                </p>
              </div>

              {/* Live Stepper Demo */}
              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px]">🥛 Peak Milk (160g)</span>
                  <span className="text-[11px] font-semibold text-muted-gray">Alert ≤ 5</span>
                </div>
                <div className="numo-display text-[28px] font-extrabold my-2 text-heading-charcoal">
                  {demoStockMilk} tins
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (demoStockMilk > 0) {
                        setDemoStockMilk(demoStockMilk - 1);
                        setDemoSalesCount(demoSalesCount + 1);
                      }
                    }}
                    className="monzo-pill flex-1 flex items-center justify-center gap-1 bg-[var(--color-alert-red)] text-white py-2 text-[12px] font-bold cursor-pointer hover:opacity-90"
                  >
                    <Minus size={13} weight="bold" /> 1 Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoStockMilk(demoStockMilk + 1)}
                    className="monzo-pill flex-1 flex items-center justify-center gap-1 bg-[var(--color-grass-green)] text-white py-2 text-[12px] font-bold cursor-pointer hover:opacity-90"
                  >
                    <Plus size={13} weight="bold" /> 1 Restock
                  </button>
                </div>
              </div>
            </div>

            {/* Feature 2: Smart Supplier Tracking */}
            <div className="interactive-card rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-grass-green)] text-white shadow-sm mb-4">
                  <Receipt size={22} weight="fill" />
                </div>
                <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal">
                  Cheapest Supplier Alerts
                </h3>
                <p className="text-[13px] text-body-brown mt-1">
                  Track who gave you the best restock price and see price fluctuation history automatically.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)] space-y-2">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-bold">Alaba Wholesale</span>
                  <span className="text-[var(--color-grass-green)] font-extrabold font-display">₦780 / tin (Best)</span>
                </div>
                <div className="flex justify-between items-center text-[12px] text-muted-gray">
                  <span>Kano Depot</span>
                  <span>₦820 / tin</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Offline SQLite */}
            <div className="interactive-card rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-link-blue)] text-white shadow-sm mb-4">
                  <Lightning size={22} weight="fill" />
                </div>
                <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal">
                  100% Offline SQLite
                </h3>
                <p className="text-[13px] text-body-brown mt-1">
                  Full relational SQLite running right inside your browser. Zero lag, zero network requests.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-heading-charcoal">Local Database Engine</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-grass-green)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-grass-green)] animate-pulse" />
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-muted-gray">
                  All transactions and catalog items are saved to local device storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MULTI-TRADER STORIES & REAL METRICS (3-Card Visible Gallery) */}
      {/* ========================================================================= */}
      <section id="stories" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)]/15 px-3.5 py-1 text-[12px] font-extrabold text-[var(--color-gold)]">
              <Star weight="fill" size={14} /> 5.0 Rating Across 2,000+ Retailers
            </div>
            <h2 className="font-display text-[34px] sm:text-[46px] font-extrabold tracking-tight text-heading-charcoal">
              Real Market Traders. Real Stories & Results.
            </h2>
            <p className="text-[16px] text-body-brown">
              See how market women across West Africa are protecting their weekly margins.
            </p>
          </div>

          {/* 3-Column Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {TRADER_STORIES.map((trader) => (
              <div
                key={trader.id}
                className="interactive-card rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 shadow-subtle-3 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Photo & Identity Header */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-[var(--color-hot-coral)] shrink-0 shadow-xs">
                      <Image
                        src={trader.image}
                        alt={trader.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-display text-[16px] font-extrabold text-heading-charcoal leading-tight">
                        {trader.name}
                      </h3>
                      <p className="text-[11px] text-muted-gray">{trader.location}</p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-[var(--color-gold)] text-[14px]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} weight="fill" />
                    ))}
                  </div>

                  {/* Headline */}
                  <p className="font-display text-[15px] font-extrabold text-heading-charcoal leading-snug">
                    {trader.headline}
                  </p>

                  {/* Real Story */}
                  <p className="text-[13px] text-body-brown leading-relaxed">
                    {trader.story}
                  </p>
                </div>

                {/* Hard Metric Footer */}
                <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between">
                  <div>
                    <span className="numo-heading text-[20px] font-extrabold text-[var(--color-grass-green)]">
                      {trader.metricValue}
                    </span>
                    <p className="text-[11px] font-semibold text-muted-gray">{trader.metricLabel}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-grass-green)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--color-grass-green)]">
                    <UserCheck size={13} weight="bold" /> Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENT 2-TIER PRICING */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              Simple & Honest
            </span>
            <h2 className="font-display text-[32px] sm:text-[46px] font-extrabold tracking-tight text-heading-charcoal">
              Simple Pricing. No Hidden Fees.
            </h2>
            <p className="text-[16px] text-body-brown">
              Start completely free today. Upgrade only when your shop expands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tier 1: Free Forever */}
            <div className="interactive-card rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-7 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-[22px] font-extrabold text-heading-charcoal">Starter</h3>
                  <span className="rounded-full bg-[var(--surface-card-secondary)] px-3 py-1 text-[11px] font-bold text-muted-gray">
                    FREE FOREVER
                  </span>
                </div>
                <div className="numo-display text-[38px] font-extrabold text-heading-charcoal">
                  ₦0 <span className="text-[14px] font-normal text-muted-gray">/ month</span>
                </div>
                <p className="text-[13px] text-body-brown mt-2">
                  Everything you need to track daily stock and eliminate paper records.
                </p>

                <ul className="mt-6 space-y-2.5 text-[13px]">
                  {[
                    "Unlimited product catalog",
                    "1-Tap sales and restock logging",
                    "Low-stock alert warnings",
                    "100% offline database engine",
                    "Manual CSV export backup",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-heading-charcoal font-medium">
                      <CheckCircle weight="fill" className="text-[var(--color-grass-green)] shrink-0" size={17} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/onboarding"
                className="monzo-pill flex w-full items-center justify-center gap-1.5 border border-[var(--border-hairline)] bg-[var(--surface-card-secondary)] py-3 text-[14px] font-bold text-heading-charcoal hover:bg-[var(--surface-card)] transition-colors cursor-pointer text-center"
              >
                Start Free Today
              </Link>
            </div>

            {/* Tier 2: Pro Tier */}
            <div className="interactive-card relative rounded-cards bg-[var(--surface-card)] border-2 border-[var(--color-hot-coral)] p-7 shadow-coral flex flex-col justify-between space-y-6">
              <span className="absolute -top-3 right-6 bg-[var(--color-hot-coral)] text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-xs">
                MOST POPULAR
              </span>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-[22px] font-extrabold text-heading-charcoal">Pro Trader</h3>
                  <span className="rounded-full bg-[var(--color-hot-coral)]/15 px-3 py-1 text-[11px] font-bold text-[var(--color-hot-coral)]">
                    PRO
                  </span>
                </div>
                <div className="numo-display text-[38px] font-extrabold text-heading-charcoal">
                  ₦500 <span className="text-[14px] font-normal text-muted-gray">/ month (₦17/day)</span>
                </div>
                <p className="text-[13px] text-body-brown mt-2">
                  Full profit margin intelligence, supplier tracking, and automatic cloud recovery.
                </p>

                <ul className="mt-6 space-y-2.5 text-[13px]">
                  {[
                    "Everything in Starter plan",
                    "Real-time cost & profit margin engine",
                    "Cheapest supplier price history",
                    "AI Reorder Recommendations",
                    "Automatic cloud sync across devices",
                    "Priority WhatsApp & SMS support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-heading-charcoal font-medium">
                      <CheckCircle weight="fill" className="text-[var(--color-hot-coral)] shrink-0" size={17} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/onboarding"
                className="monzo-pill flex w-full items-center justify-center gap-1.5 bg-[var(--color-hot-coral)] py-3 text-[14px] font-extrabold text-white shadow-coral hover:opacity-95 transition-opacity cursor-pointer text-center"
              >
                Try Pro Free for 7 Days <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. MONZO FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="font-display text-[32px] sm:text-[44px] font-extrabold tracking-tight text-heading-charcoal">
              Frequently Asked Questions
            </h2>
            <p className="text-[16px] text-body-brown">
              Got questions? We&rsquo;ve got clear answers.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] overflow-hidden shadow-subtle-3 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-5 text-left font-bold text-[16px] text-heading-charcoal hover:bg-[var(--surface-card-secondary)]/50 cursor-pointer transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <CaretUp size={18} /> : <CaretDown size={18} />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-[14px] text-body-brown leading-relaxed border-t border-[var(--border-hairline)]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MONZO MIDNIGHT FINALE CTA BANNER */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-[#091723] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] height-[500px] bg-[radial-gradient(circle,rgba(255,79,64,0.2)_0%,transparent_70%)] pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-extrabold text-white/90">
            ⚡ Ready in Under 3 Minutes
          </div>

          <h2 className="font-display text-[38px] sm:text-[56px] font-extrabold tracking-tight leading-[1.08] text-white">
            Ready to Know Your Stock & Protect Your Profit?
          </h2>

          <p className="text-[17px] sm:text-[19px] text-white/80 max-w-xl mx-auto leading-relaxed">
            Join over 2,000 African market traders building smarter, more profitable shops with Trackkit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/onboarding"
              className="monzo-pill w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--color-hot-coral)] px-9 py-4 text-[16px] font-extrabold text-white shadow-coral hover:opacity-95 transition-opacity cursor-pointer text-center"
            >
              Get Started Free <ArrowRight size={18} weight="bold" />
            </Link>
            <Link
              href="/"
              className="monzo-pill w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 px-7 py-4 text-[15px] font-bold text-white transition-colors cursor-pointer text-center"
            >
              Explore Live Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border-hairline)] bg-[var(--surface-card)] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-muted-gray">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--color-hot-coral)] text-white shadow-xs">
              <Storefront weight="fill" size={15} />
            </span>
            <span className="font-display font-extrabold text-heading-charcoal text-[16px]">
              Trackkit
            </span>
            <span>· Offline-First Retail Inventory</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-heading-charcoal font-semibold">Workspace</Link>
            <Link href="/onboarding" className="hover:text-heading-charcoal font-semibold">Onboarding</Link>
            <Link href="/design-system.html" className="hover:text-heading-charcoal font-semibold">Design System</Link>
            <Link href="/auth/login" className="hover:text-heading-charcoal font-semibold">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
