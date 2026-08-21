"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Storefront,
  Lightning,
  Coins,
  CloudArrowUp,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  TrendUp,
  Package,
  Minus,
  Plus,
  Star,
  CaretDown,
  CaretUp,
  Warning,
  ListChecks,
  DeviceMobile,
  LockKey,
  Sparkle,
  ArrowsClockwise,
  Receipt,
  Check,
  ChartLineUp,
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

export default function WelcomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoStockMilk, setDemoStockMilk] = useState(14);
  const [demoSalesMilk, setDemoSalesMilk] = useState(6);
  const [activeNavTab, setActiveNavTab] = useState<string>("inventory");

  // Interactive Margin Calculator state
  const [calcCost, setCalcCost] = useState<number>(800);
  const [calcSelling, setCalcSelling] = useState<number>(1200);

  const calcProfit = calcSelling - calcCost;
  const calcMarginPct = calcSelling > 0 ? Math.round((calcProfit / calcSelling) * 100) : 0;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-heading-charcoal font-sans selection:bg-[var(--color-hot-coral)] selection:text-white">
      {/* MONZO-STYLE STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 md:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral">
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
                href="#margins"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Margin Engine
              </a>
              <a
                href="#offline"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Offline First
              </a>
              <a
                href="#pricing"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Pricing
              </a>
              <a
                href="#stories"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Stories
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
              className="monzo-pill flex items-center gap-1.5 bg-ink-black px-5 py-2.5 text-[13px] font-bold text-[var(--color-ink-black-text)] hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              Get Started Free <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. MONZO HERO SECTION (Lifestyle Photography + Floating In-Product Cards) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-grass-green)]/30 bg-[var(--color-grass-green)]/10 px-4 py-1.5 text-[13px] font-bold text-[var(--color-grass-green)]">
                <Lightning weight="fill" size={15} />
                100% Offline-First Retail Copilot
              </div>

              <h1 className="font-display text-[40px] sm:text-[56px] lg:text-[62px] font-extrabold leading-[1.05] tracking-[-0.04em] text-heading-charcoal">
                Know Your Stock. <br />
                Protect Your Profit. <br />
                <span className="text-[var(--color-hot-coral)]">Offline Always.</span>
              </h1>

              <p className="text-[17px] sm:text-[19px] text-body-brown leading-relaxed max-w-xl">
                The smart inventory tracker built specifically for market traders and retailers. Calculate instant profit margins, restock before you run out, and manage your shop without internet.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/onboarding"
                  id="download"
                  className="monzo-pill flex items-center justify-center gap-2 bg-[var(--color-hot-coral)] px-8 py-3.5 text-[15px] font-extrabold text-white shadow-coral hover:opacity-95 transition-opacity cursor-pointer text-center"
                >
                  Get Started Free <ArrowRight size={17} />
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

            {/* Hero Right Visual: Authentic Trader Lifestyle Photo + Floating In-Product Cards */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg rounded-containers overflow-hidden border border-[var(--border-hairline)] bg-[var(--surface-card)] shadow-lg p-2.5 sm:p-3.5">
                {/* Main Hero Image */}
                <div className="relative h-[360px] sm:h-[420px] w-full rounded-2xl overflow-hidden border border-[var(--border-hairline)]">
                  <Image
                    src="/images/hero-market-trader.jpg"
                    alt="Market trader using Trackkit inventory app"
                    fill
                    priority
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-[var(--color-hot-coral)] px-2.5 py-0.5 rounded-full">
                      Balogun Market · Lagos
                    </span>
                    <p className="font-display font-extrabold text-[17px] mt-1 drop-shadow-sm">
                      Adesola Provisions & Goods
                    </p>
                  </div>
                </div>

                {/* Floating In-Product Card 1: Monzo Hot Coral Hero Card */}
                <div className="absolute -top-3 -left-3 sm:-left-6 max-w-[240px] sm:max-w-[270px] monzo-coral-card p-4 rounded-2xl shadow-coral z-10 border border-white/20">
                  <div className="flex items-center justify-between text-white/90 text-[11px] font-bold mb-1">
                    <span>MAIN SHOP</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">LIVE</span>
                  </div>
                  <p className="text-[11px] text-white/80">Stock Valuation</p>
                  <p className="font-display text-[22px] sm:text-[24px] font-extrabold text-white mt-0.5">
                    ₦1,042,500
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="bg-white text-[#091723] text-[11px] font-bold px-3 py-1 rounded-full">
                      + Restock
                    </span>
                    <span className="bg-black/30 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                      Log Sale
                    </span>
                  </div>
                </div>

                {/* Floating In-Product Card 2: Real Margin Indicator Badge */}
                <div className="absolute -bottom-3 -right-2 sm:-right-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-3.5 shadow-lg z-10 max-w-[230px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-grass-green)]/20 text-[var(--color-grass-green)] font-extrabold text-[12px]">
                      +50%
                    </span>
                    <div>
                      <p className="text-[12px] font-extrabold text-heading-charcoal">Dangote Sugar</p>
                      <p className="text-[11px] text-muted-gray">₦50 Cost → ₦75 Price</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. "TELL ME ABOUT..." INTERACTIVE PILL NAVIGATION (Monzo Signature Feature) */}
      {/* ========================================================================= */}
      <section className="py-12 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-[22px] sm:text-[26px] font-extrabold text-heading-charcoal tracking-tight">
              Tell me about...
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "inventory", label: "📦 Inventory Tracking", target: "#features" },
                { id: "margins", label: "💰 Margin Engine", target: "#margins" },
                { id: "offline", label: "⚡ 100% Offline Mode", target: "#offline" },
                { id: "copilot", label: "🤖 AI Pricing Copilot", target: "#copilot" },
                { id: "pricing", label: "🏷️ Transparent Pricing", target: "#pricing" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={item.target}
                  onClick={() => setActiveNavTab(item.id)}
                  className={`monzo-pill px-4 py-2 text-[13px] font-bold transition-all cursor-pointer ${
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
      {/* 3. THE PROBLEM SECTION (High-Contrast Problem Statement) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              The Reality of Retail Trading
            </span>
            <h2 className="font-display text-[32px] sm:text-[46px] font-extrabold tracking-tight text-heading-charcoal">
              You&rsquo;re Working Hard. But Are You Making Real Margin?
            </h2>
            <p className="text-[16px] sm:text-[18px] text-body-brown leading-relaxed">
              Restocking at dawn. Selling non-stop. Counting cash at night. But without real product-level visibility, some items are eating your profit without you knowing.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            {/* Story Box */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-4 shadow-subtle-3">
              <p className="text-[15px] sm:text-[16px] text-body-brown leading-relaxed">
                You remember buying evaporated milk at <strong>₦800</strong> and selling at <strong>₦810</strong>. That&rsquo;s barely <strong>₦10 profit (1.25% margin)</strong>. Meanwhile, granulated sugar is <strong>₦50 cost and ₦75 selling (50% margin)</strong>.
              </p>
              <p className="text-[16px] font-bold text-heading-charcoal">
                Which one is actually paying your bills? Which one deserves your restock budget?
              </p>
              <div className="rounded-2xl border border-[var(--color-alert-red)]/30 bg-[var(--color-alert-red)]/10 p-4 text-[13px] sm:text-[14px] font-bold text-[var(--color-alert-red)] flex items-center gap-2.5">
                <Warning size={20} weight="fill" className="shrink-0" />
                <span>Without seeing product margin percentages, you&rsquo;re flying blind.</span>
              </div>
            </div>

            {/* Pain Points List */}
            <div className="space-y-3">
              {[
                { title: "Forgotten Restocks", desc: "Running out of your top seller mid-week leaves money on the table." },
                { title: "Hidden Margin Drain", desc: "Fast-moving items with tiny 1% margins deceive your weekly cashflow." },
                { title: "Guesswork Purchases", desc: "Restocking based on habit rather than actual sales velocity." },
                { title: "Lost Paper Ledgers", desc: "Water damage, illegible handwriting, and forgotten supplier costs." },
                { title: "No Market WiFi", desc: "Cloud-only apps stop working the second you step into the market." },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-4 shadow-subtle-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-hot-coral)]/15 text-[var(--color-hot-coral)] font-bold text-[13px]">
                    ✕
                  </span>
                  <div>
                    <h4 className="text-[14px] sm:text-[15px] font-extrabold text-heading-charcoal">{item.title}</h4>
                    <p className="text-[12px] sm:text-[13px] text-muted-gray">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MONZO BENTO FEATURE GRID (In-Product UI Demos & Interactive Cards) */}
      {/* ========================================================================= */}
      <section id="features" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              Built for African Retail
            </span>
            <h2 className="font-display text-[32px] sm:text-[46px] font-extrabold tracking-tight text-heading-charcoal">
              Everything You Need to Run a Profitable Shop
            </h2>
            <p className="text-[16px] sm:text-[18px] text-body-brown">
              No complex accounting jargon. Just tap to sell, tap to restock, and watch your margin grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1: Fast 1-Tap Inventory Stepper */}
            <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral mb-4">
                  <Package size={22} weight="fill" />
                </div>
                <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal">
                  1-Tap Sales & Restock
                </h3>
                <p className="text-[13px] text-body-brown mt-1">
                  Log sales and restocks in under a second. No counting registers or typing spreadsheets.
                </p>
              </div>

              {/* Live Interactive Stepper Demo */}
              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[14px]">🥛 Peak Milk (160g)</span>
                  <span className="text-[11px] font-semibold text-muted-gray">Alert ≤ 5</span>
                </div>
                <div className="numo-display text-[32px] font-extrabold my-2 text-heading-charcoal">
                  {demoStockMilk} tins
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (demoStockMilk > 0) {
                        setDemoStockMilk(demoStockMilk - 1);
                        setDemoSalesMilk(demoSalesMilk + 1);
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

            {/* Feature 2: Interactive Margin Visualizer */}
            <div id="margins" className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-grass-green)] text-white shadow-sm mb-4">
                  <TrendUp size={22} weight="fill" />
                </div>
                <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal">
                  Instant Margin Breakdown
                </h3>
                <p className="text-[13px] text-body-brown mt-1">
                  See cash profit and percentage margins in real time. Know immediately if a price hike is needed.
                </p>
              </div>

              {/* Interactive Margin Calculator */}
              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)] space-y-2.5">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-muted-gray font-semibold">Cost Price:</span>
                  <input
                    type="number"
                    value={calcCost}
                    onChange={(e) => setCalcCost(Number(e.target.value) || 0)}
                    className="w-20 text-right bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-lg px-2 py-0.5 text-[12px] font-bold text-heading-charcoal"
                  />
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-muted-gray font-semibold">Selling Price:</span>
                  <input
                    type="number"
                    value={calcSelling}
                    onChange={(e) => setCalcSelling(Number(e.target.value) || 0)}
                    className="w-20 text-right bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-lg px-2 py-0.5 text-[12px] font-bold text-heading-charcoal"
                  />
                </div>
                <div className="border-t border-[var(--border-hairline)] pt-2 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-muted-gray">Profit Margin:</span>
                  <span
                    className={`text-[15px] font-extrabold font-display ${
                      calcMarginPct >= 30
                        ? "text-[var(--color-grass-green)]"
                        : calcMarginPct >= 10
                        ? "text-[var(--color-gold)]"
                        : "text-[var(--color-alert-red)]"
                    }`}
                  >
                    +{calcMarginPct}% (₦{calcProfit})
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 3: Offline-First SQLite Architecture */}
            <div id="offline" className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-subtle-3 flex flex-col justify-between space-y-6 md:col-span-2 lg:col-span-1">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-link-blue)] text-white shadow-sm mb-4">
                  <Lightning size={22} weight="fill" />
                </div>
                <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal">
                  100% Offline SQLite
                </h3>
                <p className="text-[13px] text-body-brown mt-1">
                  Full relational SQLite running right inside your browser and mobile device. Zero lag, zero network requests.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-heading-charcoal">Local Database Engine</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-grass-green)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-grass-green)] animate-pulse" />
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-muted-gray">
                  All transactions, products, and supplier stats are written directly to local encrypted storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CUSTOMER STORIES & TESTIMONIALS (Monzo Real People, Real Results) */}
      {/* ========================================================================= */}
      <section id="stories" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Portrait Photo */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-containers overflow-hidden border border-[var(--border-hairline)] bg-[var(--surface-card)] shadow-lg p-2.5">
                <div className="relative h-[380px] sm:h-[440px] w-full rounded-2xl overflow-hidden border border-[var(--border-hairline)]">
                  <Image
                    src="/images/trader-testimonial.jpg"
                    alt="Akosua, Grocery Trader in Accra"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="font-display font-extrabold text-[20px]">
                      Akosua Mensah
                    </p>
                    <p className="text-[12px] text-white/85">
                      Akosua&rsquo;s Grocery · Makola Market, Accra
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Story Quotes */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)]/15 px-3.5 py-1 text-[12px] font-extrabold text-[var(--color-gold)]">
                <Star weight="fill" size={14} /> 5.0 Rating Across 2,000+ Traders
              </div>

              <h2 className="font-display text-[32px] sm:text-[44px] font-extrabold tracking-tight text-heading-charcoal">
                &ldquo;I raised my milk price by ₦40 and made ₦12,000 extra this month.&rdquo;
              </h2>

              <p className="text-[16px] sm:text-[17px] text-body-brown leading-relaxed">
                &ldquo;I was selling milk and sugar side by side for 8 years, but I had no idea milk was only a 1.25% margin. Trackkit showed me the exact percentages in green and red. I adjusted my prices immediately and didn&rsquo;t lose a single customer.&rdquo;
              </p>

              {/* Key Social Proof Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border-hairline)]">
                <div>
                  <p className="numo-heading text-[24px] sm:text-[28px] font-extrabold text-heading-charcoal">2,000+</p>
                  <p className="text-[12px] text-muted-gray">Active Traders</p>
                </div>
                <div>
                  <p className="numo-heading text-[24px] sm:text-[28px] font-extrabold text-[var(--color-grass-green)]">+32%</p>
                  <p className="text-[12px] text-muted-gray">Avg. Profit Boost</p>
                </div>
                <div>
                  <p className="numo-heading text-[24px] sm:text-[28px] font-extrabold text-heading-charcoal">100%</p>
                  <p className="text-[12px] text-muted-gray">Offline Capable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENT 2-TIER PRICING (Monzo Clean Cards) */}
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
            <p className="text-[16px] sm:text-[18px] text-body-brown">
              Start completely free today. Upgrade only when your shop expands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tier 1: Free Forever */}
            <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-7 shadow-subtle-3 flex flex-col justify-between space-y-6">
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
            <div className="relative rounded-cards bg-[var(--surface-card)] border-2 border-[var(--color-hot-coral)] p-7 shadow-coral flex flex-col justify-between space-y-6">
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
                Try Pro Free for 7 Days <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. MONZO FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
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
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-bold text-white/90">
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
              Get Started Free <ArrowRight size={18} />
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
