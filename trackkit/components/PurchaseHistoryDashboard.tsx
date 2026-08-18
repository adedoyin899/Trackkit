"use client";

import { useState, useMemo } from "react";
import {
  CalendarBlank,
  Funnel,
  Receipt,
  CurrencyNgn,
  Package,
  User,
  TrendUp,
  ArrowsLeftRight,
  Trophy,
} from "@phosphor-icons/react";
import { usePurchaseHistory, useSupplierStats } from "@/hooks/useTransactions";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import type { PurchaseHistoryEntry, SupplierStat } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNaira(val: number | null) {
  if (val == null) return "—";
  return `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ─── Supplier card ──────────────────────────────────────────────────────────

function SupplierCard({ supplier }: { supplier: SupplierStat }) {
  return (
    <div
      className={`relative rounded-xl border p-4 ${
        supplier.isCheapest
          ? "border-[var(--color-grass-green)] bg-[var(--color-grass-green)]/10"
          : "border-[var(--border-hairline)] bg-[var(--surface-card)]"
      }`}
    >
      {supplier.isCheapest && (
        <span className="absolute -top-2.5 left-3 flex items-center gap-1 rounded-full bg-[var(--color-grass-green)] px-2 py-0.5 text-[11px] font-bold text-white">
          <Trophy weight="fill" size={11} /> CHEAPEST
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-heading-charcoal">
          {supplier.name}
        </span>
        <span className="text-[15px] font-bold text-heading-charcoal">
          {formatNaira(supplier.avgPrice)}
          <span className="text-[11px] font-normal text-muted-gray"> avg/unit</span>
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-[var(--surface-canvas)] border border-[var(--border-hairline)] px-2 py-1.5">
          <p className="text-[11px] text-muted-gray">Purchases</p>
          <p className="text-[14px] font-semibold text-heading-charcoal">
            {supplier.purchaseCount}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--surface-canvas)] border border-[var(--border-hairline)] px-2 py-1.5">
          <p className="text-[11px] text-muted-gray">Total Spent</p>
          <p className="text-[13px] font-semibold text-heading-charcoal">
            {formatNaira(supplier.totalSpent)}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--surface-canvas)] border border-[var(--border-hairline)] px-2 py-1.5">
          <p className="text-[11px] text-muted-gray">Last Price</p>
          <p className="text-[13px] font-semibold text-heading-charcoal">
            {formatNaira(supplier.lastPrice)}
          </p>
        </div>
      </div>
      {!supplier.isCheapest && supplier.savingsPercent > 0 && (
        <p className="mt-2 text-[12px] text-[var(--color-alert-red)]">
          ↑ {supplier.savingsPercent}% more expensive than cheapest
        </p>
      )}
      {supplier.lastDate && (
        <p className="mt-1 text-[11px] text-muted-gray">
          Last purchase: {formatDate(supplier.lastDate)}
        </p>
      )}
    </div>
  );
}

// ─── History row ────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: PurchaseHistoryEntry }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-3 shadow-subtle-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-grass-green)]/10">
        <Receipt size={18} className="text-[var(--color-grass-green)]" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-heading-charcoal">
          {entry.product_name}
          <span className="ml-1 text-[12px] font-normal text-muted-gray">
            ({entry.product_unit})
          </span>
        </p>
        <p className="text-[12px] text-muted-gray">
          {formatDate(entry.created_at)}
          {entry.supplier && (
            <span className="ml-2 font-medium text-body-brown">
              · {entry.supplier}
            </span>
          )}
        </p>
        {entry.notes && (
          <p className="text-[11px] italic text-muted-gray">{entry.notes}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-[14px] font-bold text-heading-charcoal">
          {formatNaira(entry.total_cost)}
        </p>
        <p className="text-[11px] text-muted-gray">
          ×{entry.quantity} @ {formatNaira(entry.cost_per_unit)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export function PurchaseHistoryDashboard() {
  const { products } = useLocalInventory();
  const [productId, setProductId] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = useState(() => ({
    productId: "",
    supplier: "",
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  }));
  const [view, setView] = useState<"history" | "suppliers">("history");

  const { data, isLoading } = usePurchaseHistory({
    productId: applied.productId || undefined,
    supplier: applied.supplier || undefined,
    startDate: applied.startDate,
    endDate: applied.endDate,
  });

  const { data: supplierStats = [], isLoading: isLoadingSuppliers } =
    useSupplierStats(applied.productId || null);

  const entries = data?.entries ?? [];
  const summary = data?.summary;

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === applied.productId),
    [products, applied.productId],
  );

  // Cheapest supplier insight for the banner
  const cheapest = supplierStats.find((s) => s.isCheapest);
  const mostExpensive = supplierStats[supplierStats.length - 1];
  const savingsPerUnit =
    cheapest && mostExpensive && cheapest.avgPrice != null && mostExpensive.avgPrice != null
      ? Math.round(mostExpensive.avgPrice - cheapest.avgPrice)
      : 0;

  const handleApply = () => {
    setApplied({ productId, supplier: supplierFilter, startDate, endDate });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Receipt weight="fill" size={20} className="text-ember-orange" />
        <h2 className="text-[19px] font-medium text-heading-charcoal">
          Purchase History
        </h2>
      </div>

      {/* View toggle */}
      <div className="flex rounded-xl bg-[var(--surface-card-secondary)] border border-[var(--border-hairline)] p-1">
        <button
          type="button"
          onClick={() => setView("history")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium transition-colors cursor-pointer ${
            view === "history"
              ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-subtle-3"
              : "text-muted-gray hover:text-heading-charcoal"
          }`}
        >
          <Receipt size={14} /> History
        </button>
        <button
          type="button"
          onClick={() => setView("suppliers")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium transition-colors cursor-pointer ${
            view === "suppliers"
              ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] shadow-subtle-3"
              : "text-muted-gray hover:text-heading-charcoal"
          }`}
        >
          <ArrowsLeftRight size={14} /> Suppliers
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 shadow-subtle-3 space-y-3">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-body-brown">
          <Funnel size={14} /> Filters
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Product */}
          <div className="col-span-2">
            <label className="mb-1 flex items-center gap-1 text-[12px] text-muted-gray">
              <Package size={12} /> Product
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-[13px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-[12px] text-muted-gray">
              <CalendarBlank size={12} /> From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-[13px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[12px] text-muted-gray">
              <CalendarBlank size={12} /> To
            </label>
            <input
              type="date"
              value={endDate}
              readOnly
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-[13px] text-heading-charcoal outline-none"
            />
          </div>

          {/* Supplier */}
          <div className="col-span-2">
            <label className="mb-1 flex items-center gap-1 text-[12px] text-muted-gray">
              <User size={12} /> Supplier
            </label>
            <input
              type="text"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              placeholder="Filter by supplier name"
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-[13px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="flex w-full items-center justify-center gap-1.5 rounded-buttons bg-ink-black py-2.5 text-[14px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 cursor-pointer"
        >
          <Funnel weight="fill" size={14} /> Apply Filters
        </button>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Spent",
              value: formatNaira(summary.totalSpent),
              icon: CurrencyNgn,
              color: "text-[var(--color-alert-red)]",
            },
            {
              label: "Avg Cost/Unit",
              value: formatNaira(summary.avgCostPerUnit),
              icon: TrendUp,
              color: "text-[var(--color-link-blue)]",
            },
            {
              label: "Total Units",
              value: summary.totalUnits.toLocaleString(),
              icon: Package,
              color: "text-[var(--color-grass-green)]",
            },
            {
              label: "Freq/Month",
              value: `${summary.frequencyPerMonth}×`,
              icon: CalendarBlank,
              color: "text-[var(--color-gold)]",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 shadow-subtle-3 text-center"
            >
              <Icon
                size={18}
                weight="fill"
                className={`mx-auto mb-1 ${color}`}
              />
              <p className="text-[13px] font-bold text-heading-charcoal">{value}</p>
              <p className="text-[11px] text-muted-gray">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Supplier insight banner */}
      {cheapest && savingsPerUnit > 0 && selectedProduct && (
        <div className="rounded-xl border border-[var(--color-grass-green)]/40 bg-[var(--color-grass-green)]/10 px-4 py-3">
          <p className="text-[13px] font-semibold text-[var(--color-grass-green)]">
            💡 Cheapest for {selectedProduct.name}: {cheapest.name} (
            {formatNaira(cheapest.avgPrice)}/unit)
          </p>
          <p className="mt-0.5 text-[12px] text-body-brown">
            You could save ₦{savingsPerUnit}/unit by switching from{" "}
            {mostExpensive?.name}
          </p>
        </div>
      )}

      {/* History view */}
      {view === "history" && (
        <div className="space-y-2">
          {isLoading && (
            <p className="text-center text-[13px] text-muted-gray py-8">
              Loading purchase history…
            </p>
          )}
          {!isLoading && entries.length === 0 && (
            <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-8 text-center shadow-subtle-3">
              <Receipt size={32} className="mx-auto mb-2 text-muted-gray" />
              <p className="text-[14px] text-body-brown">
                No restock purchases found.
              </p>
              <p className="mt-1 text-[12px] text-muted-gray">
                Use the +1 button on a product card to log your first restock.
              </p>
            </div>
          )}
          {entries.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} />
          ))}
          {data && data.total > entries.length && (
            <p className="text-center text-[12px] text-muted-gray">
              Showing {entries.length} of {data.total} results
            </p>
          )}
        </div>
      )}

      {/* Supplier comparison view */}
      {view === "suppliers" && (
        <div className="space-y-3">
          {!applied.productId && (
            <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 text-center shadow-subtle-3">
              <ArrowsLeftRight
                size={28}
                className="mx-auto mb-2 text-muted-gray"
              />
              <p className="text-[14px] text-body-brown">
                Select a product above to compare suppliers.
              </p>
            </div>
          )}
          {applied.productId && isLoadingSuppliers && (
            <p className="text-center text-[13px] text-muted-gray py-8">
              Loading suppliers…
            </p>
          )}
          {applied.productId && !isLoadingSuppliers && supplierStats.length === 0 && (
            <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 text-center shadow-subtle-3">
              <User size={28} className="mx-auto mb-2 text-muted-gray" />
              <p className="text-[14px] text-body-brown">
                No supplier data yet for this product.
              </p>
              <p className="mt-1 text-[12px] text-muted-gray">
                Log restocks with a supplier name to see comparisons here.
              </p>
            </div>
          )}
          {supplierStats.map((s) => (
            <SupplierCard key={s.name} supplier={s} />
          ))}
        </div>
      )}
    </div>
  );
}
