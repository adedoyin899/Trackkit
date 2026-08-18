"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Warning, ArrowLeft, Coins } from "@phosphor-icons/react";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { useTransactions } from "@/hooks/useTransactions";
import { useMarginCalculation } from "@/hooks/useMarginCalculation";
import { useAuth } from "@/hooks/useAuth";
import { PriceUpdateModal } from "./PriceUpdateModal";
import type { Product } from "@/lib/types";

interface ProfitabilityDashboardProps {
  onBack?: () => void;
}

export function ProfitabilityDashboard({ onBack }: ProfitabilityDashboardProps) {
  const { products } = useLocalInventory();
  const { transactions } = useTransactions();
  const { calculateMargin, suggestTargetPrice } = useMarginCalculation();
  const { user } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch margins data from backend API as an option/cache — only attempted
  // for signed-in users. Auth is opt-in (see app/page.tsx's SettingsTab), so
  // most visits have no session at all; skipping this avoids a guaranteed
  // 401 on every load for the common case. Local computation below covers
  // everyone regardless.
  const { data: apiData } = useQuery({
    queryKey: ["margins-api"],
    queryFn: async () => {
      const res = await fetch("/api/margins");
      if (!res.ok) throw new Error("API failed");
      return res.json();
    },
    enabled: Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Calculate local margins fallback for offline capability. useState's
  // initializer form runs exactly once per mount, avoiding the impure
  // Date.now() call a plain `new Date(Date.now() - ...)` would make on
  // every render.
  const [sevenDaysAgo] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const salesMap: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.transaction_type === "sale" && new Date(t.created_at) >= sevenDaysAgo) {
      salesMap[t.product_id] = (salesMap[t.product_id] || 0) + t.quantity;
    }
  });

  const localProductsWithMargin = products.map((p) => {
    const costPerUnit = p.cost_per_unit;
    const sellingPrice = p.selling_price_per_unit ?? 0;
    const unitsSold = salesMap[p.id] || 0;

    const { marginPercent, marginAmount, status } = calculateMargin(costPerUnit, sellingPrice);
    const totalProfitThisWeek = unitsSold * (marginAmount ?? 0);

    return {
      productId: p.id,
      name: p.name,
      costPerUnit,
      sellingPrice,
      marginPercent,
      marginAmount,
      units_sold_this_week: unitsSold,
      total_profit_this_week: totalProfitThisWeek,
      status,
      // Keep original product object for modal updating
      _original: p,
    };
  });

  // Sort local products by marginPercent (lowest first) — sort a copy so
  // the map result above stays untouched.
  const sortedLocalProductsWithMargin = [...localProductsWithMargin].sort((a, b) => {
    if (a.marginPercent === null && b.marginPercent === null) return 0;
    if (a.marginPercent === null) return -1;
    if (b.marginPercent === null) return 1;
    return a.marginPercent - b.marginPercent;
  });

  const { profitableCount, totalMarginThisWeek, marginSum, marginCount } =
    localProductsWithMargin.reduce(
      (acc, p) => {
        if (p.marginPercent !== null) {
          if (p.marginPercent > 0) acc.profitableCount++;
          acc.marginSum += p.marginPercent;
          acc.marginCount++;
        }
        acc.totalMarginThisWeek += p.total_profit_this_week;
        return acc;
      },
      { profitableCount: 0, totalMarginThisWeek: 0, marginSum: 0, marginCount: 0 },
    );

  const localSummary = {
    totalProducts: products.length,
    profitableCount,
    totalMarginThisWeek,
    averageMargin: marginCount > 0 ? Math.round(marginSum / marginCount) : 0,
  };

  type DisplayProduct = (typeof sortedLocalProductsWithMargin)[number] & {
    productId: string;
    marginPercent: number | null;
  };

  // Combine local calculations and API results
  const displaySummary = apiData?.summary ?? localSummary;
  const displayProducts: DisplayProduct[] = (
    apiData?.products ?? sortedLocalProductsWithMargin
  ).map((dp: DisplayProduct) => {
    const localMatch = sortedLocalProductsWithMargin.find((lp) => lp.productId === dp.productId);
    // Attach original product object and status
    return {
      ...dp,
      status: dp.marginPercent !== null
        ? dp.marginPercent > 30 ? "green" : dp.marginPercent >= 10 ? "yellow" : "red"
        : "red",
      _original: localMatch?._original ?? products.find((p) => p.id === dp.productId),
    };
  });

  // Find products with low margin (<10% or null) for warning section
  const lowMarginProducts = displayProducts.filter(
    (dp) => dp.marginPercent === null || dp.marginPercent < 10
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-card-secondary)] text-heading-charcoal hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h1 className="text-[24px] font-bold text-heading-charcoal flex items-center gap-2">
          <Coins weight="fill" className="text-gold" /> Margin Analysis
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-cards bg-[var(--surface-card)] p-4 shadow-subtle-3 border border-[var(--border-hairline)]">
          <span className="text-[12px] font-medium text-muted-gray">Total Products</span>
          <div className="text-[22px] font-bold text-heading-charcoal">{displaySummary.totalProducts}</div>
        </div>

        <div className="rounded-cards bg-[var(--surface-card)] p-4 shadow-subtle-3 border border-[var(--border-hairline)]">
          <span className="text-[12px] font-medium text-muted-gray">Profitable Items</span>
          <div className="text-[22px] font-bold text-heading-charcoal">
            {displaySummary.profitableCount} / {displaySummary.totalProducts}
          </div>
        </div>

        <div className="rounded-cards bg-[var(--surface-card)] p-4 shadow-subtle-3 border border-[var(--border-hairline)]">
          <span className="text-[12px] font-medium text-muted-gray">Profit (This Week)</span>
          <div className="text-[22px] font-bold text-heading-charcoal">
            ₦{displaySummary.totalMarginThisWeek?.toLocaleString() ?? "0"}
          </div>
        </div>

        <div className="rounded-cards bg-[var(--surface-card)] p-4 shadow-subtle-3 border border-[var(--border-hairline)]">
          <span className="text-[12px] font-medium text-muted-gray">Avg. Profit Margin</span>
          <div className="text-[22px] font-bold text-heading-charcoal">{displaySummary.averageMargin}%</div>
        </div>
      </div>

      {/* Warnings & Suggestions Section */}
      {lowMarginProducts.length > 0 && (
        <div className="rounded-cards border border-[var(--color-alert-red)]/30 bg-[var(--color-alert-red)]/10 p-4 space-y-3">
          <h3 className="text-[14px] font-bold text-[var(--color-alert-red)] flex items-center gap-1.5">
            <Warning weight="fill" /> Action Required: Low Margin Products
          </h3>
          <div className="divide-y divide-[var(--color-alert-red)]/20">
            {lowMarginProducts.slice(0, 3).map((lp) => {
              const targetPrice = lp.costPerUnit ? suggestTargetPrice(lp.costPerUnit, 30) : null;
              return (
                <div
                  key={lp.productId}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 first:pt-0 last:pb-0"
                >
                  <div className="text-[13px] text-heading-charcoal">
                    <span className="font-bold uppercase">{lp.name}</span>:{" "}
                    {lp.marginPercent !== null ? `Only ${lp.marginPercent}% margin.` : "Cost price not configured."}{" "}
                    {targetPrice ? `Reprice to ₦${targetPrice}+ for 30% margin?` : ""}
                  </div>
                  {lp._original && (
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(lp._original)}
                      className="w-fit rounded bg-[var(--color-alert-red)] px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90 transition-colors cursor-pointer"
                    >
                      Reprice
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profitability Table */}
      <div className="overflow-hidden rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] shadow-subtle-3">
        <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-heading-charcoal">Profitability Rankings</h3>
          <span className="text-[12px] text-muted-gray">Sorted by Margin (Lowest First)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="bg-[var(--surface-canvas)] text-[12px] font-bold text-muted-gray uppercase border-b border-[var(--border-hairline)]">
                <th className="px-5 py-3">Product</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Selling</th>
                <th className="px-4 py-3 text-center">Margin %</th>
                <th className="px-4 py-3 text-right">Margin ₦</th>
                <th className="px-4 py-3 text-center">Sold (Wk)</th>
                <th className="px-5 py-3 text-right">Profit (Wk)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)] font-medium text-body-brown">
              {displayProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-gray">
                    No products added yet.
                  </td>
                </tr>
              ) : (
                displayProducts.map((p) => (
                  <tr
                    key={p.productId}
                    onClick={() => p._original && setSelectedProduct(p._original)}
                    className="hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-heading-charcoal uppercase">
                      {p.name}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.costPerUnit !== null ? `₦${p.costPerUnit.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      ₦{p.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[12px] font-bold ${
                          p.status === "green"
                            ? "bg-[var(--color-grass-green)]/20 text-[var(--color-grass-green)]"
                            : p.status === "yellow"
                            ? "bg-[var(--color-honey)]/20 text-[var(--color-gold)]"
                            : "bg-[var(--color-alert-red)]/20 text-[var(--color-alert-red)]"
                        }`}
                      >
                        {p.marginPercent !== null ? `${p.marginPercent}%` : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.marginAmount !== null ? `₦${p.marginAmount.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center">{p.units_sold_this_week}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-heading-charcoal">
                      ₦{p.total_profit_this_week?.toFixed(2) ?? "0.00"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repricing Modal */}
      {selectedProduct && (
        <PriceUpdateModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
