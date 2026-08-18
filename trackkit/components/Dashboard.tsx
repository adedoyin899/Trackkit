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
  const setCurrentTab = useTrackkitStore((s) => s.setCurrentTab);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-subtle-3">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-gray">
          Today&rsquo;s Snapshot
        </h2>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <p className="text-[32px] font-medium text-heading-charcoal">
              {isLoading ? "—" : totalProducts}
            </p>
            <p className="text-[13px] text-muted-gray">Products in stock</p>
          </div>
          <div>
            <p className="text-[32px] font-medium text-[var(--color-alert-red)]">
              {isLoading ? "—" : lowStockCount}
            </p>
            <p className="flex items-center gap-1 text-[13px] text-muted-gray">
              <Warning weight="fill" className="text-[var(--color-alert-red)]" /> Low stock alerts
            </p>
          </div>
          <div>
            <p className="text-[32px] font-medium text-heading-charcoal">
              {totalInventoryValue != null ? `${currency}${totalInventoryValue.toFixed(0)}` : "TBD"}
            </p>
            <p className="text-[13px] text-muted-gray">Total inventory value</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-buttons bg-ink-black px-4 py-2.5 text-[14px] font-semibold text-[var(--color-ink-black-text)] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Plus /> Add Product
        </button>
        <button
          type="button"
          onClick={() => setCurrentTab("inventory")}
          className="rounded-buttons bg-[var(--surface-card-secondary)] border border-[var(--border-hairline)] px-4 py-2.5 text-[14px] font-semibold text-heading-charcoal cursor-pointer hover:opacity-80 transition-opacity"
        >
          View All
        </button>
      </div>

      <ReorderRecommendations />

      <LowStockAlert items={lowStockItems} />

      {showAddForm && <ProductForm onClose={() => setShowAddForm(false)} />}
    </div>
  );
}
