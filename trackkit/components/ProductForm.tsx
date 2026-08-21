"use client";

import { useState, useRef, type FormEvent } from "react";
import { Trash, X, Camera, Image as ImageIcon, UploadSimple } from "@phosphor-icons/react";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { useTrackkitStore } from "@/lib/store";
import type { Product } from "@/lib/types";

const CATEGORIES = ["FMCG", "Dairy", "Sugar/Flour", "Spices", "Oil", "Custom"];
const UNITS = ["Carton", "Tin", "Bag", "Box", "Crate", "Bottle", "Piece", "Pack"];

const PRESET_ICONS = [
  { label: "Dairy", emoji: "🥛" },
  { label: "Sugar/Grain", emoji: "🍚" },
  { label: "Noodles", emoji: "🍜" },
  { label: "Canned", emoji: "🥫" },
  { label: "Beverage", emoji: "🧃" },
  { label: "Beauty", emoji: "🧴" },
  { label: "Fashion", emoji: "👗" },
  { label: "Box", emoji: "📦" },
];

function createEmojiSvgDataUrl(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#f4efe6"/><text x="50%" y="54%" font-size="64" dominant-baseline="middle" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, updateProduct, deleteProduct, isMutating } = useLocalInventory();
  const currency = useTrackkitStore((s) => s.currency);
  const isEdit = Boolean(product);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [error, setError] = useState<string | null>(null);

  // Compress & convert selected file to compact Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
      image_url: imageUrl || null,
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
    if (!confirm("This will delete all history for this product. Are you sure?")) return;
    await deleteProduct(product.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl bg-[var(--surface-card)] border border-[var(--border-hairline)] p-5 sm:p-6 shadow-xl sm:rounded-cards animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <h2 className="text-[18px] font-bold text-heading-charcoal">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-gray hover:text-heading-charcoal hover:bg-[var(--surface-canvas)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Simple Product Image Setup */}
          <div>
            <label className="block text-[13px] font-semibold text-body-brown mb-1.5">
              Product Photo / Icon
            </label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative h-16 w-16 shrink-0 rounded-2xl border-2 border-[var(--border-hairline)] overflow-hidden bg-[var(--surface-canvas)] shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    aria-label="Remove image"
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                  >
                    <X size={11} weight="bold" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-muted-gray hover:text-heading-charcoal hover:border-ink-black/40 transition-colors cursor-pointer"
                >
                  <Camera size={22} />
                  <span className="text-[10px] font-semibold mt-0.5">Photo</span>
                </button>
              )}

              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3 py-1.5 text-[12px] font-semibold text-heading-charcoal hover:bg-[var(--surface-card-secondary)] cursor-pointer transition-colors"
                >
                  <UploadSimple size={14} /> {imageUrl ? "Change Photo" : "Upload Photo / Take Picture"}
                </button>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-muted-gray">Or pick icon:</span>
                  {PRESET_ICONS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImageUrl(createEmojiSvgDataUrl(p.emoji))}
                      title={p.label}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-canvas)] text-[14px] hover:scale-110 transition-transform cursor-pointer"
                    >
                      {p.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-body-brown mb-1">
              Product Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3.5 py-2.5 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
              placeholder="e.g. Peak Milk, Dangote Sugar"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-body-brown mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3.5 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)] cursor-pointer"
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
              <label className="block text-[13px] font-semibold text-body-brown mb-1">
                Current Quantity *
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3.5 py-2.5 text-[15px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-body-brown mb-1">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3.5 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)] cursor-pointer"
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
            <label className="block text-[13px] font-semibold text-body-brown mb-1">
              Low-Stock Alert Threshold
            </label>
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3.5 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
              placeholder="e.g. 5 units"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-body-brown mb-1">
                Cost per Unit ({currency})
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3.5 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                placeholder="e.g. 800"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-body-brown mb-1">
                Selling Price ({currency})
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-canvas)] px-3.5 py-2.5 text-[14px] text-heading-charcoal outline-none focus:border-[var(--color-link-blue)]"
                placeholder="e.g. 1000"
              />
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-[var(--color-alert-red)]">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-buttons bg-[var(--surface-card-secondary)] border border-[var(--border-hairline)] py-3 text-[14px] font-semibold text-heading-charcoal hover:opacity-80 cursor-pointer transition-opacity"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMutating}
              className="flex-1 rounded-buttons bg-ink-black py-3 text-[14px] font-semibold text-[var(--color-ink-black-text)] hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
            >
              {isEdit ? "Save Changes" : "Add Product"}
            </button>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="mt-1 flex w-full items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-[var(--color-alert-red)] hover:opacity-80 cursor-pointer"
            >
              <Trash size={15} /> Delete Product
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
