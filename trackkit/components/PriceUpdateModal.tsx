"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { useMarginCalculation } from "@/hooks/useMarginCalculation";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import type { Product } from "@/lib/types";

interface PriceUpdateModalProps {
  product: Product;
  onClose: () => void;
}

export function PriceUpdateModal({ product, onClose }: PriceUpdateModalProps) {
  const { updateProduct, isMutating } = useLocalInventory();
  const { calculateMargin, suggestTargetPrice } = useMarginCalculation();

  const [sellingPrice, setSellingPrice] = useState(
    product.selling_price_per_unit != null ? String(product.selling_price_per_unit) : ""
  );
  const [error, setError] = useState<string | null>(null);

  // Compute current margin details
  const {
    marginPercent: currentPercent,
    marginAmount: currentAmount,
    status: currentStatus,
  } = calculateMargin(product.cost_per_unit, product.selling_price_per_unit);

  // Compute real-time new margin preview based on input selling price
  const costVal = product.cost_per_unit ?? 0;
  const sellingVal = sellingPrice === "" ? 0 : Number(sellingPrice);
  const isInputValid = sellingPrice !== "" && !isNaN(sellingVal) && sellingVal >= 0;

  let newPercent: number | null = null;
  let newAmount: number | null = null;
  let newStatus: "green" | "yellow" | "red" = "red";

  if (isInputValid && costVal > 0) {
    newAmount = sellingVal - costVal;
    newPercent = Math.round((newAmount / costVal) * 100);

    if (newPercent > 30) {
      newStatus = "green";
    } else if (newPercent >= 10) {
      newStatus = "yellow";
    } else {
      newStatus = "red";
    }
  }

  const handleSuggestPrice = () => {
    if (costVal > 0) {
      const suggested = suggestTargetPrice(costVal, 30);
      if (suggested !== null) {
        setSellingPrice(String(suggested));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sellingPrice === "") {
      setError("Selling price is required.");
      return;
    }
    const priceNum = Number(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Please enter a valid non-negative selling price.");
      return;
    }

    await updateProduct(product.id, {
      selling_price_per_unit: priceNum,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center">
      <div className="w-full max-w-sm rounded-t-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-lg sm:rounded-cards">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[19px] font-medium text-heading-charcoal">Update Pricing</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-muted-gray hover:text-heading-charcoal hover:bg-[var(--surface-canvas)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-body-brown">Product Name</label>
            <div className="mt-1 text-[16px] font-semibold text-heading-charcoal uppercase">
              {product.name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-body-brown">Cost Price</label>
              <div className="mt-1 text-[15px] font-medium text-muted-gray">
                {product.cost_per_unit != null ? `₦${product.cost_per_unit.toFixed(2)}` : "Not set"}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-body-brown">Current Price</label>
              <div className="mt-1 text-[15px] font-medium text-muted-gray">
                {product.selling_price_per_unit != null
                  ? `₦${product.selling_price_per_unit.toFixed(2)}`
                  : "Not set"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body-brown">Current Margin</label>
            <div className="mt-1">
              <span
                className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[12px] font-semibold ${
                  currentStatus === "green"
                    ? "bg-[var(--color-grass-green)]/20 text-[var(--color-grass-green)]"
                    : currentStatus === "yellow"
                    ? "bg-[var(--color-honey)]/20 text-[var(--color-gold)]"
                    : "bg-[var(--color-alert-red)]/20 text-[var(--color-alert-red)]"
                }`}
              >
                {currentPercent !== null ? `${currentPercent}% (₦${currentAmount})` : "N/A"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body-brown">
              New Selling Price *
            </label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[16px] text-body-brown">₦</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                placeholder="Selling Price"
                required
              />
            </div>
          </div>

          {costVal > 0 && (
            <button
              type="button"
              onClick={handleSuggestPrice}
              className="text-[13px] font-semibold text-[var(--color-link-blue)] hover:opacity-80 cursor-pointer"
            >
              Suggest 30% margin (₦{suggestTargetPrice(costVal, 30)})
            </button>
          )}

          {isInputValid && costVal > 0 && (
            <div className="rounded-lg bg-[var(--surface-canvas)] border border-[var(--border-hairline)] p-3">
              <span className="text-[12px] font-medium text-muted-gray">New Margin Preview:</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[13px] font-bold ${
                    newStatus === "green"
                      ? "bg-[var(--color-grass-green)]/20 text-[var(--color-grass-green)]"
                      : newStatus === "yellow"
                      ? "bg-[var(--color-honey)]/20 text-[var(--color-gold)]"
                      : "bg-[var(--color-alert-red)]/20 text-[var(--color-alert-red)]"
                  }`}
                >
                  {newPercent}% (₦{newAmount})
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-[13px] text-[var(--color-alert-red)]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-buttons bg-[var(--surface-card-secondary)] border border-[var(--border-hairline)] py-3 text-[15px] font-semibold text-heading-charcoal hover:opacity-80 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMutating}
              className="flex-1 rounded-buttons bg-ink-black py-3 text-[15px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
