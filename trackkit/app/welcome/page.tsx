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
  Quotes,
  UserCheck,
  Sliders,
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

const TESTIMONIALS = [
  {
    id: "akosua",
    name: "Akosua Mensah",
    shop: "Akosua's Grocery & Provisions",
    location: "Makola Market · Accra",
    image: "/images/trader-testimonial.jpg",
    headline: "“I raised my milk price by ₦40 and made ₦12,000 extra this month.”",
    story:
      "I was selling milk and sugar side by side for 8 years, but I had no idea milk was only a 1.25% margin. Trackkit showed me my profit percentages in green and red. I adjusted my prices immediately and didn’t lose a single customer.",
    statNumber: "+₦12,000",
    statLabel: "Extra Monthly Profit",
    rating: 5,
    tag: "Dairy & Provisions",
  },
  {
    id: "amara",
    name: "Amara Okafor",
    shop: "Adesola Wholesale & Retail",
    location: "Balogun Market · Lagos",
    image: "/images/trader-amara.jpg",
    headline: "“I stopped restocking slow items and boosted my weekly cash by ₦18,500.”",
    story:
      "Before Trackkit, I tied up ₦150,000 every month in slow-moving snacks that barely gave me ₦20 profit. The Margin Pulse screen made it obvious where my capital was trapped. Now I only restock high-velocity, high-margin goods.",
    statNumber: "+₦18,500",
    statLabel: "Weekly Cashflow Boost",
    rating: 5,
    tag: "FMCG Wholesale",
  },
  {
    id: "zainab",
    name: "Zainab Bello",
    shop: "Kano Grains & Spices Depot",
    location: "Central Market · Kumasi",
    image: "/images/trader-zainab.jpg",
    headline: "“Zero stockouts on my top 5 spices since I turned on low-stock alerts.”",
    story:
      "My biggest loss used to be running out of curry powder and ginger mid-Saturday when the market is packed. Trackkit alerts me 3 days ahead before stock drops below my alert line. My weekend revenue went up over 25%.",
    statNumber: "0 Stockouts",
    statLabel: "Across 40+ Items",
    rating: 5,
    tag: "Spices & Grains",
  },
  {
    id: "kemi",
    name: "Mama Kemi Adebayo",
    shop: "Ifeoluwa Storefront",
    location: "Bodija Market · Ibadan",
    image: "/images/hero-market-trader.jpg",
    headline: "“Even in the basement where cell network is completely dead, it never fails.”",
    story:
      "Other accounting apps freeze and spin when there is no 4G signal. Trackkit opens in half a second and saves every single sale instantly to my phone. When I get home to my WiFi, it backs up silently. That peace of mind is priceless.",
    statNumber: "100%",
    statLabel: "Offline Reliability",
    rating: 5,
    tag: "General Retail",
  },
];

export default function WelcomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeNavTab, setActiveNavTab] = useState<string>("inventory");

  // Interactive Live Stepper Demo state
  const [demoStockMilk, setDemoStockMilk] = useState(14);
  const [demoSalesCount, setDemoSalesCount] = useState(6);

  // Interactive Margin Matrix Playground state
  const [calcCost, setCalcCost] = useState<number>(800);
  const [calcSelling, setCalcSelling] = useState<number>(1200);
  const [selectedProductPreset, setSelectedProductPreset] = useState<string>("rice");

  const calcProfit = calcSelling - calcCost;
  const calcMarginPct = calcSelling > 0 ? Math.round((calcProfit / calcSelling) * 100) : 0;

  const currentStory = TESTIMONIALS[activeTestimonial];

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
      {/* 1. MONZO HERO SECTION (Clean Split Layout with In-App UI Showcase) */}
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

              <h1 className="font-display text-[42px] sm:text-[58px] lg:text-[64px] font-extrabold leading-[1.04] tracking-[-0.045em] text-heading-charcoal">
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

            {/* Hero Right: Sleek Monzo-Style Smartphone UI Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md">
                {/* Backdrop Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--color-hot-coral)]/15 to-[var(--color-grass-green)]/15 rounded-3xl blur-2xl -z-10" />

                {/* Smartphone Device Frame */}
                <div className="rounded-[36px] border-[6px] border-[#112231] bg-[#091723] p-3.5 shadow-2xl overflow-hidden">
                  {/* Phone Screen Container */}
                  <div className="rounded-[26px] bg-[var(--surface-canvas)] p-4 text-heading-charcoal overflow-hidden border border-[var(--border-hairline)]">
                    {/* Top App Status Header */}
                    <div className="flex items-center justify-between mb-3 border-b border-[var(--border-hairline)] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[var(--color-hot-coral)] flex items-center justify-center text-white font-extrabold text-[12px]">
                          AO
                        </div>
                        <div>
                          <p className="font-display font-extrabold text-[13px] leading-none">Adesola Provisions</p>
                          <p className="text-[10px] text-muted-gray mt-0.5">Balogun Market · Lagos</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-grass-green)]/15 px-2 py-0.5 text-[10px] font-extrabold text-[var(--color-grass-green)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-grass-green)] animate-pulse" />
                        Offline Ready
                      </span>
                    </div>

                    {/* Signature Monzo Hot Coral Sunset Balance Card */}
                    <div className="monzo-coral-card p-4 rounded-2xl shadow-coral text-white relative mb-3">
                      <div className="flex items-center justify-between text-[11px] font-bold opacity-90 mb-1">
                        <span>SHOP INVENTORY</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold">Live</span>
                      </div>
                      <p className="text-[11px] opacity-85">Total Stock Worth</p>
                      <p className="numo-display text-[26px] font-extrabold text-white mt-0.5">
                        ₦1,042,500
                      </p>
                      <div className="flex gap-2 mt-2.5">
                        <button type="button" className="monzo-pill bg-white text-[#091723] text-[11px] font-extrabold px-3 py-1 shadow-xs">
                          + Restock
                        </button>
                        <button type="button" className="monzo-pill bg-black/25 text-white text-[11px] font-bold px-3 py-1">
                          Log Sale
                        </button>
                      </div>
                    </div>

                    {/* In-App Live Activity List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-gray uppercase">
                        <span>Recent Sales</span>
                        <span className="text-[var(--color-hot-coral)]">View All</span>
                      </div>

                      {/* Item 1 */}
                      <div className="flex items-center justify-between rounded-xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-grass-green)]/15 text-[14px]">
                            🍚
                          </span>
                          <div>
                            <p className="text-[12px] font-bold">Dangote Granulated Sugar</p>
                            <p className="text-[10px] text-muted-gray">Sale · ×2 units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-extrabold text-[var(--color-grass-green)] font-display">+₦1,500</p>
                          <span className="text-[9px] font-extrabold text-[var(--color-grass-green)] bg-[var(--color-grass-green)]/15 px-1.5 py-0.5 rounded-full">
                            50% Margin
                          </span>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-center justify-between rounded-xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-hot-coral)]/15 text-[14px]">
                            🥛
                          </span>
                          <div>
                            <p className="text-[12px] font-bold">Peak Evaporated Milk</p>
                            <p className="text-[10px] text-muted-gray">Restock · ×20 Tins</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-extrabold text-heading-charcoal font-display">-₦16,000</p>
                          <span className="text-[9px] font-extrabold text-[var(--color-alert-red)] bg-[var(--color-alert-red)]/15 px-1.5 py-0.5 rounded-full">
                            1.25% Margin
                          </span>
                        </div>
                      </div>
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
      <section className="py-10 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-[22px] sm:text-[24px] font-extrabold text-heading-charcoal tracking-tight">
              Tell me about...
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "inventory", label: "📦 Inventory Tracking", target: "#features" },
                { id: "margins", label: "💰 Margin Breakdown", target: "#margin-reality" },
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
      {/* 3. REWORKED SLEEK MARGIN REALITY SECTION (Visual Comparison Matrix) */}
      {/* ========================================================================= */}
      <section id="margin-reality" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          {/* Section Heading */}
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-14">
            <span className="text-[12px] font-extrabold text-[var(--color-hot-coral)] uppercase tracking-wider">
              The Reality of Retail Trading
            </span>
            <h2 className="font-display text-[34px] sm:text-[48px] font-extrabold tracking-tight text-heading-charcoal">
              You&rsquo;re Working Hard. But Are You Making Real Margin?
            </h2>
            <p className="text-[16px] sm:text-[18px] text-body-brown leading-relaxed">
              Without product margin visibility, fast-moving items can fool you into thinking you’re making money while tying down your entire working capital.
            </p>
          </div>

          {/* Side-by-Side Visual Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Card 1: Low-Margin Trap */}
            <div className="interactive-card rounded-cards border-2 border-[var(--color-alert-red)]/30 bg-[var(--surface-card)] p-7 shadow-subtle-3 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--color-alert-red)] text-white text-[11px] font-extrabold px-3.5 py-1 rounded-bl-xl uppercase tracking-wider">
                Low Margin Trap
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[28px]">🥛</span>
                  <div>
                    <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal">
                      Peak Evaporated Milk (160g)
                    </h3>
                    <p className="text-[12px] text-muted-gray">Fast turnover · Tiny margin</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[var(--surface-canvas)] rounded-2xl p-3.5 border border-[var(--border-hairline)] text-center">
                  <div>
                    <span className="text-[11px] text-muted-gray font-semibold">Cost Price</span>
                    <p className="text-[16px] font-extrabold text-heading-charcoal">₦800</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-gray font-semibold">Selling Price</span>
                    <p className="text-[16px] font-extrabold text-heading-charcoal">₦810</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--color-alert-red)] font-bold">Net Profit</span>
                    <p className="text-[16px] font-extrabold text-[var(--color-alert-red)]">+₦10</p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[12px] font-bold">
                    <span className="text-muted-gray">Gross Margin Percentage:</span>
                    <span className="text-[var(--color-alert-red)]">1.25% ⚠️</span>
                  </div>
                  <div className="w-full bg-[var(--border-hairline)] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--color-alert-red)] h-full w-[1.25%] min-w-[6px]" />
                  </div>
                </div>

                <div className="rounded-xl bg-[var(--color-alert-red)]/10 p-3.5 border border-[var(--color-alert-red)]/20 text-[13px] text-body-brown leading-relaxed">
                  <strong className="text-[var(--color-alert-red)]">The Catch:</strong> You must sell <strong>100 tins</strong> to make <strong>₦1,000 profit</strong> while committing <strong>₦80,000</strong> in capital.
                </div>
              </div>
            </div>

            {/* Card 2: High-Margin Engine */}
            <div className="interactive-card rounded-cards border-2 border-[var(--color-grass-green)]/40 bg-[var(--surface-card)] p-7 shadow-subtle-3 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[var(--color-grass-green)] text-white text-[11px] font-extrabold px-3.5 py-1 rounded-bl-xl uppercase tracking-wider">
                High Margin Engine
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[28px]">🍚</span>
                  <div>
                    <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal">
                      Dangote Granulated Sugar (500g)
                    </h3>
                    <p className="text-[12px] text-muted-gray">Steady demand · High margin</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[var(--surface-canvas)] rounded-2xl p-3.5 border border-[var(--border-hairline)] text-center">
                  <div>
                    <span className="text-[11px] text-muted-gray font-semibold">Cost Price</span>
                    <p className="text-[16px] font-extrabold text-heading-charcoal">₦500</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-gray font-semibold">Selling Price</span>
                    <p className="text-[16px] font-extrabold text-heading-charcoal">₦750</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--color-grass-green)] font-bold">Net Profit</span>
                    <p className="text-[16px] font-extrabold text-[var(--color-grass-green)]">+₦250</p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[12px] font-bold">
                    <span className="text-muted-gray">Gross Margin Percentage:</span>
                    <span className="text-[var(--color-grass-green)]">33.3% 🟢</span>
                  </div>
                  <div className="w-full bg-[var(--border-hairline)] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--color-grass-green)] h-full w-[33.3%]" />
                  </div>
                </div>

                <div className="rounded-xl bg-[var(--color-grass-green)]/10 p-3.5 border border-[var(--color-grass-green)]/20 text-[13px] text-body-brown leading-relaxed">
                  <strong className="text-[var(--color-grass-green)]">The Trackkit Insight:</strong> Selling just <strong>4 bags</strong> earns the exact same <strong>₦1,000 profit</strong> with only <strong>₦2,000 capital committed</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Margin Playground Widget */}
          <div className="mt-12 max-w-4xl mx-auto rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card-secondary)] p-6 sm:p-8 shadow-subtle-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display text-[20px] font-extrabold text-heading-charcoal flex items-center gap-2">
                  <Sliders size={20} className="text-[var(--color-hot-coral)]" /> Test Your Own Product Margin
                </h3>
                <p className="text-[13px] text-body-brown">
                  Select a product or adjust the numbers to see your live profit percentage.
                </p>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
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
                    className={`monzo-pill px-3 py-1 text-[12px] font-bold cursor-pointer transition-all ${
                      selectedProductPreset === item.id
                        ? "bg-ink-black text-[var(--color-ink-black-text)] shadow-2xs"
                        : "bg-[var(--surface-card)] text-heading-charcoal border border-[var(--border-hairline)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-[var(--surface-card)] p-5 rounded-2xl border border-[var(--border-hairline)]">
              <div>
                <label className="block text-[12px] font-bold text-muted-gray mb-1">
                  Supplier Cost Price (₦)
                </label>
                <input
                  type="number"
                  value={calcCost}
                  onChange={(e) => setCalcCost(Number(e.target.value) || 0)}
                  className="w-full bg-[var(--surface-canvas)] border border-[var(--border-hairline)] rounded-xl px-3.5 py-2.5 text-[16px] font-extrabold text-heading-charcoal outline-none focus:border-[var(--color-hot-coral)]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-gray mb-1">
                  Retail Selling Price (₦)
                </label>
                <input
                  type="number"
                  value={calcSelling}
                  onChange={(e) => setCalcSelling(Number(e.target.value) || 0)}
                  className="w-full bg-[var(--surface-canvas)] border border-[var(--border-hairline)] rounded-xl px-3.5 py-2.5 text-[16px] font-extrabold text-heading-charcoal outline-none focus:border-[var(--color-hot-coral)]"
                />
              </div>

              <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-[var(--border-hairline)] pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[12px] font-bold text-muted-gray">Calculated Margin:</span>
                <p
                  className={`numo-display text-[28px] font-extrabold ${
                    calcMarginPct >= 30
                      ? "text-[var(--color-grass-green)]"
                      : calcMarginPct >= 10
                      ? "text-[var(--color-gold)]"
                      : "text-[var(--color-alert-red)]"
                  }`}
                >
                  +{calcMarginPct}%
                </p>
                <p className="text-[12px] font-bold text-heading-charcoal">
                  +₦{calcProfit.toLocaleString()} profit / item
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MONZO BENTO FEATURE GRID */}
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
                <div className="numo-display text-[30px] font-extrabold my-2 text-heading-charcoal">
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
      {/* 5. MULTI-TRADER TESTIMONIALS (Interactive Stories Gallery) */}
      {/* ========================================================================= */}
      <section id="stories" className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)]/15 px-3.5 py-1 text-[12px] font-extrabold text-[var(--color-gold)]">
              <Star weight="fill" size={14} /> 5.0 Rating Across 2,000+ Retailers
            </div>
            <h2 className="font-display text-[34px] sm:text-[48px] font-extrabold tracking-tight text-heading-charcoal">
              Real Market Traders. Real Results.
            </h2>
            <p className="text-[16px] sm:text-[18px] text-body-brown">
              See how market women across West Africa are growing their weekly margin.
            </p>
          </div>

          {/* Interactive Story Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-5xl mx-auto rounded-containers border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-10 shadow-subtle-3">
            {/* Left Portrait */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-[340px] sm:h-[400px] w-full rounded-2xl overflow-hidden border border-[var(--border-hairline)] shadow-md">
                <Image
                  src={currentStory.image}
                  alt={currentStory.name}
                  fill
                  className="object-cover transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[var(--color-hot-coral)] px-2.5 py-0.5 rounded-full mb-1 inline-block">
                    {currentStory.tag}
                  </span>
                  <p className="font-display font-extrabold text-[20px]">{currentStory.name}</p>
                  <p className="text-[12px] text-white/80">{currentStory.location}</p>
                </div>
              </div>
            </div>

            {/* Right Story & Metric */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-1 text-[var(--color-gold)]">
                {[...Array(currentStory.rating)].map((_, i) => (
                  <Star key={i} weight="fill" size={18} />
                ))}
              </div>

              <h3 className="font-display text-[26px] sm:text-[34px] font-extrabold tracking-tight text-heading-charcoal leading-snug">
                {currentStory.headline}
              </h3>

              <p className="text-[15px] sm:text-[16px] text-body-brown leading-relaxed">
                {currentStory.story}
              </p>

              <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between">
                <div>
                  <p className="numo-heading text-[28px] font-extrabold text-[var(--color-grass-green)]">
                    {currentStory.statNumber}
                  </p>
                  <p className="text-[12px] font-semibold text-muted-gray">{currentStory.statLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-grass-green)]/15 text-[var(--color-grass-green)]">
                    <UserCheck size={16} weight="bold" />
                  </span>
                  <span className="text-[12px] font-bold text-heading-charcoal">Verified Trader</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Trader Switcher Tabs */}
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            {TESTIMONIALS.map((t, idx) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTestimonial(idx)}
                className={`monzo-pill flex items-center gap-2.5 px-4 py-2 text-[13px] font-bold cursor-pointer transition-all ${
                  activeTestimonial === idx
                    ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-sm"
                    : "bg-[var(--surface-card)] text-heading-charcoal border border-[var(--border-hairline)] hover:bg-[var(--surface-card-secondary)]"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-[var(--color-hot-coral)]" />
                <span>{t.name} ({t.location.split("·")[1]?.trim() || t.location})</span>
              </button>
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
