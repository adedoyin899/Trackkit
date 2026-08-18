"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowsClockwise,
  Package,
  User,
  CurrencyNgn,
  X,
  Lightning,
} from "@phosphor-icons/react";
import { useAllSupplierNames } from "@/hooks/useTransactions";
import type { Product } from "@/lib/types";

interface RestockModalProps {
  product: Product;
  onConfirm: (data: {
    quantity: number;
    supplier?: string;
    costPerUnit?: number;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const RECENT_KEY = "trackkit-recent-suppliers";

function getRecentSuppliers(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecentSupplier(name: string) {
  const list = getRecentSuppliers().filter((s) => s !== name);
  list.unshift(name);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
}

export function RestockModal({ product, onConfirm, onClose }: RestockModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState("");
  const [costStr, setCostStr] = useState(
    product.cost_per_unit != null ? String(product.cost_per_unit) : "",
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  const { data: allSupplierNames = [] } = useAllSupplierNames();
  const recentSuppliers = getRecentSuppliers();

  // Combine recent + global, deduplicated
  const allSuggestions = Array.from(
    new Set([...recentSuppliers, ...allSupplierNames]),
  );
  const filteredSuggestions = supplier
    ? allSuggestions.filter((s) =>
        s.toLowerCase().includes(supplier.toLowerCase()),
      )
    : allSuggestions;

  // Cost preview
  const costNum = Number(costStr);
  const sellingPrice = product.selling_price_per_unit ?? 0;
  const marginPreview =
    costStr !== "" && !isNaN(costNum) && costNum > 0 && sellingPrice > 0
      ? Math.round(((sellingPrice - costNum) / costNum) * 100)
      : null;

  const handleConfirm = async () => {
    if (quantity <= 0) return;
    setSaving(true);
    try {
      if (supplier.trim()) saveRecentSupplier(supplier.trim());
      await onConfirm({
        quantity,
        supplier: supplier.trim() || undefined,
        costPerUnit:
          costStr !== "" && !isNaN(costNum) && costNum > 0 ? costNum : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleQuickLog = async () => {
    setSaving(true);
    try {
      if (supplier.trim()) saveRecentSupplier(supplier.trim());
      await onConfirm({
        quantity: 1,
        supplier: supplier.trim() || undefined,
        costPerUnit:
          costStr !== "" && !isNaN(costNum) && costNum > 0 ? costNum : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Restock ${product.name}`}
        className="w-full max-w-md rounded-t-2xl bg-[var(--surface-card)] border border-[var(--border-hairline)] px-5 pt-5 pb-8 shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowsClockwise
              weight="fill"
              size={20}
              className="text-[var(--color-grass-green)]"
            />
            <h2 className="text-[17px] font-semibold text-heading-charcoal">
              Restock{" "}
              <span className="font-bold">
                {product.name}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-gray hover:bg-[var(--surface-card-secondary)] cursor-pointer"
          >
            <X />
          </button>
        </div>

        {/* Quick log CTA */}
        <button
          type="button"
          onClick={handleQuickLog}
          disabled={saving}
          className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-hairline)] py-2 text-[13px] text-muted-gray hover:bg-[var(--surface-canvas)] hover:text-heading-charcoal cursor-pointer disabled:opacity-50 transition-colors"
        >
          <Lightning weight="fill" size={14} />
          Quick +1 (skip details)
        </button>

        <div className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-body-brown">
              <Package size={14} /> Quantity ({product.unit}s)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-card-secondary)] text-[18px] font-bold text-heading-charcoal hover:bg-[var(--color-honey)]/20 cursor-pointer"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="w-20 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-center text-[16px] font-semibold text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-card-secondary)] text-[18px] font-bold text-heading-charcoal hover:bg-[var(--color-grass-green)]/20 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Supplier */}
          <div className="relative">
            <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-body-brown">
              <User size={14} /> Supplier (optional)
            </label>
            <input
              ref={supplierInputRef}
              type="text"
              value={supplier}
              onChange={(e) => {
                setSupplier(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Lagos Dairy, Kano Wholesale"
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-card)] shadow-subtle-3 max-h-36 overflow-y-auto">
                {filteredSuggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[13px] text-heading-charcoal hover:bg-[var(--surface-canvas)] cursor-pointer"
                      onMouseDown={() => {
                        setSupplier(s);
                        setShowSuggestions(false);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cost per unit */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-body-brown">
              <CurrencyNgn size={14} /> Cost per {product.unit} (optional)
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 focus-within:border-[var(--color-link-blue)]">
              <span className="text-[13px] text-muted-gray">₦</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={costStr}
                onChange={(e) => setCostStr(e.target.value)}
                placeholder={
                  product.cost_per_unit != null
                    ? `Last: ₦${product.cost_per_unit}`
                    : "0.00"
                }
                className="flex-1 bg-transparent text-[14px] text-heading-charcoal outline-none"
              />
            </div>
            {marginPreview !== null && (
              <p
                className={`mt-1 text-right text-[12px] font-medium ${
                  marginPreview >= 30
                    ? "text-[var(--color-grass-green)]"
                    : marginPreview >= 10
                    ? "text-[var(--color-gold)]"
                    : "text-[var(--color-alert-red)]"
                }`}
              >
                Margin at this cost: {marginPreview}%
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-body-brown">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='e.g. "Bulk discount", "New supplier"'
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-2 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
            />
          </div>
        </div>

        {/* Confirm */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving || quantity <= 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-buttons bg-[var(--color-grass-green)] py-3.5 text-[16px] font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          <ArrowsClockwise weight="fill" />
          {saving ? "Saving…" : `Restock +${quantity} ${product.unit}(s)`}
        </button>
      </div>
    </div>
  );
}
