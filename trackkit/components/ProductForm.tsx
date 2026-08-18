"use client";

import { useState, type FormEvent } from "react";
import { Trash, X } from "@phosphor-icons/react";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import type { Product } from "@/lib/types";

const CATEGORIES = ["FMCG", "Dairy", "Sugar/Flour", "Spices", "Oil", "Custom"];
const UNITS = ["Carton", "Tin", "Bag", "Box", "Crate"];

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, updateProduct, deleteProduct, isMutating } = useLocalInventory();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0]);
  const [quantity, setQuantity] = useState(String(product?.current_quantity ?? 0));
  const [unit, setUnit] = useState(product?.unit ?? UNITS[0]);
  const [threshold, setThreshold] = useState(
    product?.low_stock_threshold != null ? String(product.low_stock_threshold) : "",
  );
  const [price, setPrice] = useState(
    product?.selling_price_per_unit != null ? String(product.selling_price_per_unit) : "",
  );
  const [cost, setCost] = useState(
    product?.cost_per_unit != null ? String(product.cost_per_unit) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);

    if (!name.trim() || !unit.trim()) {
      setError("Name and unit are required.");
      return;
    }
    if (Number.isNaN(qty) || qty < 0) {
      setError("Quantity must be 0 or more.");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      current_quantity: qty,
      unit,
      low_stock_threshold: threshold === "" ? null : Number(threshold),
      selling_price_per_unit: price === "" ? null : Number(price),
      cost_per_unit: cost === "" ? null : Number(cost),
    };

    if (isEdit && product) {
      await updateProduct(product.id, payload);
    } else {
      await addProduct(payload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm("This will delete all history. Sure?")) return;
    await deleteProduct(product.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center">
      <div className="w-full max-w-sm rounded-t-cards bg-[var(--surface-card)] border border-[var(--border-hairline)] p-6 shadow-lg sm:rounded-cards">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[19px] font-medium text-heading-charcoal">
            {isEdit ? "Edit Product" : "Add Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-muted-gray hover:text-heading-charcoal hover:bg-[var(--surface-canvas)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-body-brown">
              Product Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
              placeholder="e.g. Noodles"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body-brown">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-body-brown">
                Current Qty *
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-body-brown">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body-brown">
              Low-Stock Alert
            </label>
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal"
              placeholder="units"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-body-brown">
                Cost per Unit (optional)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal"
                placeholder="₦"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-body-brown">
                Selling Price (optional)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-3 text-[16px] text-heading-charcoal"
                placeholder="₦"
              />
            </div>
          </div>

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
              {isEdit ? "Save" : "Add Product"}
            </button>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-[var(--color-alert-red)] hover:opacity-80 cursor-pointer"
            >
              <Trash /> Delete product
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
