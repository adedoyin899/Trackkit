"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Storefront,
  Lightning,
  Coins,
  Sparkle,
  CloudArrowUp,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  TrendUp,
  Package,
  Minus,
  Plus,
} from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function WelcomePage() {
  const [demoStock, setDemoStock] = useState(42);
  const [demoSales, setDemoSales] = useState(8);

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-heading-charcoal">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-[var(--surface-card)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-black text-[var(--color-ink-black-text)] shadow-sm">
              <Storefront weight="fill" size={20} />
            </span>
            <span className="font-display text-[22px] font-bold tracking-tight text-heading-charcoal">
              Trackkit
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="hidden text-[14px] font-semibold text-body-brown hover:text-heading-charcoal sm:block transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 rounded-buttons bg-ink-black px-4 py-2.5 text-[14px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 transition-opacity shadow-subtle-3"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-grass-green)]/30 bg-[var(--color-grass-green)]/10 px-3.5 py-1 text-[13px] font-semibold text-[var(--color-grass-green)]">
              <Lightning weight="fill" size={14} />
              100% Offline-First Inventory Tracker
            </div>

            <h1 className="font-display text-[36px] font-bold leading-[1.15] tracking-tight text-heading-charcoal sm:text-[54px]">
              Smart Inventory & Profit Tracker for Nigerian Market Retailers
            </h1>

            <p className="text-[17px] text-muted-gray leading-relaxed max-w-2xl mx-auto">
              Track daily sales, calculate real Naira profit margins, get AI stock reorder alerts, and manage your shop with zero internet required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-buttons bg-[var(--color-ember-orange)] px-7 py-3.5 text-[16px] font-bold text-white shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                Open My Shop Free <ArrowRight size={18} />
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-card)] px-6 py-3.5 text-[15px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors cursor-pointer"
              >
                Try Live Workspace Demo
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-[13px] text-muted-gray pt-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle weight="fill" className="text-[var(--color-grass-green)]" /> No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck weight="fill" className="text-[var(--color-link-blue)]" /> Instant 0ms load speed
              </span>
            </div>
          </div>

          {/* Interactive Live Card Demo Section */}
          <div className="mt-14 mx-auto max-w-4xl rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[var(--border-hairline)] pb-6">
              <div>
                <span className="text-[12px] font-bold text-muted-gray uppercase tracking-wider">
                  Interactive Preview
                </span>
                <h3 className="mt-1 text-[22px] font-bold text-heading-charcoal">
                  Experience How Fast Logging Sales Is
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--color-grass-green)]/15 px-3 py-1 text-[12px] font-bold text-[var(--color-grass-green)]">
                  Live Stock Active
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Product Card Demo */}
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={20} className="text-heading-charcoal" />
                    <span className="text-[17px] font-bold text-heading-charcoal uppercase">
                      PEPSI BOTTLE (50CL)
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--color-grass-green)]/15 px-2.5 py-0.5 text-[12px] font-bold text-[var(--color-grass-green)]">
                    33% Margin
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-[40px] font-bold text-heading-charcoal leading-none">
                    {demoStock}
                  </span>
                  <span className="text-[13px] text-muted-gray">crates in stock</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (demoStock > 0) {
                        setDemoStock((s) => s - 1);
                        setDemoSales((s) => s + 1);
                      }
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-buttons bg-[var(--color-alert-red)] py-2.5 text-[15px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Minus size={16} /> 1 Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoStock((s) => s + 1)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-buttons bg-[var(--color-grass-green)] py-2.5 text-[15px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Plus size={16} /> 1 Restock
                  </button>
                </div>
              </div>

              {/* Real-time Profit Preview */}
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-card-secondary)] p-5 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-[13px] font-semibold uppercase text-muted-gray tracking-wider">
                    Calculated Profit
                  </h4>
                  <div className="mt-2 text-[32px] font-bold text-heading-charcoal">
                    ₦{(demoSales * 1200).toLocaleString("en-NG")}
                  </div>
                  <p className="text-[13px] text-muted-gray mt-1">
                    Based on ₦3,600 cost price & ₦4,800 selling price.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-grass-green)]">
                  <TrendUp size={16} /> Instant 0ms profit recalculation on every sale
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="border-t border-[var(--border-hairline)] bg-[var(--surface-card)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-[28px] font-bold text-heading-charcoal sm:text-[36px]">
              Built Specifically for Retail & Market Businesses
            </h2>
            <p className="mt-2 text-[15px] text-muted-gray">
              Everything you need to keep your shop profitable and organized.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-6 space-y-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-ember-orange)]/15 text-ember-orange">
                <Lightning size={22} />
              </span>
              <h3 className="text-[18px] font-bold text-heading-charcoal">0ms Offline Speed</h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                IndexedDB local database keeps working seamlessly even when mobile network fails or goes offline.
              </p>
            </div>

            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-6 space-y-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-grass-green)]/15 text-[var(--color-grass-green)]">
                <Coins size={22} />
              </span>
              <h3 className="text-[18px] font-bold text-heading-charcoal">Real Naira Margins</h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                Automatic profit margin breakdown per item so you know exact profit margins before repricing.
              </p>
            </div>

            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-6 space-y-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-link-blue)]/15 text-[var(--color-link-blue)]">
                <Sparkle size={22} />
              </span>
              <h3 className="text-[18px] font-bold text-heading-charcoal">AI Stock Copilot</h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                Ask questions about your best-selling items, low stock warnings, and optimal reorder quantities.
              </p>
            </div>

            <div className="rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-6 space-y-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
                <CloudArrowUp size={22} />
              </span>
              <h3 className="text-[18px] font-bold text-heading-charcoal">CSV Export & Cloud Backup</h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                One-tap CSV backups and optional phone/Google cloud syncing across all your devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="border-t border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 text-center space-y-6">
          <h2 className="text-[26px] font-bold text-heading-charcoal">Ready to manage your shop smarter?</h2>
          <div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-buttons bg-ink-black px-8 py-3.5 text-[16px] font-bold text-[var(--color-ink-black-text)] hover:opacity-90 transition-opacity"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
          </div>
          <p className="text-[12px] text-muted-gray pt-4">
            © {new Date().getFullYear()} Trackkit. Built for retail shop owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
