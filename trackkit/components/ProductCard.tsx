"use client";

import { useState } from "react";
import { ArrowsClockwise, Minus, PencilSimple, Plus, Warning, Package } from "@phosphor-icons/react";
import { useTrackkitStore } from "@/lib/store";
import { useTransactions } from "@/hooks/useTransactions";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { useMarginCalculation } from "@/hooks/useMarginCalculation";
import { isLowStock } from "@/lib/product-utils";
import { RestockModal } from "@/components/RestockModal";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { logTransaction, isLogging, transactions } = useTransactions(product.id);
  const { updateProduct } = useLocalInventory();
  const { calculateMargin } = useMarginCalculation();
  const selectedProductId = useTrackkitStore((s) => s.selectedProductId);
  const setSelectedProductId = useTrackkitStore((s) => s.setSelectedProductId);
  const currency = useTrackkitStore((s) => s.currency);
  const lowStock = isLowStock(product);
  const isSelected = selectedProductId === product.id;

  const [expanded, setExpanded] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editCost, setEditCost] = useState(
    product.cost_per_unit != null ? String(product.cost_per_unit) : ""
  );

  const adjust = (type: "sale" | "restock", quantity = 1, supplier?: string, costPerUnit?: number) => {
    logTransaction({ type, quantity, supplier, costPerUnit }).catch(() => {
      /* surfaced via query error state elsewhere */
    });
  };

  const handleSaveCost = async () => {
    const costVal = editCost === "" ? null : Number(editCost);
    if (costVal !== product.cost_per_unit) {
      await updateProduct(product.id, { cost_per_unit: costVal });
    }
  };

  // Calculate margin details
  const { marginPercent, marginAmount, status } = calculateMargin(
    product.cost_per_unit,
    product.selling_price_per_unit
  );

  // Real-time recalculation preview
  const costNum = Number(editCost);
  const sellingNum = product.selling_price_per_unit ?? 0;
  const showPreview =
    editCost !== "" &&
    !isNaN(costNum) &&
    costNum > 0 &&
    costNum !== product.cost_per_unit;
  
  let previewPercent = null;
  let previewAmount = null;
  if (showPreview) {
    previewAmount = sellingNum - costNum;
    previewPercent = Math.round((previewAmount / costNum) * 100);
  }

  // Calculate sales this week
  const [sevenDaysAgo] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const weeklySales = transactions.filter(
    (t) =>
      t.transaction_type === "sale" &&
      new Date(t.created_at) >= sevenDaysAgo
  );
  const unitsSoldThisWeek = weeklySales.reduce((acc, t) => acc + t.quantity, 0);
  const totalProfitThisWeek = unitsSoldThisWeek * (marginAmount ?? 0);

  return (
    <div
      onClick={() => setSelectedProductId(product.id)}
      className={`rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 sm:p-5 shadow-subtle-3 transition-all cursor-pointer ${
        isSelected
          ? "ring-2 ring-[var(--color-link-blue)]"
          : lowStock
          ? "ring-2 ring-[var(--color-honey)]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {product.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.image_url}
              alt={product.name}
              className="h-11 w-11 shrink-0 rounded-xl object-cover border border-[var(--border-hairline)] shadow-xs"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-canvas)] text-heading-charcoal border border-[var(--border-hairline)]">
              <Package size={20} />
            </span>
          )}
          <div className="min-w-0">
            <span className="text-[17px] font-bold tracking-tight text-heading-charcoal truncate block">
              {product.name.toUpperCase()}
            </span>
            <span className="text-[12px] font-normal text-muted-gray">
              {product.category || "General"} · {product.unit}
            </span>
            {lowStock && (
              <span className="mt-1 flex w-fit items-center gap-1 rounded-badges bg-[var(--color-honey)]/20 px-2 py-0.5 text-[11px] font-bold text-[var(--color-gold)]">
                <Warning weight="fill" size={12} /> LOW STOCK
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProductId(product.id);
          }}
          aria-label={`Edit ${product.name}`}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-gray hover:bg-[var(--surface-card-secondary)] hover:text-heading-charcoal cursor-pointer transition-colors"
        >
          <PencilSimple size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="numo-display text-[40px] sm:text-[44px] leading-none text-heading-charcoal">
          {product.current_quantity}
        </span>
        <span className="text-[14px] font-semibold text-muted-gray">
          {product.unit}s in stock
        </span>
        {product.low_stock_threshold != null && (
          <span className="ml-auto text-[11px] font-semibold text-muted-gray bg-[var(--surface-canvas)] px-2 py-0.5 rounded-full border border-[var(--border-hairline)]">
            Alert ≤ {product.low_stock_threshold}
          </span>
        )}
      </div>

      {/* Monzo 500px Pill Stepper Actions */}
      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          disabled={product.current_quantity <= 0 || isLogging}
          onClick={(e) => {
            e.stopPropagation();
            adjust("sale", 1);
          }}
          aria-label={`Record sale for 1 ${product.name}`}
          className="monzo-pill flex flex-1 items-center justify-center gap-1.5 bg-[var(--color-alert-red)] py-2.5 text-[14px] font-bold text-white shadow-xs disabled:opacity-30 cursor-pointer hover:opacity-95 transition-all"
        >
          <Minus size={15} weight="bold" /> 1 Sale
        </button>
        <button
          type="button"
          disabled={isLogging}
          onClick={(e) => {
            e.stopPropagation();
            adjust("restock", 1);
          }}
          aria-label={`Record restock for 1 ${product.name}`}
          className="monzo-pill flex flex-1 items-center justify-center gap-1.5 bg-[var(--color-grass-green)] py-2.5 text-[14px] font-bold text-white shadow-xs disabled:opacity-30 cursor-pointer hover:opacity-95 transition-all"
        >
          <Plus size={15} weight="bold" /> 1 Restock
        </button>
      </div>

      <button
        type="button"
        disabled={isLogging}
        onClick={(e) => {
          e.stopPropagation();
          setShowRestockModal(true);
        }}
        aria-label={`Restock ${product.name} with supplier and cost details`}
        className="monzo-pill mt-2.5 flex w-full items-center justify-center gap-1.5 border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-2 text-[12px] font-bold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] disabled:opacity-30 cursor-pointer transition-colors"
      >
        <ArrowsClockwise size={14} /> Supplier & Cost Restock
      </button>

      {/* Pricing & Margins Section */}
      <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-[13px] font-semibold text-body-brown hover:text-heading-charcoal cursor-pointer"
        >
          <span>Pricing & Margins</span>
          <span className="text-[12px]">{expanded ? "Hide ▲" : "Show ▼"}</span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 rounded-lg bg-[var(--surface-canvas)] p-3 border border-[var(--border-hairline)]">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[12px] font-medium text-muted-gray">Cost Price:</label>
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-muted-gray">{currency}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  onBlur={handleSaveCost}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveCost();
                  }}
                  className="w-20 rounded border border-[var(--border-hairline)] bg-[var(--surface-card)] px-2 py-0.5 text-right text-[13px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                  placeholder="Cost"
                />
              </div>
            </div>

            {showPreview && (
              <div className="text-[11px] text-right font-medium text-[var(--color-link-blue)]">
                New margin: {currency}{previewAmount?.toFixed(2)} ({previewPercent}%)
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-gray">Selling Price:</span>
              <span className="text-[13px] font-semibold text-heading-charcoal">
                ₦{product.selling_price_per_unit?.toFixed(2) ?? "0.00"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-gray">Margin:</span>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[12px] font-semibold ${
                  status === "green"
                    ? "bg-[var(--color-grass-green)]/20 text-[var(--color-grass-green)]"
                    : status === "yellow"
                    ? "bg-[var(--color-honey)]/20 text-[var(--color-gold)]"
                    : "bg-[var(--color-alert-red)]/20 text-[var(--color-alert-red)]"
                }`}
              >
                {marginPercent !== null ? `${marginPercent}% (₦${marginAmount})` : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-stone-surface pt-2">
              <span className="text-[12px] font-medium text-muted-gray">Sold this week:</span>
              <span className="text-[12px] font-medium text-ink-black">
                {unitsSoldThisWeek} {product.unit}(s)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-gray">Weekly profit:</span>
              <span className="text-[13px] font-bold text-ink-black">
                ₦{totalProfitThisWeek.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {showRestockModal && (
        <RestockModal
          product={product}
          onClose={() => setShowRestockModal(false)}
          onConfirm={async ({ quantity, supplier, costPerUnit, notes }) => {
            // If cost changed, persist it on the product too
            if (costPerUnit != null && costPerUnit !== product.cost_per_unit) {
              await updateProduct(product.id, { cost_per_unit: costPerUnit });
            }
            await logTransaction({ type: "restock", quantity, supplier, costPerUnit, notes });
          }}
        />
      )}
    </div>
  );
}
