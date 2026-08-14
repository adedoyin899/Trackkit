import { describe, it, expect } from "vitest";
import { computeStockOutProjection } from "../lib/reorder-recommendation";

const DAY_MS = 24 * 60 * 60 * 1000;
// Fixed reference instant so date math in assertions is deterministic
// rather than depending on when the test happens to run.
const NOW = new Date("2026-08-14T00:00:00.000Z").getTime();

describe("computeStockOutProjection", () => {
  it("marks high urgency when stock runs out in under 3 days", () => {
    // 2 units left, selling 1/day -> 2 days of stock
    const result = computeStockOutProjection(2, 1, 1, NOW);
    expect(result.daysOfStock).toBe(2);
    expect(result.urgency).toBe("high");
    expect(result.worthFlagging).toBe(true);
  });

  it("marks medium urgency between 3 and 7 days of stock", () => {
    // 5 units left, selling 1/day -> 5 days of stock
    const result = computeStockOutProjection(5, 1, 1, NOW);
    expect(result.daysOfStock).toBe(5);
    expect(result.urgency).toBe("medium");
  });

  it("marks low urgency between 7 and 21 days of stock", () => {
    // 10 units left, selling 1/day -> 10 days of stock
    const result = computeStockOutProjection(10, 1, 1, NOW);
    expect(result.daysOfStock).toBe(10);
    expect(result.urgency).toBe("low");
    expect(result.worthFlagging).toBe(true);
  });

  it("stops flagging once there's 21+ days of runway", () => {
    // 25 units left, selling 1/day -> 25 days of stock — plenty of runway
    const result = computeStockOutProjection(25, 1, 1, NOW);
    expect(result.worthFlagging).toBe(false);
  });

  it("computes the run-out date as now + daysOfStock days", () => {
    const result = computeStockOutProjection(4, 2, 1, NOW); // 2 days of stock
    expect(result.runOutDate.getTime()).toBe(NOW + 2 * DAY_MS);
  });

  it("recommends reordering (leadTimeDays + 0.5) days before the run-out date", () => {
    const result = computeStockOutProjection(3, 1, 1, NOW); // 3 days of stock, 1-day lead time
    const expectedReorderDate = NOW + 3 * DAY_MS - 1.5 * DAY_MS;
    expect(result.recommendedReorderDate.getTime()).toBe(expectedReorderDate);
  });

  it("a longer supplier lead time pushes the recommended reorder date earlier", () => {
    const fastLeadTime = computeStockOutProjection(10, 1, 1, NOW);
    const slowLeadTime = computeStockOutProjection(10, 1, 5, NOW);
    expect(slowLeadTime.recommendedReorderDate.getTime()).toBeLessThan(
      fastLeadTime.recommendedReorderDate.getTime(),
    );
  });

  it("recommends 2 weeks of stock plus a 20% buffer, rounded up", () => {
    // velocity 3/day -> 3 * 14 * 1.2 = 50.4 -> rounds up to 51
    const result = computeStockOutProjection(10, 3, 1, NOW);
    expect(result.recommendedQty).toBe(51);
  });

  it("higher velocity recommends proportionally more stock", () => {
    const slow = computeStockOutProjection(10, 1, 1, NOW);
    const fast = computeStockOutProjection(10, 5, 1, NOW);
    expect(fast.recommendedQty).toBeGreaterThan(slow.recommendedQty);
  });
});
