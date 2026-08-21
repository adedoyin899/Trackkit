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
} from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "Do I need internet?",
    a: "No. Tracckit works completely offline. You can add products, log sales, and track stock without any internet connection. When you're online, your data syncs automatically to the cloud.",
  },
  {
    q: "What if my phone breaks or gets lost?",
    a: "Your data is safe. With Pro, everything syncs to the cloud automatically. Just log into your account on a new phone and everything is there. Even with Free tier, you can export your data as a CSV backup anytime.",
  },
  {
    q: "Is Tracckit really free?",
    a: "Yes. The Free tier is free forever. No credit card needed. Add unlimited products, track unlimited sales, get low-stock alerts. Pro (₦500/month) adds cost tracking, profit margins, and cloud sync—but only if you want it.",
  },
  {
    q: "How long does it take to set up?",
    a: "3 minutes. Download, add your products, start tracking. That's it. No training needed.",
  },
  {
    q: "Can I use Tracckit on two phones?",
    a: "With Pro, yes. Your account syncs across devices. With Free, each phone has its own data locally.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Only you can see your data. We don't sell it, share it, or use it for anything other than backing it up. We follow GDPR and Nigerian data protection rules.",
  },
  {
    q: "What if I don't like it?",
    a: "No problem. Cancel anytime. Free tier stays free forever. Pro has no lock-in—cancel and your data is always exported.",
  },
  {
    q: "How do I contact support?",
    a: "Email us at hello@tracckit.app or message our Telegram group. We respond within 24 hours.",
  },
];

export default function WelcomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoStockMilk, setDemoStockMilk] = useState(14);
  const [demoSalesMilk, setDemoSalesMilk] = useState(6);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-heading-charcoal font-sans selection:bg-[var(--color-sun-yellow)] selection:text-heading-charcoal">
      {/* STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-hot-coral)] text-white shadow-coral">
              <Storefront weight="fill" size={20} />
            </span>
            <span className="font-display text-[22px] font-extrabold tracking-tight text-heading-charcoal">
              Trackkit
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="hidden sm:block text-[14px] font-bold text-body-brown hover:text-heading-charcoal transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="monzo-pill flex items-center gap-1.5 bg-ink-black px-5 py-2.5 text-[14px] font-bold text-[var(--color-ink-black-text)] hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-[var(--border-hairline)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-grass-green)]/30 bg-[var(--color-grass-green)]/10 px-4 py-1.5 text-[13px] font-bold text-[var(--color-grass-green)]">
                <Lightning weight="fill" size={15} />
                100% Offline-First Inventory Tracker
              </div>

              <h1 className="font-display text-[38px] sm:text-[56px] font-extrabold leading-[1.08] tracking-[-0.035em] text-heading-charcoal">
                Know Your Stock. <br />
                Know Your Profit. <br />
                <span className="text-[var(--color-hot-coral)]">No Internet? No Problem.</span>
              </h1>

              <p className="text-[17px] sm:text-[19px] text-body-brown leading-relaxed max-w-2xl">
                The app that helps market traders track inventory, see real profit margins, and make smarter buying decisions—all offline, completely free to start.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/onboarding"
                  id="download"
                  className="monzo-pill flex items-center justify-center gap-2 bg-[var(--color-hot-coral)] px-8 py-3.5 text-[16px] font-extrabold text-white shadow-coral hover:opacity-95 transition-opacity cursor-pointer text-center"
                >
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link
                  href="/"
                  className="monzo-pill flex items-center justify-center gap-2 border border-[var(--border-hairline)] bg-[var(--surface-card-secondary)] px-6 py-3.5 text-[15px] font-bold text-heading-charcoal hover:bg-[var(--surface-card)] transition-colors cursor-pointer text-center"
                >
                  Try Workspace Demo
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-[13px] font-medium text-muted-gray pt-3">
                <span className="flex items-center gap-1.5">
                  <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> No credit card needed
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck weight="fill" className="text-[var(--color-link-blue)]" /> Works 100% offline
                </span>
                <span className="flex items-center gap-1.5">
                  <Star weight="fill" className="text-[var(--color-gold)]" /> 2,000+ market traders
                </span>
              </div>
            </div>

            {/* Hero Right Visual & Illustration */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-4 shadow-lg overflow-hidden">
                <div className="relative h-[340px] w-full rounded-lg overflow-hidden border border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
                  <Image
                    src="/images/hero-illustration.png"
                    alt="Market woman using Tracckit app"
                    fill
                    priority
                    className="object-cover"
                  />
                </div>

                {/* Floating Mock Badge */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-3 shadow-subtle-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-grass-green)]/20 text-[var(--color-grass-green)] font-bold text-[12px]">
                      50%
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-heading-charcoal">Sugar Margin: 50% 🟢</p>
                      <p className="text-[11px] text-muted-gray">₦50 Cost · ₦75 Selling</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-ink-black px-3 py-1 text-[11px] font-bold text-[var(--color-ink-black-text)]">
                    Real Profit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE PROBLEM YOU KNOW */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <span className="text-[12px] font-bold text-[var(--color-ember-orange)] uppercase tracking-wider">
              The Problem You Know
            </span>
            <h2 className="font-display text-[32px] sm:text-[44px] font-bold tracking-tight text-heading-charcoal">
              You&rsquo;re Losing Money Without Even Knowing It
            </h2>
            <p className="text-[17px] text-body-brown leading-relaxed">
              Every week, you&rsquo;re working hard. Restocking at dawn. Selling all day. Counting money at night. But somewhere in between, profit is slipping away.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            {/* Story Box */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-4 shadow-subtle-3">
              <p className="text-[16px] text-body-brown leading-relaxed">
                You remember buying milk at ₦800, selling at ₦810. That&rsquo;s barely ₦10 per tin. Meanwhile, sugar is ₦50 cost, ₦75 selling—that&rsquo;s real money.
              </p>
              <p className="text-[16px] font-semibold text-heading-charcoal">
                But which one are you actually restocking? Which one is taking up your time?
              </p>
              <div className="rounded-xl border border-[var(--color-alert-red)]/30 bg-[var(--color-alert-red)]/10 p-4 text-[14px] font-bold text-[var(--color-alert-red)] flex items-center gap-2">
                <Warning size={20} />
                Without seeing the numbers, you&rsquo;re flying blind.
              </div>
            </div>

            {/* Pain Points List */}
            <div className="space-y-3">
              {[
                { title: "Forgotten restocks", desc: "You run out of your best sellers mid-week and lose sales." },
                { title: "No margin visibility", desc: "Some products might be losing you money and you don't even know." },
                { title: "Buying guesses", desc: "You restock based on habit, not data. Sometimes you over-buy slow items." },
                { title: "Paper records fail", desc: "Lists get lost, numbers get illegible, you can't remember last week's prices." },
                { title: "No internet? You're stuck", desc: "Most tools need WiFi. Markets don't have WiFi." },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-4 shadow-subtle-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-ember-orange)]/15 text-[var(--color-ember-orange)] font-bold text-[12px]">
                    ✕
                  </span>
                  <div>
                    <h4 className="text-[15px] font-bold text-heading-charcoal">{item.title}</h4>
                    <p className="text-[13px] text-muted-gray">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emotional Anchor */}
          <div className="mt-12 text-center max-w-2xl mx-auto rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 shadow-subtle-3">
            <p className="text-[16px] text-body-brown">
              You didn&rsquo;t start this business to break even. You started it to provide for your family, to build something.
            </p>
            <p className="mt-2 text-[18px] font-bold text-heading-charcoal">
              You deserve to know if your work is actually paying off.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: MEET TRACCKIT */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-link-blue)]/30 bg-[var(--color-link-blue)]/10 px-4 py-1.5 text-[13px] font-bold text-[var(--color-link-blue)]">
            Designed for African Markets
          </div>

          <h2 className="font-display text-[34px] sm:text-[48px] font-bold tracking-tight text-heading-charcoal max-w-3xl mx-auto">
            Finally, An App Built For You
          </h2>

          <p className="text-[18px] text-body-brown max-w-2xl mx-auto leading-relaxed">
            Tracckit is the inventory and profit tracker built specifically for market women. Not enterprise software. Not some tool designed for formal retail shops. <strong className="text-heading-charcoal">This is for you.</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto pt-6 text-left">
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 space-y-2 shadow-subtle-3">
              <h3 className="text-[18px] font-bold text-heading-charcoal flex items-center gap-2">
                <Lightning weight="fill" className="text-[var(--color-grass-green)]" /> Works 100% Offline
              </h3>
              <p className="text-[14px] text-muted-gray">
                Completely offline. No internet, no problem. Add products, log sales, track restocks—all happen on your phone, all the time.
              </p>
            </div>
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 space-y-2 shadow-subtle-3">
              <h3 className="text-[18px] font-bold text-heading-charcoal flex items-center gap-2">
                <CloudArrowUp weight="fill" className="text-[var(--color-link-blue)]" /> Automatic Cloud Backup
              </h3>
              <p className="text-[14px] text-muted-gray">
                When you&rsquo;re online, everything syncs to the cloud automatically. Your data is safe. Your backup is ready.
              </p>
            </div>
          </div>

          <p className="italic text-[16px] font-medium text-body-brown pt-4">
            Simple. Free to start. Designed for African markets.
          </p>
        </div>
      </section>

      {/* SECTION 3: WHAT TRACCKIT DOES */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[12px] font-bold text-[var(--color-grass-green)] uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="font-display text-[34px] sm:text-[48px] font-bold tracking-tight text-heading-charcoal">
              Three Simple Things That Change Everything
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-4 shadow-subtle-3 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-black text-[var(--color-ink-black-text)]">
                  <Package size={24} />
                </span>
                <h3 className="text-[22px] font-bold text-heading-charcoal">1. Know Your Stock</h3>
                <p className="text-[14px] text-body-brown leading-relaxed">
                  Add your products once. See how many tins of milk, bags of sugar, cartons of noodles you have right now.
                </p>
                <p className="text-[13px] text-muted-gray">
                  Quick buttons: tap &ldquo;-1&rdquo; when you sell, &ldquo;+1&rdquo; when you restock. That&rsquo;s it. No counting. No guessing.
                </p>
              </div>

              {/* Interactive Mini Demo */}
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-heading-charcoal">MILK (50g)</span>
                  <span className="text-[12px] font-bold text-[var(--color-grass-green)]">{demoStockMilk} in stock</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (demoStockMilk > 0) {
                        setDemoStockMilk((s) => s - 1);
                        setDemoSalesMilk((s) => s + 1);
                      }
                    }}
                    className="flex-1 rounded-lg bg-[var(--color-alert-red)] py-2 text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
                  >
                    -1 Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoStockMilk((s) => s + 1)}
                    className="flex-1 rounded-lg bg-[var(--color-grass-green)] py-2 text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
                  >
                    +1 Restock
                  </button>
                </div>
              </div>

              <div className="border-t border-[var(--border-hairline)] pt-3 text-[13px] font-bold text-[var(--color-grass-green)]">
                Result: No more stock-outs on best sellers. No over-buying slow items.
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-4 shadow-subtle-3 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-grass-green)]/15 text-[var(--color-grass-green)]">
                  <Coins size={24} />
                </span>
                <h3 className="text-[22px] font-bold text-heading-charcoal">2. Know Your Profit</h3>
                <p className="text-[14px] text-body-brown leading-relaxed">
                  Enter what you paid the supplier. Enter what you&rsquo;re selling for. Tracckit shows you the margin—instantly.
                </p>

                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between rounded-lg bg-[var(--surface-canvas)] p-2">
                    <span>Milk (₦800 cost, ₦810 sell)</span>
                    <span className="font-bold text-[var(--color-alert-red)]">1.25% 🔴</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[var(--surface-canvas)] p-2">
                    <span>Sugar (₦50 cost, ₦75 sell)</span>
                    <span className="font-bold text-[var(--color-grass-green)]">50% 🟢</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-[var(--surface-canvas)] p-2">
                    <span>Noodles (₦80 cost, ₦120 sell)</span>
                    <span className="font-bold text-[var(--color-grass-green)]">50% 🟢</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border-hairline)] pt-3 text-[13px] font-bold text-[var(--color-link-blue)]">
                Result: Gain ₦2,000–₦5,000 extra profit per week by focusing on high-margin stock.
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-4 shadow-subtle-3 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-link-blue)]/15 text-[var(--color-link-blue)]">
                  <CloudArrowUp size={24} />
                </span>
                <h3 className="text-[22px] font-bold text-heading-charcoal">3. Sync & Backup</h3>
                <p className="text-[14px] text-body-brown leading-relaxed">
                  Your phone might break. But your data won&rsquo;t.
                </p>
                <p className="text-[13px] text-muted-gray">
                  Tracckit syncs everything to the cloud—automatically when online. Switch to a new phone? Log in and everything is there.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-4 text-[13px] font-semibold text-heading-charcoal flex items-center gap-2">
                <ShieldCheck size={20} className="text-[var(--color-grass-green)]" />
                Automatic cloud encryption & CSV export support.
              </div>

              <div className="border-t border-[var(--border-hairline)] pt-3 text-[13px] font-bold text-heading-charcoal">
                Result: Complete peace of mind. Your business records are protected.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="font-display text-[34px] sm:text-[44px] font-bold tracking-tight text-heading-charcoal">
              Get Started in 3 Minutes
            </h2>
            <p className="text-[15px] text-muted-gray">No training required. Simple and instant.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 space-y-3 shadow-subtle-3 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-black text-[var(--color-ink-black-text)] font-bold">
                1
              </span>
              <h3 className="text-[18px] font-bold text-heading-charcoal">Step 1: Download</h3>
              <p className="text-[14px] text-muted-gray">
                Get Tracckit on your phone. Free. No credit card needed.
              </p>
            </div>

            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 space-y-3 shadow-subtle-3 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-black text-[var(--color-ink-black-text)] font-bold">
                2
              </span>
              <h3 className="text-[18px] font-bold text-heading-charcoal">Step 2: Add Products</h3>
              <p className="text-[14px] text-muted-gray">
                Enter Milk, Sugar, Noodles, Flour, Spices. Takes 2 minutes.
              </p>
            </div>

            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 space-y-3 shadow-subtle-3 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-black text-[var(--color-ink-black-text)] font-bold">
                3
              </span>
              <h3 className="text-[18px] font-bold text-heading-charcoal">Step 3: Start Tracking</h3>
              <p className="text-[14px] text-muted-gray">
                Tap &ldquo;-1&rdquo; when you sell. Tap &ldquo;+1&rdquo; when you restock. That&rsquo;s your day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: WHAT MARKET WOMEN SAY (TESTIMONIALS & STATS) */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]" id="testimonials">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-[12px] font-bold text-[var(--color-link-blue)] uppercase tracking-wider">
              Success Stories
            </span>
            <h2 className="font-display text-[34px] sm:text-[44px] font-bold tracking-tight text-heading-charcoal">
              Real People, Real Results
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {/* Testimonial 1 */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 space-y-4 shadow-subtle-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-[var(--color-gold)] gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} weight="fill" size={16} />
                  ))}
                </div>
                <p className="text-[14px] text-body-brown italic leading-relaxed">
                  &ldquo;I was selling milk and sugar side by side, but I had no idea which one was actually making me money. Tracckit showed me that milk was barely 1% margin. I raised the price to ₦850 and didn&rsquo;t lose any customers. Now I make ₦3,000 more every week just from milk.&rdquo;
                </p>
              </div>
              <div className="border-t border-[var(--border-hairline)] pt-3">
                <p className="text-[14px] font-bold text-heading-charcoal">Amara, Lagos</p>
                <p className="text-[12px] text-muted-gray">Selling dairy products for 8 years</p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 space-y-4 shadow-subtle-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-[var(--color-gold)] gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} weight="fill" size={16} />
                  ))}
                </div>
                <p className="text-[14px] text-body-brown italic leading-relaxed">
                  &ldquo;I used to write everything on paper. Lists would get lost, I&rsquo;d forget quantities, suppliers would change prices and I wouldn&rsquo;t track it. Now everything is in my phone. I know exactly how much inventory I have, what I paid for it, and what I&rsquo;m selling it for.&rdquo;
                </p>
              </div>
              <div className="border-t border-[var(--border-hairline)] pt-3">
                <p className="text-[14px] font-bold text-heading-charcoal">Esinam, Accra</p>
                <p className="text-[12px] text-muted-gray">Selling FMCG and spices</p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 space-y-4 shadow-subtle-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-[var(--color-gold)] gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} weight="fill" size={16} />
                  ))}
                </div>
                <p className="text-[14px] text-body-brown italic leading-relaxed">
                  &ldquo;The low-stock alerts saved me. My phone tells me when I&rsquo;m running low on popular items. I restock before I run out—no more stock-outs mid-week. My sales went up ₦500 per day just from that one feature.&rdquo;
                </p>
              </div>
              <div className="border-t border-[var(--border-hairline)] pt-3">
                <p className="text-[14px] font-bold text-heading-charcoal">Zainab, Kumasi</p>
                <p className="text-[12px] text-muted-gray">Selling noodles, sugar, flour</p>
              </div>
            </div>
          </div>

          {/* Social Proof Stats Banner */}
          <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-8 shadow-subtle-3 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-[32px] font-bold text-heading-charcoal">2,000+</p>
                <p className="text-[13px] text-muted-gray">Market women using Tracckit</p>
              </div>
              <div>
                <p className="text-[32px] font-bold text-[var(--color-grass-green)]">₦150M</p>
                <p className="text-[13px] text-muted-gray">Tracked inventory volume</p>
              </div>
              <div>
                <p className="text-[32px] font-bold text-[var(--color-ember-orange)]">₦45k+</p>
                <p className="text-[13px] text-muted-gray">Avg. weekly profit increase</p>
              </div>
              <div>
                <p className="text-[32px] font-bold text-[var(--color-link-blue)]">98%</p>
                <p className="text-[13px] text-muted-gray">Would recommend to a friend</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: PRICING (TWO TIERS) */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="font-display text-[34px] sm:text-[44px] font-bold tracking-tight text-heading-charcoal">
              Simple Pricing. No Surprises.
            </h2>
            <p className="text-[15px] text-muted-gray">Start 100% free. Upgrade only when you want profit intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-8 space-y-6 shadow-subtle-3 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="rounded-full bg-[var(--surface-canvas)] px-3 py-1 text-[12px] font-bold text-heading-charcoal border border-[var(--border-hairline)]">
                  Tier 1: Free
                </span>
                <h3 className="text-[28px] font-bold text-heading-charcoal">Forever Free</h3>
                <p className="text-[14px] text-body-brown">
                  Track your stock, set alerts, never forget a restock. All free. No credit card required.
                </p>

                <ul className="space-y-3 text-[14px] text-body-brown pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Unlimited products
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Unlimited sales tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Low-stock alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Works fully offline
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Manual data backup (CSV export)
                  </li>
                </ul>
              </div>

              <Link
                href="/onboarding"
                className="w-full flex items-center justify-center gap-2 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-3.5 text-[15px] font-bold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors cursor-pointer"
              >
                Start Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="rounded-cards border-2 border-[var(--color-ember-orange)] bg-[var(--surface-card)] p-8 space-y-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 rounded-full bg-[var(--color-ember-orange)] px-3 py-0.5 text-[11px] font-bold text-white">
                MOST POPULAR
              </div>

              <div className="space-y-4">
                <span className="rounded-full bg-[var(--color-ember-orange)]/15 px-3 py-1 text-[12px] font-bold text-[var(--color-ember-orange)]">
                  Tier 2: Pro
                </span>
                <div>
                  <h3 className="text-[28px] font-bold text-heading-charcoal">₦500 <span className="text-[16px] font-normal text-muted-gray">/ month</span></h3>
                  <p className="text-[12px] text-[var(--color-grass-green)] font-semibold mt-0.5">About ₦17 per day</p>
                </div>
                <p className="text-[14px] text-body-brown">
                  Most market women make back the cost in profit improvements within the first week.
                </p>

                <ul className="space-y-3 text-[14px] text-body-brown pt-2">
                  <li className="flex items-center gap-2 font-semibold text-heading-charcoal">
                    <CheckCircle weight="fill" className="text-[var(--color-ember-orange)]" /> Everything in Free, plus:
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Cost tracking & profit margins
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Purchase history & supplier trends
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Profit dashboard & AI insights
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> Automatic cloud sync across devices
                  </li>
                </ul>
              </div>

              <Link
                href="/onboarding"
                className="w-full flex items-center justify-center gap-2 rounded-buttons bg-ink-black py-3.5 text-[15px] font-bold text-[var(--color-ink-black-text)] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Try Pro Free for 7 Days
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: OFFLINE-FIRST REALITY */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 text-center space-y-6">
          <span className="text-[12px] font-bold text-[var(--color-ember-orange)] uppercase tracking-wider">
            The Differentiator
          </span>
          <h2 className="font-display text-[34px] sm:text-[44px] font-bold tracking-tight text-heading-charcoal">
            Works Everywhere. Even With No Internet.
          </h2>
          <p className="text-[17px] text-body-brown leading-relaxed">
            Your market might not have WiFi. Your location might have spotty connection. That&rsquo;s normal in West Africa.
          </p>
          <p className="text-[17px] text-body-brown leading-relaxed">
            Tracckit is built for this reality. Everything works offline. Add products. Log sales. Track stock. All offline, all the time.
          </p>
          <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 shadow-subtle-3 text-left space-y-2">
            <p className="text-[15px] font-bold text-heading-charcoal">
              No other app does this. That&rsquo;s why Tracckit is different.
            </p>
            <p className="text-[13px] text-muted-gray">
              When you&rsquo;re online, everything syncs to the cloud automatically. But if you&rsquo;re offline? Tracckit keeps working. Your data is safe locally until it syncs.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8: FAQ ACCORDION */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-canvas)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="font-display text-[34px] sm:text-[44px] font-bold tracking-tight text-heading-charcoal">
              Questions? We&rsquo;ve Got Answers.
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] overflow-hidden shadow-subtle-3 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-[16px] font-bold text-heading-charcoal cursor-pointer hover:bg-[var(--surface-canvas)] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <CaretUp size={18} /> : <CaretDown size={18} />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-[14px] text-body-brown leading-relaxed border-t border-[var(--border-hairline)] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 9: CONVERSION LADDER */}
      <section className="py-16 sm:py-24 border-b border-[var(--border-hairline)] bg-[var(--surface-card-secondary)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 text-center space-y-6">
          <h2 className="font-display text-[36px] sm:text-[50px] font-bold tracking-tight text-heading-charcoal">
            Ready to Stop Guessing?
          </h2>
          <p className="text-[18px] text-body-brown leading-relaxed max-w-2xl mx-auto">
            Tracckit is free to start. No risk. Download today, use it free, and see if it helps you track your stock and boost your profit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-buttons bg-ink-black px-8 py-4 text-[16px] font-bold text-[var(--color-ink-black-text)] shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a
              href="#testimonials"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-card)] px-6 py-4 text-[15px] font-semibold text-heading-charcoal hover:bg-[var(--surface-canvas)] transition-colors cursor-pointer"
            >
              Read Success Stories
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 10: FOOTER & FINAL CALL */}
      <footer className="bg-[var(--surface-canvas)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-[22px] font-bold text-heading-charcoal">
              Join 2,000+ market women who know their stock and their profit.
            </h3>
            <p className="text-[14px] text-muted-gray">
              Tracckit is free to download, free to use. No credit card. No commitment.
            </p>
          </div>

          <div className="flex justify-center gap-4 text-[13px] font-semibold text-body-brown">
            <Link href="/onboarding" className="hover:text-heading-charcoal">Download for iOS</Link>
            <span>·</span>
            <Link href="/onboarding" className="hover:text-heading-charcoal">Download for Android</Link>
          </div>

          <p className="text-[13px] text-muted-gray max-w-xl mx-auto leading-relaxed border-t border-[var(--border-hairline)] pt-6">
            Tracckit is built for market women in West Africa. Made for your market. Designed for your reality.
          </p>

          <p className="text-[12px] text-muted-gray">
            © {new Date().getFullYear()} Tracckit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
