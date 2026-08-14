import { fetchProducts } from "./products";
import { fetchTransactions, fetchSupplierStats } from "./transactions";
import type { Product } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LEAD_TIME_DAYS = 1;
const REORDER_BUFFER_DAYS = 14;
const REORDER_BUFFER_MULTIPLIER = 1.2;

export type ReorderUrgency = "high" | "medium" | "low";

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  unit: string;
  currentQty: number;
  dailyVelocity: number;
  daysOfStock: number | null;
  runOutDate: string | null;
  urgency: ReorderUrgency;
  recommendedReorderDate: string | null;
  recommendedQty: number;
  suggestedSupplier: string | null;
  estimatedCost: number | null;
  confidence: number;
  message: string;
}

function averageDailySales(productId: string, sinceDays: number): number {
  const cutoff = Date.now() - sinceDays * DAY_MS;
  const sales = fetchTransactions(productId).filter(
    (t) => t.transaction_type === "sale" && new Date(t.created_at).getTime() >= cutoff,
  );
  const totalQty = sales.reduce((sum, t) => sum + t.quantity, 0);
  return totalQty / sinceDays;
}

/**
 * Real day-of-week multiplier from the product's own sales history, not a
 * hardcoded assumption (the prompt's example — "Friday 1.5x, Sunday
 * 0.5x" — is a plausible pattern for *some* traders, but presenting it as
 * fact for every product/user would just be a fabricated number dressed
 * up as data). Falls back to 1 (no adjustment) without at least 2 weeks
 * of history to compare against.
 */
function dayOfWeekMultiplier(productId: string, targetDate: Date): number {
  const cutoff = Date.now() - 28 * DAY_MS;
  const sales = fetchTransactions(productId).filter(
    (t) => t.transaction_type === "sale" && new Date(t.created_at).getTime() >= cutoff,
  );
  if (sales.length < 8) return 1;

  const byWeekday: number[] = [0, 0, 0, 0, 0, 0, 0];
  const countByWeekday: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const t of sales) {
    const day = new Date(t.created_at).getDay();
    byWeekday[day] += t.quantity;
    countByWeekday[day] += 1;
  }

  const overallAvg = sales.reduce((s, t) => s + t.quantity, 0) / sales.length;
  if (overallAvg === 0) return 1;

  const targetDay = targetDate.getDay();
  if (countByWeekday[targetDay] === 0) return 1;

  const targetDayAvg = byWeekday[targetDay] / countByWeekday[targetDay];
  return targetDayAvg / overallAvg;
}

export interface StockOutProjection {
  daysOfStock: number;
  runOutDate: Date;
  urgency: ReorderUrgency;
  recommendedReorderDate: Date;
  recommendedQty: number;
  worthFlagging: boolean;
}

/**
 * The pure forecast math — no SQLite/DB access, so it's directly unit
 * testable (unlike getReorderRecommendations() itself, which reads
 * transactions/products/supplier stats from local SQLite and is covered
 * by e2e/phase3-reorder.spec.ts instead). `now` is injectable so tests
 * don't depend on the real clock.
 */
export function computeStockOutProjection(
  currentQty: number,
  dailyVelocity: number,
  leadTimeDays: number,
  now: number = Date.now(),
): StockOutProjection {
  const daysOfStock = currentQty / dailyVelocity;
  const runOutDate = new Date(now + daysOfStock * DAY_MS);

  let urgency: ReorderUrgency;
  if (daysOfStock < 3) urgency = "high";
  else if (daysOfStock < 7) urgency = "medium";
  else urgency = "low";

  const recommendedReorderDate = new Date(runOutDate.getTime() - (leadTimeDays + 0.5) * DAY_MS);
  const recommendedQty = Math.ceil(dailyVelocity * REORDER_BUFFER_DAYS * REORDER_BUFFER_MULTIPLIER);

  return {
    daysOfStock,
    runOutDate,
    urgency,
    recommendedReorderDate,
    recommendedQty,
    // Skip products that aren't worth flagging at all — plenty of runway.
    worthFlagging: daysOfStock < 21,
  };
}

function getRecommendationForProduct(
  product: Product,
  options: { leadTimeDays: number },
): ReorderRecommendation | null {
  const baseVelocity = averageDailySales(product.id, 7);
  if (baseVelocity <= 0) return null; // no recent sales history to project from

  const weekdayFactor = dayOfWeekMultiplier(product.id, new Date());
  const dailyVelocity = Math.round(baseVelocity * weekdayFactor * 100) / 100;

  const { daysOfStock, runOutDate, urgency, recommendedReorderDate, recommendedQty, worthFlagging } =
    computeStockOutProjection(product.current_quantity, dailyVelocity, options.leadTimeDays);

  if (!worthFlagging) return null;

  const supplierStats = fetchSupplierStats(product.id);
  const bestSupplier = supplierStats.find((s) => s.isCheapest) ?? supplierStats[0] ?? null;
  const costPerUnit = bestSupplier?.avgPrice ?? product.cost_per_unit ?? null;
  const estimatedCost = costPerUnit != null ? Math.round(recommendedQty * costPerUnit) : null;

  // Confidence: needs enough transaction history to trust the projection,
  // same "min 2 weeks" reasoning as the day-of-week factor above.
  const historyDays = Math.min(
    28,
    Math.ceil((Date.now() - new Date(fetchTransactions(product.id).at(-1)?.created_at ?? Date.now()).getTime()) / DAY_MS),
  );
  const confidence = Math.min(0.9, 0.4 + (historyDays / 28) * 0.5);

  const reorderDayLabel = recommendedReorderDate.toLocaleDateString("en-NG", {
    weekday: "long",
  });
  const runOutDayLabel = runOutDate.toLocaleDateString("en-NG", { weekday: "long" });
  const supplierPart = bestSupplier ? ` from ${bestSupplier.name}` : "";
  const message =
    daysOfStock < 0
      ? `${product.name} is already out of stock. Reorder ${recommendedQty} ${product.unit}(s)${supplierPart} now.`
      : `Buy ${recommendedQty} ${product.unit}(s)${supplierPart} by ${reorderDayLabel} to avoid a ${runOutDayLabel} stock-out.`;

  return {
    productId: product.id,
    productName: product.name,
    unit: product.unit,
    currentQty: product.current_quantity,
    dailyVelocity,
    daysOfStock: Math.round(daysOfStock * 10) / 10,
    runOutDate: runOutDate.toISOString(),
    urgency,
    recommendedReorderDate: recommendedReorderDate.toISOString(),
    recommendedQty,
    suggestedSupplier: bestSupplier?.name ?? null,
    estimatedCost,
    confidence: Math.round(confidence * 100) / 100,
    message,
  };
}

const URGENCY_ORDER: Record<ReorderUrgency, number> = { high: 0, medium: 1, low: 2 };

/**
 * Computes reorder recommendations for every product with enough recent
 * sales history to project from. Entirely local — same reasoning as
 * lib/analytics.ts: there's no server-side transaction data to query
 * (Supabase's tables aren't populated), and this is cheap enough to
 * recompute on demand rather than needing the spec's 6-hourly cron job.
 */
export function getReorderRecommendations(
  options: { leadTimeDays?: number } = {},
): ReorderRecommendation[] {
  const leadTimeDays = options.leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS;
  const products = fetchProducts();

  const recommendations = products
    .map((p) => getRecommendationForProduct(p, { leadTimeDays }))
    .filter((r): r is ReorderRecommendation => r !== null);

  return recommendations.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
}
