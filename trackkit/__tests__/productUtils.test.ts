import { describe, it, expect } from "vitest";
import { isLowStock, sortByLowStockFirst } from "../lib/product-utils";
import type { Product } from "../lib/types";

// ─── Fixture factory ─────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "test-id",
    user_id: null,
    name: "Test Product",
    category: null,
    current_quantity: 10,
    unit: "Carton",
    low_stock_threshold: null,
    selling_price_per_unit: null,
    cost_per_unit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

// ─── isLowStock ───────────────────────────────────────────────────────────────

describe("isLowStock", () => {
  it("returns false when no threshold is set", () => {
    const p = makeProduct({ current_quantity: 0, low_stock_threshold: null });
    expect(isLowStock(p)).toBe(false);
  });

  it("returns true when quantity equals threshold", () => {
    const p = makeProduct({ current_quantity: 5, low_stock_threshold: 5 });
    expect(isLowStock(p)).toBe(true);
  });

  it("returns true when quantity is below threshold", () => {
    const p = makeProduct({ current_quantity: 3, low_stock_threshold: 5 });
    expect(isLowStock(p)).toBe(true);
  });

  it("returns false when quantity is above threshold", () => {
    const p = makeProduct({ current_quantity: 6, low_stock_threshold: 5 });
    expect(isLowStock(p)).toBe(false);
  });

  it("returns true when quantity is 0 and threshold is 0", () => {
    const p = makeProduct({ current_quantity: 0, low_stock_threshold: 0 });
    expect(isLowStock(p)).toBe(true);
  });
});

// ─── sortByLowStockFirst ─────────────────────────────────────────────────────

describe("sortByLowStockFirst", () => {
  it("returns empty array unchanged", () => {
    expect(sortByLowStockFirst([])).toEqual([]);
  });

  it("puts low-stock items first", () => {
    const ok = makeProduct({ id: "ok", current_quantity: 20, low_stock_threshold: 5 });
    const low = makeProduct({ id: "low", current_quantity: 2, low_stock_threshold: 5 });
    const result = sortByLowStockFirst([ok, low]);
    expect(result[0].id).toBe("low");
    expect(result[1].id).toBe("ok");
  });

  it("sorts multiple low-stock items by quantity ascending (most urgent first)", () => {
    const a = makeProduct({ id: "a", current_quantity: 4, low_stock_threshold: 5 });
    const b = makeProduct({ id: "b", current_quantity: 1, low_stock_threshold: 5 });
    const c = makeProduct({ id: "c", current_quantity: 3, low_stock_threshold: 5 });
    const result = sortByLowStockFirst([a, b, c]);
    expect(result.map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("preserves order of non-low-stock items", () => {
    const x = makeProduct({ id: "x", current_quantity: 100 });
    const y = makeProduct({ id: "y", current_quantity: 50 });
    const result = sortByLowStockFirst([x, y]);
    expect(result.map((p) => p.id)).toEqual(["x", "y"]);
  });

  it("handles products without threshold as never low-stock", () => {
    const noThreshold = makeProduct({ id: "no", current_quantity: 0, low_stock_threshold: null });
    const withThreshold = makeProduct({ id: "yes", current_quantity: 1, low_stock_threshold: 5 });
    const result = sortByLowStockFirst([noThreshold, withThreshold]);
    expect(result[0].id).toBe("yes");
    expect(result[1].id).toBe("no");
  });
});
