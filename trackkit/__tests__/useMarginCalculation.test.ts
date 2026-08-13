import { describe, it, expect } from "vitest";
import {
  calculateMargin,
  suggestTargetPrice,
  getMarginStatus,
} from "../hooks/useMarginCalculation";

describe("calculateMargin", () => {
  // ─── Positional args ───────────────────────────────────────────────────────

  it("returns green for >30% margin (positional)", () => {
    // cost=50, selling=75 → margin = (75-50)/50 * 100 = 50%
    const result = calculateMargin(50, 75);
    expect(result.marginPercent).toBe(50);
    expect(result.marginAmount).toBe(25);
    expect(result.status).toBe("green");
  });

  it("returns yellow for 10–30% margin (positional)", () => {
    // cost=800, selling=960 → margin = 20%
    const result = calculateMargin(800, 960);
    expect(result.marginPercent).toBe(20);
    expect(result.status).toBe("yellow");
  });

  it("returns red for <10% margin (positional)", () => {
    // cost=800, selling=810 → margin = 1.25% ≈ 1%
    const result = calculateMargin(800, 810);
    expect(result.marginPercent).toBe(1);
    expect(result.status).toBe("red");
  });

  it("returns red for negative margin / selling below cost", () => {
    const result = calculateMargin(800, 700);
    // (700-800)/800 * 100 = -12.5 → Math.round(-12.5) = -12 (JS rounds toward +∞)
    expect(result.marginPercent).toBe(-12);
    expect(result.marginAmount).toBe(-100);
    expect(result.status).toBe("red");
  });

  it("returns null/red when cost is zero", () => {
    const result = calculateMargin(0, 100);
    expect(result.marginPercent).toBeNull();
    expect(result.marginAmount).toBeNull();
    expect(result.status).toBe("red");
  });

  it("returns null/red when cost is null", () => {
    const result = calculateMargin(null, 100);
    expect(result.marginPercent).toBeNull();
    expect(result.status).toBe("red");
  });

  it("returns null/red when selling price is null", () => {
    const result = calculateMargin(500, null);
    expect(result.marginPercent).toBeNull();
    expect(result.status).toBe("red");
  });

  // ─── Object args ────────────────────────────────────────────────────────────

  it("works with object argument form", () => {
    const result = calculateMargin({ costPerUnit: 100, sellingPricePerUnit: 150 });
    expect(result.marginPercent).toBe(50);
    expect(result.marginAmount).toBe(50);
    expect(result.status).toBe("green");
  });

  it("handles undefined fields in object form gracefully", () => {
    const result = calculateMargin({ costPerUnit: undefined, sellingPricePerUnit: 150 });
    expect(result.marginPercent).toBeNull();
    expect(result.status).toBe("red");
  });

  // ─── Boundary cases ─────────────────────────────────────────────────────────

  it("returns yellow at exactly 10%", () => {
    // cost=100, selling=110 → 10%
    const result = calculateMargin(100, 110);
    expect(result.marginPercent).toBe(10);
    expect(result.status).toBe("yellow");
  });

  it("returns green above 30%", () => {
    // cost=100, selling=131 → 31%
    const result = calculateMargin(100, 131);
    expect(result.marginPercent).toBe(31);
    expect(result.status).toBe("green");
  });

  it("rounds margin percent correctly", () => {
    // cost=800, selling=810 → (10/800)*100 = 1.25 → round to 1
    const result = calculateMargin(800, 810);
    expect(result.marginPercent).toBe(1);
  });
});

describe("suggestTargetPrice", () => {
  it("suggests 30% margin price by default", () => {
    // cost=100, target=30% → 130
    expect(suggestTargetPrice(100)).toBe(130);
  });

  it("uses custom target margin", () => {
    // cost=800, target=6.25% → 850
    expect(suggestTargetPrice(800, 6.25)).toBe(850);
  });

  it("returns null for zero cost", () => {
    expect(suggestTargetPrice(0)).toBeNull();
  });

  it("returns null for null cost", () => {
    expect(suggestTargetPrice(null)).toBeNull();
  });

  it("rounds suggested price to nearest integer", () => {
    // cost=333, target=30% → 432.9 → 433
    expect(suggestTargetPrice(333, 30)).toBe(433);
  });
});

describe("getMarginStatus", () => {
  it("returns green above 30", () => {
    expect(getMarginStatus(31)).toBe("green");
    expect(getMarginStatus(100)).toBe("green");
  });

  it("returns yellow at 10–30", () => {
    expect(getMarginStatus(10)).toBe("yellow");
    expect(getMarginStatus(30)).toBe("yellow");
    expect(getMarginStatus(20)).toBe("yellow");
  });

  it("returns red below 10", () => {
    expect(getMarginStatus(9)).toBe("red");
    expect(getMarginStatus(0)).toBe("red");
    expect(getMarginStatus(-5)).toBe("red");
  });

  it("returns red for null", () => {
    expect(getMarginStatus(null)).toBe("red");
  });

  it("returns red for undefined", () => {
    expect(getMarginStatus(undefined)).toBe("red");
  });
});
