"use client";

import { Minus, PencilSimple, Plus, Warning } from "@phosphor-icons/react";
import { useMarketMateStore } from "@/lib/store";
import { useTransactions } from "@/hooks/useTransactions";
import { isLowStock } from "@/lib/product-utils";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { logTransaction, isLogging } = useTransactions(product.id);
  const setSelectedProductId = useMarketMateStore((s) => s.setSelectedProductId);
  const lowStock = isLowStock(product);

  const adjust = (type: "sale" | "restock", quantity = 1) => {
    logTransaction({ type, quantity }).catch(() => {
      /* surfaced via query error state elsewhere */
    });
  };

  return (
    <div
      className={`rounded-cards bg-white p-5 shadow-subtle-3 ${
        lowStock ? "ring-2 ring-[var(--color-honey)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[19px] font-medium tracking-[-0.019em] text-heading-charcoal">
            {product.name.toUpperCase()}{" "}
            <span className="text-[13px] font-normal text-muted-gray">
              ({product.unit})
            </span>
          </span>
          {lowStock && (
            <span className="mt-1 flex w-fit items-center gap-1 rounded-badges bg-[var(--color-honey)]/20 px-2 py-0.5 text-[12px] font-medium text-[var(--color-gold)]">
              <Warning weight="fill" /> LOW STOCK
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSelectedProductId(product.id)}
          aria-label={`Edit ${product.name}`}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted-gray hover:bg-stone-surface hover:text-heading-charcoal"
        >
          <PencilSimple />
        </button>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[44px] font-medium leading-none tracking-[-0.02em] text-ink-black">
          {product.current_quantity}
        </span>
        {product.low_stock_threshold != null && (
          <span className="text-[13px] text-muted-gray">
            Alert: {product.low_stock_threshold}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={product.current_quantity <= 0 || isLogging}
          onClick={() => adjust("sale", 1)}
          aria-label={`Decrease ${product.name} by 1`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-buttons bg-[var(--color-alert-red)] py-3 text-[16px] font-semibold text-white disabled:opacity-30"
        >
          <Minus /> 1
        </button>
        <button
          type="button"
          disabled={isLogging}
          onClick={() => adjust("restock", 1)}
          aria-label={`Increase ${product.name} by 1`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-buttons bg-[var(--color-grass-green)] py-3 text-[16px] font-semibold text-white disabled:opacity-30"
        >
          <Plus /> 1
        </button>
      </div>
    </div>
  );
}
