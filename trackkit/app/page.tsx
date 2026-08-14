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

const TABS: { id: Tab; label: string; icon: Icon }[] = [
  { id: "dashboard", label: "Dashboard", icon: SquaresFour },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "margins", label: "Margins", icon: Coins },
  { id: "history", label: "History", icon: ClockCounterClockwise },
  { id: "settings", label: "Settings", icon: Gear },
];

function InventoryTab() {
  const { products, isLoading } = useLocalInventory();
  const [showAddForm, setShowAddForm] = useState(false);
  const selectedProductId = useTrackkitStore((s) => s.selectedProductId);
  const setSelectedProductId = useTrackkitStore((s) => s.setSelectedProductId);
  const editingProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const sortedProducts = useMemo(() => sortByLowStockFirst(products), [products]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[19px] font-medium text-heading-charcoal">All Products</h2>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-buttons bg-ink-black px-4 py-2 text-[14px] font-semibold text-white cursor-pointer"
        >
          <Plus /> Add Product
        </button>
      </div>

      {isLoading && <p className="text-[14px] text-muted-gray">Loading…</p>}

      {!isLoading && products.length === 0 && (
        <div className="rounded-cards bg-white p-8 text-center shadow-subtle-3">
          <p className="text-[16px] text-body-brown">No products yet.</p>
          <p className="mt-1 text-[13px] text-muted-gray">
            Tap &ldquo;+ Add Product&rdquo; to start tracking your stock.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sortedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {showAddForm && <ProductForm onClose={() => setShowAddForm(false)} />}
      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
}

function SettingsTab() {
  const shopName = useTrackkitStore((s) => s.shopName);
  const setShopName = useTrackkitStore((s) => s.setShopName);
  const { user, logout, isLoading: isLoggingOut } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rounded-cards bg-white p-5 shadow-subtle-3">
        <label className="flex items-center gap-1.5 text-[13px] font-medium text-body-brown">
          <Storefront /> Shop Name
        </label>
        <input
          value={shopName ?? ""}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="e.g. Mama Ngozi Stores"
          className="mt-1 w-full rounded-lg border border-stone-surface bg-cream-canvas px-3 py-3 text-[16px] outline-none focus:border-[var(--color-link-blue)]"
        />
      </div>

      <div className="rounded-cards bg-white p-5 shadow-subtle-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
          <CloudArrowUp /> Backup
        </h3>
        <p className="mb-4 text-[13px] text-muted-gray">
          Export your inventory as a CSV file. Keep it as a backup in case your phone breaks.
        </p>
        <ExportButton />
      </div>

      {user ? (
        <div className="rounded-cards bg-white p-5 shadow-subtle-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-heading-charcoal">
            <SignOut /> Session
          </h3>
          <p className="mb-4 text-[13px] text-muted-gray">
            Signed in as {user.phoneNumber}. Tapping logout will securely close
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
        <div className="rounded-cards bg-white p-5 shadow-subtle-3">
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
            className="block w-full rounded-buttons bg-ink-black py-3 text-center text-[15px] font-semibold text-white hover:opacity-90"
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
  const { ready, error } = useDatabaseStatus();

  // No auth gate here on purpose: Trackkit is offline-first and login is
  // opt-in (see SettingsTab's "Cloud Backup" section) — every tab below
  // works entirely from local SQLite. Signing in only unlocks cloud sync,
  // it was never meant to be required to use the app at all. See bug.md,
  // "Every screen requires login," for what this replaced and why.

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 mt-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-black text-white">
          <Storefront weight="fill" size={18} />
        </span>
        <h1 className="font-display text-[23px] font-medium tracking-[-0.02em] text-heading-charcoal">
          Trackkit
        </h1>
      </header>

      {!ready && !error && (
        <p className="text-[14px] text-muted-gray">Loading your local inventory…</p>
      )}
      {error && (
        <p className="text-[14px] text-[var(--color-alert-red)]">
          Could not open local database: {error.message}
        </p>
      )}

      {ready && (
        <main className="flex-1">
          {currentTab === "dashboard" && <Dashboard />}
          {currentTab === "inventory" && <InventoryTab />}
          {currentTab === "margins" && <ProfitabilityDashboard />}
          {currentTab === "history" && <PurchaseHistoryDashboard />}
          {currentTab === "settings" && <SettingsTab />}
        </main>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-surface bg-white">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[13px] font-medium cursor-pointer ${
                  currentTab === tab.id ? "text-ember-orange" : "text-muted-gray"
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
