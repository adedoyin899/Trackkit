import { describe, it, expect } from "vitest";
import { linearRegression } from "../lib/analytics";

describe("linearRegression", () => {
  it("returns zero slope and r2 for a single value", () => {
    const result = linearRegression([5]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(5);
    expect(result.r2).toBe(0);
  });

  it("fits a perfect upward trend with slope 1 and r2 = 1", () => {
    // 0, 1, 2, 3, 4 — a perfectly linear series
    const result = linearRegression([0, 1, 2, 3, 4]);
    expect(result.slope).toBeCloseTo(1, 5);
    expect(result.intercept).toBeCloseTo(0, 5);
    expect(result.r2).toBeCloseTo(1, 5);
  });

  it("fits a perfect downward trend with negative slope and r2 = 1", () => {
    const result = linearRegression([10, 8, 6, 4, 2]);
    expect(result.slope).toBeCloseTo(-2, 5);
    expect(result.r2).toBeCloseTo(1, 5);
  });

  it("gives a low r2 for flat/noisy data with no real trend", () => {
    const result = linearRegression([5, 2, 8, 1, 6, 3]);
    expect(result.r2).toBeLessThan(0.5);
  });

  it("returns r2 = 1 for a perfectly flat series with zero variance", () => {
    // No slope, no variance — ssTot is 0, which the implementation treats
    // as a perfect (not undefined/NaN) fit rather than dividing by zero.
    const result = linearRegression([4, 4, 4, 4]);
    expect(result.slope).toBe(0);
    expect(result.r2).toBe(1);
  });
});
