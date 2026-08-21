"use client";

import { useState } from "react";
import { Plus, Warning } from "@phosphor-icons/react";
import { useInventoryStats } from "@/hooks/useInventoryStats";
import { useTrackkitStore } from "@/lib/store";
import { LowStockAlert } from "./LowStockAlert";
import { ReorderRecommendations } from "./ReorderRecommendations";
import { ProductForm } from "./ProductForm";

export function Dashboard() {
  const { totalProducts, lowStockCount, lowStockItems, totalInventoryValue, isLoading } =
    useInventoryStats();
  const currency = useTrackkitStore((s) => s.currency);
  const shopName = useTrackkitStore((s) => s.shopName);
  const traderName = useTrackkitStore((s) => s.traderName);
  const marketLocation = useTrackkitStore((s) => s.marketLocation);
  const setCurrentTab = useTrackkitStore((s) => s.setCurrentTab);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Personalized Trader Greeting Banner */}
      {(traderName || shopName || marketLocation) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-4 sm:px-6 shadow-subtle-3">
          <div>
            <h1 className="text-[17px] sm:text-[19px] font-bold text-heading-charcoal">
              {traderName ? `Welcome, ${traderName}!` : `Welcome to ${shopName || "your shop"}!`}
            </h1>
            <p className="text-[12px] sm:text-[13px] text-muted-gray">
              {marketLocation ? `Operating in ${marketLocation}` : "Manage stock, margins, and orders offline."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-grass-green)]/15 px-3 py-1 text-[11px] font-bold text-[var(--color-grass-green)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-grass-green)] animate-pulse" />
              Offline Database Active
            </span>
          </div>
        </div>
      )}

      {/* Today's Snapshot Grid */}
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-subtle-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-gray">
            Today&rsquo;s Snapshot
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 rounded-buttons bg-ink-black px-4 py-2 text-[13px] font-semibold text-[var(--color-ink-black-text)] cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> Add Product
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("inventory")}
              className="rounded-buttons bg-[var(--surface-card-secondary)] border border-[var(--border-hairline)] px-4 py-2 text-[13px] font-semibold text-heading-charcoal cursor-pointer hover:opacity-80 transition-opacity"
            >
              View Inventory
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-4">
            <p className="text-[32px] font-medium text-heading-charcoal">
              {isLoading ? "—" : totalProducts}
            </p>
            <p className="text-[13px] text-muted-gray">Products in stock</p>
          </div>
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-4">
            <p className="text-[32px] font-medium text-[var(--color-alert-red)]">
              {isLoading ? "—" : lowStockCount}
            </p>
            <p className="flex items-center gap-1 text-[13px] text-muted-gray">
              <Warning weight="fill" className="text-[var(--color-alert-red)]" /> Low stock alerts
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-4">
            <p className="text-[32px] font-medium text-heading-charcoal">
              {totalInventoryValue != null ? `${currency}${totalInventoryValue.toFixed(0)}` : "TBD"}
            </p>
            <p className="text-[13px] text-muted-gray">Total inventory value</p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Desktop Columns */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReorderRecommendations />
        <LowStockAlert items={lowStockItems} />
      </div>

      {showAddForm && <ProductForm onClose={() => setShowAddForm(false)} />}
    </div>
  );
}
