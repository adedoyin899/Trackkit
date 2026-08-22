"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Storefront,
  Lightning,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Package,
  Minus,
  Plus,
  Star,
  CaretDown,
  CaretUp,
  Receipt,
  UserCheck,
  Warning,
  Sparkle,
  TrendUp,
  ListBullets,
  WifiSlash,
  ChartLineUp,
  Coins,
  CloudCheck,
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

const ORIGINAL_TESTIMONIALS = [
  {
    id: "amara",
    name: "Amara Okafor",
    role: "Selling dairy products for 8 years",
    location: "Balogun Market · Lagos, Nigeria",
    image: "/images/trader-amara.jpg",
    quote:
      "I was selling milk and sugar side by side, but I had no idea which one was actually making me money. Trackkit showed me that milk was barely 1% margin. I raised the price to ₦850 and didn't lose any customers. Now I make ₦3,000 more every week just from milk. This app paid for itself in one day.",
    profitMetric: "+₦12,000 / mo",
    profitLabel: "Extra Milk Margin",
    tag: "Dairy & FMCG",
  },
  {
    id: "esinam",
    name: "Esinam Akosua Mensah",
    role: "Selling FMCG and spices for 12 years",
    location: "Makola Market · Accra, Ghana",
    image: "/images/trader-akosua.jpg",
    quote:
      "I used to write everything on paper. Lists would get lost, I'd forget quantities, suppliers would change prices and I wouldn't track it. Now everything is in my phone. I know exactly how much inventory I have, what I paid for it, and what I'm selling it for. No more guessing. No more losing track.",
    profitMetric: "100% Tracked",
    profitLabel: "Paperless Inventory",
    tag: "Spices & Grains",
  },
  {
    id: "zainab",
    name: "Zainab Bello",
    role: "Selling noodles, sugar, flour for 6 years",
    location: "Central Market · Kumasi, Ghana",
    image: "/images/trader-zainab.jpg",
    quote:
      "The low-stock alerts saved me. My phone tells me when I'm running low on popular items. I restock before I run out—no more stock-outs mid-week. My sales went up ₦500 per day just from that one feature.",
    profitMetric: "+₦15,000 / mo",
    profitLabel: "Saved Lost Sales",
    tag: "Noodles & Grains",
  },
];

export default function WelcomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeNavTab, setActiveNavTab] = useState<string>("inventory");

  // Testimonials carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Interactive mobile prototype state for features
  const [prototypeTab, setPrototypeTab] = useState<"stock" | "profit" | "sync">("stock");
  const [protoMilkStock, setProtoMilkStock] = useState(14);
  const [protoSugarStock, setProtoSugarStock] = useState(28);

  const nextTestimonial = () => {
    setCarouselIndex((prev) => (prev + 1) % ORIGINAL_TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setCarouselIndex((prev) => (prev - 1 + ORIGINAL_TESTIMONIALS.length) % ORIGINAL_TESTIMONIALS.length);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const currentTestimonial = ORIGINAL_TESTIMONIALS[carouselIndex];

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
                href="#problem"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                The Reality
              </a>
              <a
                href="#features"
                className="px-3.5 py-1.5 rounded-full text-[13px] font-bold text-body-brown hover:text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
              >
                Interactive Prototype
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
      {/* 1. HERO SECTION (People-Oriented Image with Floating In-Product Cards) */}
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
                Know Your Profit. <br />
                <span className="text-[var(--color-hot-coral)]">No Internet? No Problem.</span>
              </h1>

              <p className="text-[17px] sm:text-[19px] text-body-brown leading-relaxed max-w-xl">
                The app that helps market women track inventory, see real profit margins, and make smarter buying decisions—all offline, completely free to start.
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

            {/* Hero Right: Real Trader Photography + Floating Animated In-Product Cards */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg">
                {/* Backdrop Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--color-hot-coral)]/20 to-[var(--color-grass-green)]/20 rounded-3xl blur-2xl -z-10" />

                {/* Primary Lifestyle Image Container */}
                <div className="relative h-[380px] sm:h-[460px] w-full rounded-[28px] overflow-hidden border border-[var(--border-hairline)] shadow-2xl">
                  <Image
                    src="/images/hero-market-trader.jpg"
                    alt="Adesola smiling in her retail grocery and provision shop in Lagos"
                    fill
                    priority
                    className="object-cover"
                  />
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
                        +50% Margin · ₦750 Price 🟢
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
      <section className="py-8 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-[22px] sm:text-[24px] font-extrabold text-heading-charcoal tracking-tight">
              Tell me about...
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "problem", label: "⚠️ The Reality", target: "#problem" },
                { id: "features", label: "📱 Interactive Prototype", target: "#features" },
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
      {/* 3. SECTION 1: THE PROBLEM (Exact Original Copy from landing page.md) */}
      {/* ========================================================================= */}
      <section id="problem" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 space-y-12">
          {/* Section Heading */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              The Reality of Retail Trading
            </span>
            <h2 className="font-display text-[34px] sm:text-[48px] font-extrabold tracking-tight text-heading-charcoal">
              You&rsquo;re Losing Money Without Even Knowing It
            </h2>
            <p className="text-[17px] sm:text-[19px] text-body-brown leading-relaxed">
              Every week, you&rsquo;re working hard. Restocking at dawn. Selling all day. Counting money at night. But somewhere in between, profit is slipping away.
            </p>
          </div>

          {/* Core Story Box */}
          <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 sm:p-8 shadow-subtle-3 space-y-4">
            <p className="text-[16px] text-body-brown leading-relaxed">
              You remember buying milk at <strong>₦800</strong>, selling at <strong>₦810</strong>. That&rsquo;s barely <strong>₦10 per tin</strong>. Meanwhile, sugar is <strong>₦50 cost</strong>, <strong>₦75 selling</strong>—that&rsquo;s real money. But which one are you actually restocking? Which one is taking up your time?
            </p>
            <div className="p-4 rounded-xl bg-[var(--color-alert-red)]/10 border border-[var(--color-alert-red)]/20 text-[14px] font-bold text-[var(--color-alert-red)] flex items-center gap-2">
              <Warning size={20} weight="fill" className="shrink-0" />
              <span>Without seeing the numbers, you&rsquo;re flying blind.</span>
            </div>
          </div>

          {/* 5 Original Pain Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs space-y-2">
              <h3 className="font-display text-[16px] font-extrabold text-heading-charcoal flex items-center gap-2">
                <span className="text-[var(--color-alert-red)]">❌</span> Forgotten restocks
              </h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                You run out of your best sellers mid-week and lose sales.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs space-y-2">
              <h3 className="font-display text-[16px] font-extrabold text-heading-charcoal flex items-center gap-2">
                <span className="text-[var(--color-alert-red)]">❌</span> No margin visibility
              </h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                Some products might be losing you money and you don&rsquo;t even know.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs space-y-2">
              <h3 className="font-display text-[16px] font-extrabold text-heading-charcoal flex items-center gap-2">
                <span className="text-[var(--color-alert-red)]">❌</span> Buying guesses
              </h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                You restock based on habit, not data. Sometimes you over-buy slow items.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs space-y-2">
              <h3 className="font-display text-[16px] font-extrabold text-heading-charcoal flex items-center gap-2">
                <span className="text-[var(--color-alert-red)]">❌</span> Paper records fail
              </h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                Lists get lost, numbers get illegible, you can&rsquo;t remember last week&rsquo;s prices.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs space-y-2 sm:col-span-2 lg:col-span-2">
              <h3 className="font-display text-[16px] font-extrabold text-heading-charcoal flex items-center gap-2">
                <span className="text-[var(--color-alert-red)]">❌</span> No internet? You&rsquo;re stuck
              </h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                Most tools need WiFi. Markets don&rsquo;t have WiFi. Trackkit works 100% offline.
              </p>
            </div>
          </div>

          {/* Emotional Anchor Box */}
          <div className="rounded-cards bg-[var(--surface-card-secondary)] border border-[var(--border-hairline)] p-6 sm:p-8 text-center max-w-3xl mx-auto space-y-2">
            <p className="text-[16px] sm:text-[18px] text-body-brown leading-relaxed">
              You didn&rsquo;t start this business to break even. You started it to provide for your family, to build something.
            </p>
            <p className="font-display text-[18px] sm:text-[20px] font-extrabold text-heading-charcoal">
              You deserve to know if your work is actually paying off.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 3: WHAT TRACCKIT DOES (Clean 3-Card Bento Grid) */}
      {/* ========================================================================= */}
      <section id="features" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              Finally, An App Built For You
            </span>
            <h2 className="font-display text-[34px] sm:text-[48px] font-extrabold tracking-tight text-heading-charcoal">
              Three Simple Things That Change Everything
            </h2>
            <p className="text-[16px] sm:text-[18px] text-body-brown">
              Simple. Free to start. Designed specifically for West African market retail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {/* Feature 1: Know Your Stock */}
            <div className="interactive-card rounded-2xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 sm:p-7 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral mb-4">
                  <Package size={24} weight="fill" />
                </div>
                <h3 className="font-display text-[22px] font-extrabold text-heading-charcoal">
                  1. Know Your Stock
                </h3>
                <p className="text-[14px] text-body-brown leading-relaxed">
                  Add your products once. See how many tins of milk, bags of sugar, cartons of noodles you have right now.
                </p>
                <p className="text-[13px] text-muted-gray leading-relaxed">
                  Quick buttons: tap &ldquo;-1&rdquo; when you sell, &ldquo;+1&rdquo; when you restock. That&rsquo;s it. No counting. No guessing.
                </p>
              </div>

              {/* Interactive In-Card Stepper Widget */}
              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px]">🥛 Peak Milk (160g)</span>
                  <span className="text-[11px] font-semibold text-muted-gray">Alert ≤ 5</span>
                </div>
                <div className="numo-display text-[28px] font-extrabold text-heading-charcoal">
                  {protoMilkStock} tins
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setProtoMilkStock(Math.max(0, protoMilkStock - 1))}
                    className="monzo-pill flex-1 flex items-center justify-center gap-1 bg-[var(--color-alert-red)] text-white py-2 text-[12px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Minus size={13} weight="bold" /> 1 Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => setProtoMilkStock(protoMilkStock + 1)}
                    className="monzo-pill flex-1 flex items-center justify-center gap-1 bg-[var(--color-grass-green)] text-white py-2 text-[12px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Plus size={13} weight="bold" /> 1 Restock
                  </button>
                </div>
                <p className="text-[11px] font-bold text-[var(--color-grass-green)] pt-1">
                  ✓ Result: No more stock-outs on best sellers.
                </p>
              </div>
            </div>

            {/* Feature 2: Know Your Profit */}
            <div className="interactive-card rounded-2xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 sm:p-7 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-grass-green)] text-white shadow-sm mb-4">
                  <Receipt size={24} weight="fill" />
                </div>
                <h3 className="font-display text-[22px] font-extrabold text-heading-charcoal">
                  2. Know Your Profit
                </h3>
                <p className="text-[14px] text-body-brown leading-relaxed">
                  Enter what you paid the supplier. Enter what you&rsquo;re selling for. Trackkit shows you the margin—instantly.
                </p>
                <p className="text-[13px] text-muted-gray leading-relaxed">
                  Now you see it. Some products make real money. Some barely move the needle. You decide what to restock.
                </p>
              </div>

              {/* In-Card Margin Breakdown Widget */}
              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)] space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold">Milk (₦800 → ₦810)</span>
                  <span className="rounded-full bg-[var(--color-alert-red)]/15 px-2 py-0.5 text-[10px] font-extrabold text-[var(--color-alert-red)]">
                    1.25% 🔴
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold">Sugar (₦50 → ₦75)</span>
                  <span className="rounded-full bg-[var(--color-grass-green)]/15 px-2 py-0.5 text-[10px] font-extrabold text-[var(--color-grass-green)]">
                    50.0% 🟢
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold">Noodles (₦80 → ₦120)</span>
                  <span className="rounded-full bg-[var(--color-grass-green)]/15 px-2 py-0.5 text-[10px] font-extrabold text-[var(--color-grass-green)]">
                    50.0% 🟢
                  </span>
                </div>
                <p className="text-[11px] font-bold text-[var(--color-grass-green)] pt-1">
                  ✓ Result: Make ₦2,000–₦5,000 more per week.
                </p>
              </div>
            </div>

            {/* Feature 3: Sync & Backup */}
            <div className="interactive-card rounded-2xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 sm:p-7 shadow-subtle-3 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-link-blue)] text-white shadow-sm mb-4">
                  <CloudCheck size={24} weight="fill" />
                </div>
                <h3 className="font-display text-[22px] font-extrabold text-heading-charcoal">
                  3. 100% Offline + Backup
                </h3>
                <p className="text-[14px] text-body-brown leading-relaxed">
                  Your phone might break. But your data won&rsquo;t. Everything works offline and syncs automatically when online.
                </p>
                <p className="text-[13px] text-muted-gray leading-relaxed">
                  Switch to a new phone? Log in, and everything is there. Your records and pricing history are protected.
                </p>
              </div>

              {/* In-Card Offline SQLite Status Widget */}
              <div className="rounded-2xl bg-[var(--surface-canvas)] p-4 border border-[var(--border-hairline)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-heading-charcoal">Local SQLite Engine</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-grass-green)]/15 px-2 py-0.5 text-[10px] font-extrabold text-[var(--color-grass-green)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-grass-green)] animate-pulse" />
                    Offline Ready
                  </span>
                </div>
                <p className="text-[11px] text-muted-gray">
                  Instant local storage on your phone. Automatic encrypted cloud sync.
                </p>
                <p className="text-[11px] font-bold text-[var(--color-grass-green)] pt-1">
                  ✓ Result: Total peace of mind. Zero data loss.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FULL-PAGE TESTIMONIAL CAROUSEL (Original Full Page Style with Smooth Navigation) */}
      {/* ========================================================================= */}
      <section id="stories" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)]/15 px-3.5 py-1 text-[12px] font-extrabold text-[var(--color-gold)]">
              <Star weight="fill" size={14} /> 5.0 Rating Across 2,000+ Market Women
            </div>
            <h2 className="font-display text-[34px] sm:text-[48px] font-extrabold tracking-tight text-heading-charcoal">
              Real People, Real Results
            </h2>
            <p className="text-[16px] sm:text-[18px] text-body-brown">
              Hear directly from market women across West Africa who transformed their daily profit with Trackkit.
            </p>
          </div>

          {/* Full Page Showcase Carousel Card with Locked Consistent Height */}
          <div className="relative max-w-5xl mx-auto rounded-containers border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 md:p-10 shadow-subtle-3 min-h-[480px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              {/* Left Column: High-Resolution Real Portrait with Fixed Same Size */}
              <div className="lg:col-span-5 relative flex items-center">
                <div className="relative h-[360px] sm:h-[400px] md:h-[420px] w-full rounded-2xl overflow-hidden border border-[var(--border-hairline)] shadow-md shrink-0">
                  <Image
                    src={currentTestimonial.image}
                    alt={currentTestimonial.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[var(--color-hot-coral)] px-2.5 py-0.5 rounded-full mb-1 inline-block">
                      {currentTestimonial.tag}
                    </span>
                    <h3 className="font-display font-extrabold text-[20px] leading-tight">
                      {currentTestimonial.name}
                    </h3>
                    <p className="text-[12px] text-white/80">{currentTestimonial.location}</p>
                    <p className="text-[11px] text-white/60 mt-0.5">{currentTestimonial.role}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Full Story with Consistent Vertical Flex Spacing */}
              <div className="lg:col-span-7 flex flex-col justify-between min-h-[360px] sm:min-h-[400px] md:min-h-[420px] py-1">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[var(--color-gold)] text-[16px]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} weight="fill" />
                      ))}
                    </div>

                    {/* Carousel Page Indicator */}
                    <span className="text-[12px] font-bold text-muted-gray">
                      {carouselIndex + 1} of {ORIGINAL_TESTIMONIALS.length}
                    </span>
                  </div>

                  {/* Big Quote with min height to prevent jitter */}
                  <div className="min-h-[140px] sm:min-h-[160px] flex items-center">
                    <blockquote className="font-display text-[20px] sm:text-[25px] md:text-[27px] font-extrabold tracking-tight text-heading-charcoal leading-snug">
                      &ldquo;{currentTestimonial.quote}&rdquo;
                    </blockquote>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Social Proof Metric Row */}
                  <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between">
                    <div>
                      <span className="numo-heading text-[26px] font-extrabold text-[var(--color-grass-green)]">
                        {currentTestimonial.profitMetric}
                      </span>
                      <p className="text-[12px] font-semibold text-muted-gray">
                        {currentTestimonial.profitLabel}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-grass-green)]/15 px-3 py-1 text-[12px] font-bold text-[var(--color-grass-green)]">
                      <UserCheck size={16} weight="bold" /> Verified Trader
                    </span>
                  </div>

                  {/* Carousel Navigation Buttons */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={prevTestimonial}
                      aria-label="Previous story"
                      className="monzo-pill h-10 w-10 flex items-center justify-center border border-[var(--border-hairline)] bg-[var(--surface-card-secondary)] text-heading-charcoal hover:bg-[var(--border-hairline)] transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={nextTestimonial}
                      aria-label="Next story"
                      className="monzo-pill h-10 w-10 flex items-center justify-center border border-[var(--border-hairline)] bg-[var(--surface-card-secondary)] text-heading-charcoal hover:bg-[var(--border-hairline)] transition-colors cursor-pointer"
                    >
                      <ArrowRight size={16} weight="bold" />
                    </button>
                    <div className="flex gap-1.5 ml-2">
                      {ORIGINAL_TESTIMONIALS.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCarouselIndex(idx)}
                          aria-label={`Go to slide ${idx + 1}`}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            carouselIndex === idx
                              ? "w-7 bg-[var(--color-hot-coral)]"
                              : "w-2 bg-[var(--border-hairline)] hover:bg-muted-gray"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Stats Banner (From Original Copy) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12 text-center">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs">
              <p className="numo-heading text-[28px] font-extrabold text-heading-charcoal">2,000+</p>
              <p className="text-[12px] font-semibold text-muted-gray mt-1">Market Women Using Trackkit</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs">
              <p className="numo-heading text-[28px] font-extrabold text-[var(--color-hot-coral)]">₦150M+</p>
              <p className="text-[12px] font-semibold text-muted-gray mt-1">Tracked Inventory Volume</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs">
              <p className="numo-heading text-[28px] font-extrabold text-[var(--color-grass-green)]">₦45,000+</p>
              <p className="text-[12px] font-semibold text-muted-gray mt-1">Avg. Monthly Profit Boost</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-xs">
              <p className="numo-heading text-[28px] font-extrabold text-[var(--color-link-blue)]">98%</p>
              <p className="text-[12px] font-semibold text-muted-gray mt-1">Would Recommend to a Friend</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENT 2-TIER PRICING (Original Copy) */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              Simple & Honest
            </span>
            <h2 className="font-display text-[32px] sm:text-[46px] font-extrabold tracking-tight text-heading-charcoal">
              Simple Pricing. No Surprises.
            </h2>
            <p className="text-[16px] sm:text-[18px] text-body-brown">
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
                    FOREVER FREE
                  </span>
                </div>
                <div className="numo-display text-[38px] font-extrabold text-heading-charcoal">
                  ₦0 <span className="text-[14px] font-normal text-muted-gray">/ month</span>
                </div>
                <p className="text-[13px] text-body-brown mt-2">
                  Track your stock, set alerts, never forget a restock. All free. No credit card. No expiration.
                </p>

                <ul className="mt-6 space-y-2.5 text-[13px]">
                  {[
                    "Unlimited product catalog",
                    "Unlimited sales tracking",
                    "Low-stock alert warnings",
                    "Works fully offline",
                    "Manual data backup (CSV export)",
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
                Start Free
              </Link>
            </div>

            {/* Tier 2: Pro Tier */}
            <div className="interactive-card relative rounded-cards bg-[var(--surface-card)] border-2 border-[var(--color-hot-coral)] p-7 shadow-coral flex flex-col justify-between space-y-6">
              <span className="absolute -top-3 right-6 bg-[var(--color-hot-coral)] text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-xs">
                MOST POPULAR
              </span>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-[22px] font-extrabold text-heading-charcoal">Pro</h3>
                  <span className="rounded-full bg-[var(--color-hot-coral)]/15 px-3 py-1 text-[11px] font-bold text-[var(--color-hot-coral)]">
                    PRO
                  </span>
                </div>
                <div className="numo-display text-[38px] font-extrabold text-heading-charcoal">
                  ₦500 <span className="text-[14px] font-normal text-muted-gray">/ month (about ₦17/day)</span>
                </div>
                <p className="text-[13px] text-body-brown mt-2">
                  Cost tracking, profit margins, and automatic cloud recovery. Most market women make back the cost in profit improvements in the first week.
                </p>

                <ul className="mt-6 space-y-2.5 text-[13px]">
                  {[
                    "Everything in Free, plus:",
                    "Cost tracking & profit margins",
                    "Purchase history & trends",
                    "Profit dashboard with insights",
                    "Cloud sync (backup + cross-device)",
                    "Price change history",
                    "Email & WhatsApp support",
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
