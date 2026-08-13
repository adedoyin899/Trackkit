import { describe, it, expect } from "vitest";
import type { SupplierStat } from "../lib/types";

// ─── Pure logic helpers extracted from fetchSupplierStats ────────────────────

/** Computes savings percent relative to the most expensive supplier. */
function computeSavings(avgPrice: number | null, maxAvg: number): number {
  if (avgPrice === null || maxAvg === 0) return 0;
  return Math.round(((maxAvg - avgPrice) / maxAvg) * 100);
}

/** Ranks suppliers: sorts by avgPrice ascending, marks cheapest, computes savings. */
function rankSuppliers(
  raw: { name: string; avgPrice: number | null; totalSpent: number; totalQty: number; lastPrice: number | null; lastDate: string | null; purchaseCount: number }[],
): SupplierStat[] {
  if (raw.length === 0) return [];

  const sorted = [...raw].sort(
    (a, b) => (a.avgPrice ?? Infinity) - (b.avgPrice ?? Infinity),
  );
  const maxAvg = sorted.reduce((mx, s) => Math.max(mx, s.avgPrice ?? 0), 0);

  return sorted.map((s, idx) => ({
    ...s,
    savingsPercent: computeSavings(s.avgPrice, maxAvg),
    isCheapest: idx === 0 && sorted.length > 1,
  }));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("rankSuppliers", () => {
  it("returns empty array for no suppliers", () => {
    expect(rankSuppliers([])).toEqual([]);
  });

  it("marks cheapest supplier correctly", () => {
    const result = rankSuppliers([
      { name: "Lagos Dairy", avgPrice: 800, totalSpent: 16000, totalQty: 20, lastPrice: 800, lastDate: "2026-08-10", purchaseCount: 2 },
      { name: "Kano Wholesale", avgPrice: 790, totalSpent: 11850, totalQty: 15, lastPrice: 790, lastDate: "2026-08-12", purchaseCount: 1 },
    ]);
    expect(result[0].name).toBe("Kano Wholesale");
    expect(result[0].isCheapest).toBe(true);
    expect(result[1].name).toBe("Lagos Dairy");
    expect(result[1].isCheapest).toBe(false);
  });

  it("calculates savings percent correctly", () => {
    // max=800, cheapest=790 → savings = (800-790)/800 * 100 = 1.25% → round → 1%
    const result = rankSuppliers([
      { name: "Lagos Dairy", avgPrice: 800, totalSpent: 16000, totalQty: 20, lastPrice: 800, lastDate: null, purchaseCount: 2 },
      { name: "Kano Wholesale", avgPrice: 790, totalSpent: 11850, totalQty: 15, lastPrice: 790, lastDate: null, purchaseCount: 1 },
    ]);
    // Cheapest (Kano) savings = (800-790)/800 = 1.25% → 1%
    expect(result[0].savingsPercent).toBe(1);
    // Most expensive (Lagos) savings = 0%
    expect(result[1].savingsPercent).toBe(0);
  });

  it("single supplier is never marked cheapest", () => {
    const result = rankSuppliers([
      { name: "Solo Supplier", avgPrice: 500, totalSpent: 5000, totalQty: 10, lastPrice: 500, lastDate: null, purchaseCount: 1 },
    ]);
    expect(result[0].isCheapest).toBe(false);
  });

  it("handles null avgPrice gracefully (sorts to end)", () => {
    const result = rankSuppliers([
      { name: "Lagos Dairy", avgPrice: 800, totalSpent: 16000, totalQty: 20, lastPrice: 800, lastDate: null, purchaseCount: 2 },
      { name: "Unknown", avgPrice: null, totalSpent: 0, totalQty: 3, lastPrice: null, lastDate: null, purchaseCount: 1 },
    ]);
    expect(result[0].name).toBe("Lagos Dairy");
    expect(result[1].name).toBe("Unknown");
  });

  it("sorts 3+ suppliers cheapest first", () => {
    const result = rankSuppliers([
      { name: "C", avgPrice: 900, totalSpent: 0, totalQty: 5, lastPrice: null, lastDate: null, purchaseCount: 1 },
      { name: "A", avgPrice: 700, totalSpent: 0, totalQty: 5, lastPrice: null, lastDate: null, purchaseCount: 1 },
      { name: "B", avgPrice: 800, totalSpent: 0, totalQty: 5, lastPrice: null, lastDate: null, purchaseCount: 1 },
    ]);
    expect(result.map((s) => s.name)).toEqual(["A", "B", "C"]);
    expect(result[0].isCheapest).toBe(true);
    expect(result[1].isCheapest).toBe(false);
    expect(result[2].isCheapest).toBe(false);
  });
});

describe("computeSavings", () => {
  it("returns 0 when maxAvg is 0", () => {
    expect(computeSavings(0, 0)).toBe(0);
  });

  it("returns 0 for the most expensive supplier (same price as max)", () => {
    expect(computeSavings(800, 800)).toBe(0);
  });

  it("returns correct savings percent", () => {
    // (800-790)/800 * 100 = 1.25 → 1
    expect(computeSavings(790, 800)).toBe(1);
  });

  it("returns 100 if supplier price is 0 (free)", () => {
    expect(computeSavings(0, 800)).toBe(100);
  });

  it("returns 0 for null avgPrice", () => {
    expect(computeSavings(null, 800)).toBe(0);
  });
});
