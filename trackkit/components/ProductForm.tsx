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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-cards bg-white p-6 shadow-lg sm:rounded-cards">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[19px] font-medium text-heading-charcoal">
            {isEdit ? "Edit Product" : "Add Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-gray hover:text-heading-charcoal"
            aria-label="Close"
          >
            <X />
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
              className="mt-1 w-full rounded-lg border border-stone-surface bg-cream-canvas px-3 py-3 text-[16px] outline-none focus:border-[var(--color-link-blue)]"
              placeholder="e.g. Noodles"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body-brown">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-surface bg-cream-canvas px-3 py-3 text-[16px]"
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
                className="mt-1 w-full rounded-lg border border-stone-surface bg-cream-canvas px-3 py-3 text-[16px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-body-brown">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-surface bg-cream-canvas px-3 py-3 text-[16px]"
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
              className="mt-1 w-full rounded-lg border border-stone-surface bg-cream-canvas px-3 py-3 text-[16px]"
              placeholder="units"
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
              className="mt-1 w-full rounded-lg border border-stone-surface bg-cream-canvas px-3 py-3 text-[16px]"
              placeholder="₦"
            />
          </div>

          {error && <p className="text-[13px] text-[var(--color-alert-red)]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-buttons bg-sand-surface py-3 text-[15px] font-semibold text-ink-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMutating}
              className="flex-1 rounded-buttons bg-ink-black py-3 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              Save
            </button>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center justify-center gap-1.5 pt-2 text-[13px] font-medium text-[var(--color-alert-red)]"
            >
              <Trash /> Delete product
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
