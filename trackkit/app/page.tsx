"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CloudArrowUp,
  Gear,
  Package,
  Plus,
  SquaresFour,
  Storefront,
  SignIn,
  SignOut,
  Coins,
  ClockCounterClockwise,
  ChartLineUp,
  Sparkle,
  PaintBrush,
  type Icon,
} from "@phosphor-icons/react";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { useDatabaseStatus } from "@/lib/db-context";
import { useTrackkitStore, type Tab } from "@/lib/store";
import { sortByLowStockFirst } from "@/lib/product-utils";
import { ProductCard } from "@/components/ProductCard";
import { ProductForm } from "@/components/ProductForm";
import { Dashboard } from "@/components/Dashboard";
import { ExportButton } from "@/components/ExportButton";
import { useAuth } from "@/hooks/useAuth";
import { ProfitabilityDashboard } from "@/components/ProfitabilityDashboard";
import { PurchaseHistoryDashboard } from "@/components/PurchaseHistoryDashboard";
import { AIChat } from "@/components/AIChat";
import { TrendsView } from "@/components/TrendsView";
import { ThemeToggle } from "@/components/ThemeToggle";

import { ProductInspector } from "@/components/ProductInspector";

const TABS: { id: Tab; label: string; icon: Icon }[] = [
  { id: "dashboard", label: "Dashboard", icon: SquaresFour },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "margins", label: "Margins", icon: Coins },
  { id: "history", label: "History", icon: ClockCounterClockwise },
  { id: "trends", label: "Trends", icon: ChartLineUp },
  { id: "ai", label: "AI Copilot", icon: Sparkle },
  { id: "settings", label: "Settings", icon: Gear },
];

function InventoryTab() {
  const { products, isLoading } = useLocalInventory();
  const [showAddForm, setShowAddForm] = useState(false);
  const selectedProductId = useTrackkitStore((s) => s.selectedProductId);
  const setSelectedProductId = useTrackkitStore((s) => s.setSelectedProductId);
  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const sortedProducts = useMemo(() => sortByLowStockFirst(products), [products]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[19px] font-medium text-heading-charcoal">All Products</h2>
          <p className="text-[12px] text-muted-gray">Select any product card for instant desktop inspection and details.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-buttons bg-ink-black px-4 py-2 text-[14px] font-semibold text-[var(--color-ink-black-text)] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Plus /> Add Product
        </button>
      </div>

      {isLoading && <p className="text-[14px] text-muted-gray">Loading…</p>}

      {!isLoading && products.length === 0 && (
        <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-8 text-center shadow-subtle-3">
          <p className="text-[16px] text-body-brown">No products yet.</p>
          <p className="mt-1 text-[13px] text-muted-gray">
            Tap &ldquo;+ Add Product&rdquo; to start tracking your stock.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
            selectedProduct
              ? "lg:col-span-7 xl:col-span-8 lg:grid-cols-2"
              : "lg:col-span-12 lg:grid-cols-3 xl:grid-cols-3"
          }`}
        >
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Desktop Progressive Disclosure Inspector Panel */}
        {selectedProduct && (
          <div className="hidden lg:col-span-5 xl:col-span-4 lg:block">
            <ProductInspector
              product={selectedProduct}
              onClose={() => setSelectedProductId(null)}
            />
          </div>
        )}
      </div>

      {showAddForm && <ProductForm onClose={() => setShowAddForm(false)} />}
      {selectedProduct && (
        <div className="block lg:hidden">
          <ProductForm
            product={selectedProduct}
            onClose={() => setSelectedProductId(null)}
          />
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const shopName = useTrackkitStore((s) => s.shopName);
  const setShopName = useTrackkitStore((s) => s.setShopName);
  const { user, logout, isLoading: isLoggingOut } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-5 shadow-subtle-3">
        <h3 className="mb-3 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <PaintBrush /> Appearance & Theme
        </h3>
        <p className="mb-3 text-[13px] text-muted-gray">
          Choose light mode, dark mode, or follow your system preference.
        </p>
        <ThemeToggle variant="full" />
      </div>

      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-5 shadow-subtle-3">
        <label className="flex items-center gap-1.5 text-[13px] font-medium text-body-brown">
          <Storefront /> Shop Name
        </label>
        <input
          value={shopName ?? ""}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="e.g. Mama Ngozi Stores"
          className="mt-2 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
        />
      </div>

      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-5 shadow-subtle-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <Storefront /> Marketing Page & Setup
        </h3>
        <p className="mb-4 text-[13px] text-muted-gray">
          Visit the Trackkit marketing landing page or restart shop onboarding setup.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/welcome"
            className="flex-1 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-2.5 px-4 text-center text-[14px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors"
          >
            Visit Landing Page
          </Link>
          <Link
            href="/onboarding"
            className="flex-1 rounded-buttons bg-ink-black py-2.5 px-4 text-center text-[14px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 transition-opacity"
          >
            Re-run Setup Wizard
          </Link>
        </div>
      </div>

      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-5 shadow-subtle-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <CloudArrowUp /> Backup
        </h3>
        <p className="mb-4 text-[13px] text-muted-gray">
          Export your inventory as a CSV file. Keep it as a backup in case your phone breaks.
        </p>
        <ExportButton />
      </div>

      {user ? (
        <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-5 shadow-subtle-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
            <SignOut /> Session
          </h3>
          <p className="mb-4 text-[13px] text-muted-gray">
            Signed in as {user.phoneNumber ?? user.email}. Tapping logout will securely close
            your active session on this device — your data stays saved locally.
          </p>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={logout}
            className="w-full rounded-buttons bg-[var(--color-alert-red)] py-3 text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <SignOut /> {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : (
        <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-5 shadow-subtle-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
            <SignIn /> Cloud Backup
          </h3>
          <p className="mb-4 text-[13px] text-muted-gray">
            Optional: sign in with your phone number to back up your inventory
            to the cloud and use it on more than one phone. Trackkit works
            fully offline without this — sign in only if you want it.
          </p>
          <Link
            href="/auth/login"
            className="block w-full rounded-buttons bg-ink-black py-3 text-center text-[15px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90"
          >
            Sign in to cloud backup
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const currentTab = useTrackkitStore((s) => s.currentTab);
  const setCurrentTab = useTrackkitStore((s) => s.setCurrentTab);
  const shopName = useTrackkitStore((s) => s.shopName);
  const { ready, error } = useDatabaseStatus();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)]">
      {/* Desktop Left Navigation Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-[var(--border-hairline)] bg-[var(--surface-card)] p-4 shadow-subtle-3">
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-[var(--border-hairline)] pb-4 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-black text-[var(--color-ink-black-text)] shadow-sm">
            <Storefront weight="fill" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[20px] font-medium tracking-tight text-heading-charcoal truncate">
              Trackkit
            </h1>
            <p className="truncate text-[12px] text-muted-gray">
              {shopName || "My Retail Shop"}
            </p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="mt-4 flex-1 space-y-1">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-subtle-3"
                    : "text-muted-gray hover:bg-[var(--surface-card-secondary)] hover:text-heading-charcoal"
                }`}
              >
                <TabIcon size={18} weight={isActive ? "fill" : "regular"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Sidebar Bottom Footer */}
        <div className="border-t border-[var(--border-hairline)] pt-4 px-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted-gray">Theme</span>
            <ThemeToggle />
          </div>
          {user && (
            <div className="truncate rounded-lg bg-[var(--surface-canvas)] p-2 text-[11px] text-muted-gray">
              Signed in: <span className="font-medium text-heading-charcoal">{user.phoneNumber ?? user.email}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-4 pt-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-black text-[var(--color-ink-black-text)]">
              <Storefront weight="fill" size={18} />
            </span>
            <h1 className="font-display text-[23px] font-medium tracking-[-0.02em] text-heading-charcoal">
              Trackkit
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--surface-card)] px-8 py-4 mb-6 shadow-subtle-3">
          <div>
            <h2 className="text-[20px] font-semibold text-heading-charcoal capitalize">
              {currentTab}
            </h2>
            <p className="text-[12px] text-muted-gray">
              {shopName ? `${shopName} · Desktop Workspace` : "Desktop Workspace"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 pb-24 md:pb-12 pt-2 sm:px-6 md:px-8 max-w-7xl w-full mx-auto">
          {!ready && !error && (
            <p className="text-[14px] text-muted-gray">Loading your local inventory…</p>
          )}
          {error && (
            <p className="text-[14px] text-[var(--color-alert-red)]">
              Could not open local database: {error.message}
            </p>
          )}

          {ready && (
            <>
              {currentTab === "dashboard" && <Dashboard />}
              {currentTab === "inventory" && <InventoryTab />}
              {currentTab === "margins" && <ProfitabilityDashboard />}
              {currentTab === "history" && <PurchaseHistoryDashboard />}
              {currentTab === "trends" && <TrendsView />}
              {currentTab === "ai" && <AIChat />}
              {currentTab === "settings" && <SettingsTab />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-hairline)] bg-[var(--surface-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[13px] font-medium cursor-pointer transition-colors ${
                  currentTab === tab.id ? "text-ember-orange" : "text-muted-gray hover:text-heading-charcoal"
                }`}
              >
                <TabIcon weight={currentTab === tab.id ? "fill" : "regular"} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

