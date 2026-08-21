"use client";

import { useState } from "react";
import { Plus, Warning, ArrowRight, Package, Receipt, Sparkle, TrendUp } from "@phosphor-icons/react";
import { useInventoryStats } from "@/hooks/useInventoryStats";
import { useTransactions } from "@/hooks/useTransactions";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { useTrackkitStore } from "@/lib/store";
import { LowStockAlert } from "./LowStockAlert";
import { ReorderRecommendations } from "./ReorderRecommendations";
import { ProductForm } from "./ProductForm";

function formatDateGroup(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function Dashboard() {
  const { totalProducts, lowStockCount, lowStockItems, totalInventoryValue, isLoading } =
    useInventoryStats();
  const { products } = useLocalInventory();
  const { transactions } = useTransactions();
  const currency = useTrackkitStore((s) => s.currency);
  const shopName = useTrackkitStore((s) => s.shopName);
  const traderName = useTrackkitStore((s) => s.traderName);
  const marketLocation = useTrackkitStore((s) => s.marketLocation);
  const setCurrentTab = useTrackkitStore((s) => s.setCurrentTab);
  const [showAddForm, setShowAddForm] = useState(false);

  // Derive trader initials for Monzo-style circle avatar
  const initials = (traderName || shopName || "Trackkit")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Monzo Top Profile & Status Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-hot-coral)] text-white font-display text-[15px] font-extrabold shadow-sm">
            {initials}
          </div>
          <div>
            <h1 className="text-[17px] sm:text-[19px] font-extrabold text-heading-charcoal tracking-tight">
              {traderName || shopName || "Market Shop"}
            </h1>
            <p className="text-[12px] text-muted-gray">
              {marketLocation || "Offline Database Ready"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-grass-green)]/15 px-3 py-1 text-[11px] font-bold text-[var(--color-grass-green)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-grass-green)] animate-pulse" />
            100% Offline Active
          </span>
          <button
            type="button"
            onClick={() => setCurrentTab("margins")}
            className="flex items-center gap-1 rounded-full bg-[var(--surface-card)] border border-[var(--border-hairline)] px-3 py-1.5 text-[12px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] transition-colors cursor-pointer"
          >
            <Sparkle size={14} className="text-[var(--color-hot-coral)]" /> Margins
          </button>
        </div>
      </div>

      {/* Signature Monzo Hot Coral Hero Card */}
      <div className="monzo-coral-card p-6 sm:p-7 transition-all duration-200">
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-[18px] font-extrabold tracking-tight">
              trackkit
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
              Shop Balance
            </span>
          </div>
          <span className="text-[12px] font-semibold opacity-90">
            {currency} {shopName || "Inventory"}
          </span>
        </div>

        <div className="relative z-10 my-3">
          <p className="text-[13px] font-medium opacity-85">Total Stock Valuation</p>
          <div className="numo-display text-[36px] sm:text-[44px] leading-tight text-white mt-0.5">
            {isLoading ? "—" : totalInventoryValue != null ? `${currency}${totalInventoryValue.toLocaleString("en-NG", { maximumFractionDigits: 0 })}` : `${currency}0`}
          </div>
        </div>

        {/* Monzo 500px Pill Buttons */}
        <div className="relative z-10 flex flex-wrap gap-2.5 pt-3">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="monzo-pill inline-flex items-center gap-1.5 bg-white px-5 py-2.5 text-[13px] font-bold text-[#091723] shadow-md hover:bg-white/95 cursor-pointer"
          >
            <Plus size={15} weight="bold" /> Add Product
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("inventory")}
            className="monzo-pill inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-black/35 transition-colors cursor-pointer"
          >
            <Package size={15} /> All Products ({totalProducts})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("history")}
            className="monzo-pill inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-black/35 transition-colors cursor-pointer"
          >
            <Receipt size={15} /> Purchase History
          </button>
        </div>
      </div>

      {/* Snapshot Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div
          onClick={() => setCurrentTab("inventory")}
          className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 shadow-subtle-3 hover:border-[var(--color-hot-coral)]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted-gray uppercase tracking-wider">
              Catalog Items
            </span>
            <Package size={16} className="text-muted-gray" />
          </div>
          <p className="numo-heading text-[28px] sm:text-[32px] font-extrabold text-heading-charcoal mt-1">
            {isLoading ? "—" : totalProducts}
          </p>
          <p className="text-[11px] text-muted-gray mt-0.5">Active products logged</p>
        </div>

        <div
          onClick={() => setCurrentTab("inventory")}
          className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 shadow-subtle-3 hover:border-[var(--color-alert-red)]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted-gray uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <Warning weight="fill" size={16} className="text-[var(--color-alert-red)]" />
          </div>
          <p className="numo-heading text-[28px] sm:text-[32px] font-extrabold text-[var(--color-alert-red)] mt-1">
            {isLoading ? "—" : lowStockCount}
          </p>
          <p className="text-[11px] text-muted-gray mt-0.5">Items needing restock</p>
        </div>

        <div
          onClick={() => setCurrentTab("margins")}
          className="col-span-2 sm:col-span-1 rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 shadow-subtle-3 hover:border-[var(--color-grass-green)]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted-gray uppercase tracking-wider">
              Margin Health
            </span>
            <TrendUp size={16} className="text-[var(--color-grass-green)]" />
          </div>
          <p className="numo-heading text-[28px] sm:text-[32px] font-extrabold text-[var(--color-grass-green)] mt-1">
            Profitable
          </p>
          <p className="text-[11px] text-muted-gray mt-0.5">Live price-margin analysis</p>
        </div>
      </div>

      {/* Monzo-Style Activity Stream */}
      <div className="rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-subtle-3">
        <div className="flex items-center justify-between mb-3 border-b border-[var(--border-hairline)] pb-3">
          <h2 className="font-display text-[15px] sm:text-[16px] font-bold text-heading-charcoal tracking-tight flex items-center gap-2">
            <Receipt size={18} className="text-[var(--color-hot-coral)]" /> Recent Shop Activity
          </h2>
          <button
            type="button"
            onClick={() => setCurrentTab("history")}
            className="text-[12px] font-bold text-[var(--color-hot-coral)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            See All <ArrowRight size={13} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-muted-gray text-[13px]">
            No recent activity logged yet. Sales and restocks will show up here.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {recentTransactions.map((tx) => {
              const matchedProduct = products.find((p) => p.id === tx.product_id);
              const isSale = tx.transaction_type === "sale";
              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[16px] font-bold ${
                        isSale
                          ? "bg-[var(--color-grass-green)]/15 text-[var(--color-grass-green)]"
                          : "bg-[var(--color-hot-coral)]/15 text-[var(--color-hot-coral)]"
                      }`}
                    >
                      {matchedProduct?.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={matchedProduct.image_url}
                          alt={matchedProduct.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : isSale ? (
                        "🛍️"
                      ) : (
                        "📦"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-heading-charcoal truncate">
                        {matchedProduct?.name || "Inventory Item"}
                      </p>
                      <p className="text-[11px] text-muted-gray">
                        {isSale ? "Sale" : "Restock"} · {formatDateGroup(tx.created_at)}
                        {tx.supplier ? ` · ${tx.supplier}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right pl-3 shrink-0">
                    <p
                      className={`text-[14px] font-extrabold font-display ${
                        isSale ? "text-[var(--color-grass-green)]" : "text-heading-charcoal"
                      }`}
                    >
                      {isSale ? `+${tx.quantity}` : `+${tx.quantity}`} {matchedProduct?.unit || "units"}
                    </p>
                    {tx.cost_per_unit && (
                      <p className="text-[11px] text-muted-gray">
                        @{currency}{tx.cost_per_unit}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side-by-Side Reorder & Low Stock Alerts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReorderRecommendations />
        <LowStockAlert items={lowStockItems} />
      </div>

      {showAddForm && <ProductForm onClose={() => setShowAddForm(false)} />}
    </div>
  );
}
