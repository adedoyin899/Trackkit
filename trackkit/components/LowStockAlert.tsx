"use client";

import { WarningCircle, WarningOctagon } from "@phosphor-icons/react";
import { useTransactions } from "@/hooks/useTransactions";
import type { Product } from "@/lib/types";

interface LowStockAlertProps {
  items: Product[];
}

function LowStockRow({ product }: { product: Product }) {
  const { logTransaction } = useTransactions(product.id);
  const critical = product.current_quantity === 0;

  return (
    <div className="flex items-center justify-between rounded-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-4 shadow-subtle-3">
      <div className="flex items-center gap-2">
        {critical ? (
          <WarningOctagon weight="fill" className="flex-shrink-0 text-[var(--color-alert-red)]" />
        ) : (
          <WarningCircle weight="fill" className="flex-shrink-0 text-[var(--color-gold)]" />
        )}
        <p className="text-[16px] font-medium text-heading-charcoal">
          {product.name}: {product.current_quantity}/
          {product.low_stock_threshold} {product.unit}
        </p>
      </div>
      <div className="flex gap-2">
        {[5, 10].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => logTransaction({ type: "restock", quantity: amount })}
            className="rounded-badges bg-[var(--surface-card-secondary)] border border-[var(--border-hairline)] px-3 py-1.5 text-[13px] font-semibold text-heading-charcoal hover:opacity-80 cursor-pointer transition-opacity"
          >
            +{amount}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-[15px] font-medium text-body-brown">
        LOW STOCK (Reorder soon!)
      </h3>
      <div className="space-y-2">
        {items.map((product) => (
          <LowStockRow key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
