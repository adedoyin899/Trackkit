"use client";

import { useState } from "react";
import {
  X,
  Package,
  TrendUp,
  ArrowsClockwise,
  Tag,
  Warning,
  CheckCircle,
  Coins,
} from "@phosphor-icons/react";
import type { Product } from "@/lib/types";
import { RestockModal } from "@/components/RestockModal";
import { PriceUpdateModal } from "@/components/PriceUpdateModal";
import { ProductForm } from "@/components/ProductForm";
import { useTransactions } from "@/hooks/useTransactions";
import { useMarginCalculation } from "@/hooks/useMarginCalculation";
import { useTrackkitStore } from "@/lib/store";

interface ProductInspectorProps {
  product: Product;
  onClose: () => void;
}

function formatMoney(val?: number | null, symbol = "₦"): string {
  if (val == null) return "—";
  return `${symbol}${val.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function ProductInspector({ product, onClose }: ProductInspectorProps) {
  const { logTransaction, isLogging } = useTransactions(product.id);
  const { calculateMargin } = useMarginCalculation();
  const currency = useTrackkitStore((s) => s.currency);
  const [activeModal, setActiveModal] = useState<"restock" | "reprice" | "edit" | null>(null);

  const cost = product.cost_per_unit;
  const price = product.selling_price_per_unit;
  const { marginPercent, marginAmount } = calculateMargin(cost, price);

  const isLowStock =
    product.low_stock_threshold != null &&
    product.current_quantity <= product.low_stock_threshold;
  const isOutOfStock = product.current_quantity === 0;

  const handleQuickAddOne = async () => {
    try {
      await logTransaction({ type: "restock", quantity: 1 });
    } catch {
      /* Handled elsewhere */
    }
  };

  const handleRestockConfirm = async (data: {
    quantity: number;
    supplier?: string;
    costPerUnit?: number;
    notes?: string;
  }) => {
    await logTransaction({
      type: "restock",
      quantity: data.quantity,
      supplier: data.supplier,
      costPerUnit: data.costPerUnit,
      notes: data.notes,
    });
  };

  return (
    <>
      <aside className="sticky top-6 flex h-[calc(100vh-3rem)] w-full flex-col rounded-cards border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 shadow-subtle-3 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
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
              <h3 className="truncate text-[16px] font-bold text-heading-charcoal uppercase">
                {product.name}
              </h3>
              <p className="text-[12px] text-muted-gray">
                {product.category || "General"} · {product.unit}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted-gray hover:text-heading-charcoal hover:bg-[var(--surface-canvas)] transition-colors cursor-pointer"
            aria-label="Close inspector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stock Status Banner */}
        <div
          className={`mt-4 flex items-center justify-between rounded-xl border p-3 ${
            isOutOfStock
              ? "border-[var(--color-alert-red)]/30 bg-[var(--color-alert-red)]/10 text-[var(--color-alert-red)]"
              : isLowStock
              ? "border-[var(--color-ember-orange)]/30 bg-[var(--color-ember-orange)]/10 text-ember-orange"
              : "border-[var(--color-grass-green)]/30 bg-[var(--color-grass-green)]/10 text-[var(--color-grass-green)]"
          }`}
        >
          <div className="flex items-center gap-2">
            {isOutOfStock || isLowStock ? <Warning size={18} /> : <CheckCircle size={18} />}
            <span className="text-[13px] font-semibold">
              {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock Alert" : "In Stock"}
            </span>
          </div>
          <span className="text-[17px] font-bold">
            {product.current_quantity} <span className="text-[12px] font-normal">{product.unit}s</span>
          </span>
        </div>

        {/* Quick Action Bar */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isLogging}
            onClick={handleQuickAddOne}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-2.5 text-[13px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] disabled:opacity-50 cursor-pointer transition-colors"
          >
            <ArrowsClockwise size={15} className="text-[var(--color-grass-green)]" />
            +1 Restock
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("restock")}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-ink-black py-2.5 text-[13px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 cursor-pointer transition-opacity"
          >
            Full Restock Log
          </button>
        </div>

        {/* Financial & Margin Breakdown */}
        <div className="mt-5 space-y-3">
          <h4 className="flex items-center gap-1.5 text-[13px] font-semibold text-body-brown uppercase tracking-wider">
            <Coins size={14} /> Pricing & Profit Margins
          </h4>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-3">
              <p className="text-[11px] text-muted-gray">Selling Price</p>
              <p className="mt-0.5 text-[15px] font-bold text-heading-charcoal">
                {formatMoney(price, currency)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] p-3">
              <p className="text-[11px] text-muted-gray">Cost Price</p>
              <p className="mt-0.5 text-[15px] font-bold text-heading-charcoal">
                {formatMoney(cost, currency)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-card-secondary)] p-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-gray">Profit per Unit:</span>
              <span className="font-bold text-heading-charcoal">
                {formatMoney(marginAmount, currency)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="text-muted-gray">Profit Margin %:</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold ${
                  marginPercent != null && marginPercent >= 30
                    ? "bg-[var(--color-grass-green)]/15 text-[var(--color-grass-green)]"
                    : marginPercent != null && marginPercent >= 15
                    ? "bg-[var(--color-gold)]/15 text-[var(--color-gold)]"
                    : "bg-[var(--color-alert-red)]/15 text-[var(--color-alert-red)]"
                }`}
              >
                <TrendUp size={12} />
                {marginPercent != null ? `${marginPercent}%` : "N/A"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal("reprice")}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-2 text-[13px] font-medium text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
          >
            <Tag size={14} /> Update Selling Price
          </button>
        </div>

        {/* Product Details & Category */}
        <div className="mt-5 space-y-2 border-t border-[var(--border-hairline)] pt-4">
          <div className="flex justify-between text-[12px]">
            <span className="text-muted-gray">Category:</span>
            <span className="font-medium text-heading-charcoal">{product.category ?? "General Store"}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-muted-gray">Low Stock Threshold:</span>
            <span className="font-medium text-heading-charcoal">
              {product.low_stock_threshold != null ? `${product.low_stock_threshold} ${product.unit}s` : "Not set"}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-muted-gray">Last Updated:</span>
            <span className="font-medium text-heading-charcoal">
              {product.updated_at ? new Date(product.updated_at).toLocaleDateString("en-NG") : "Recently"}
            </span>
          </div>
        </div>

        {/* Bottom Edit Trigger */}
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => setActiveModal("edit")}
            className="flex w-full items-center justify-center gap-1.5 rounded-buttons border border-[var(--border-hairline)] bg-[var(--surface-canvas)] py-2.5 text-[13px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
          >
            Edit Product Details
          </button>
        </div>
      </aside>

      {/* Modals triggered from inspector */}
      {activeModal === "restock" && (
        <RestockModal
          product={product}
          onConfirm={handleRestockConfirm}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "reprice" && (
        <PriceUpdateModal product={product} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "edit" && (
        <ProductForm product={product} onClose={() => setActiveModal(null)} />
      )}
    </>
  );
}
