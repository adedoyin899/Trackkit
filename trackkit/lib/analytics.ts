import { fetchProducts } from "./products";
import { fetchTransactions } from "./transactions";
import { calculateMargin } from "@/hooks/useMarginCalculation";

const DAY_MS = 24 * 60 * 60 * 1000;

export type TrendPeriod = "week" | "month" | "quarter";

const PERIOD_DAYS: Record<TrendPeriod, number> = {
  week: 7,
  month: 30,
  quarter: 90,
};

// Daily buckets stay readable up to a month of points; beyond that (the
// quarter view) bucket by week instead, or a 90-point line chart on a
// phone screen is unreadable noise.
function bucketSizeDays(period: TrendPeriod): number {
  return period === "quarter" ? 7 : 1;
}

export interface TrendDataPoint {
  date: string; // bucket start date, ISO (YYYY-MM-DD)
  salesQuantity: number;
  salesValue: number;
  profit: number;
  pricePerUnit: number | null;
}

export interface TrendSummary {
  totalQty: number;
  totalValue: number;
  totalProfit: number;
  avgPerDay: number;
  bestDay: { date: string; quantity: number } | null;
  worstDay: { date: string; quantity: number } | null;
}

export interface TrendForecast {
  nextPeriodEstimate: number;
  confidence: number;
  trend: "up" | "down" | "stable";
}

export interface TrendResult {
  data: TrendDataPoint[];
  summary: TrendSummary;
  forecast: TrendForecast;
}

function toDateKey(iso: string, bucketDays: number, rangeStart: number): string {
  const t = new Date(iso).getTime();
  const bucketIndex = Math.floor((t - rangeStart) / (bucketDays * DAY_MS));
  const bucketStart = new Date(rangeStart + bucketIndex * bucketDays * DAY_MS);
  return bucketStart.toISOString().slice(0, 10);
}

/** Simple linear regression (least squares) over (index, value) pairs. */
export function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? (ssRes === 0 ? 1 : 0) : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

/**
 * Computes sales trends + a lightweight forecast entirely from local
 * SQLite data. PHASE-3-AI.md's Story 2 describes a server-side
 * materialized view (analytics_daily) refreshed by a nightly cron job —
 * that assumes transaction data lives in Supabase, which it doesn't (no
 * sync engine pushes to it yet, same situation as the AI chat context —
 * see hand off/bug.md). A market trader's transaction volume (hundreds to
 * low-thousands of rows) is trivially fast to aggregate on demand in the
 * browser, so there's nothing to pre-compute or cache here.
 */
export function computeTrends(options: {
  productId?: string;
  period: TrendPeriod;
}): TrendResult {
  const { productId, period } = options;
  const days = PERIOD_DAYS[period];
  const bucketDays = bucketSizeDays(period);

  const now = Date.now();
  const rangeStart = now - days * DAY_MS;

  const products = fetchProducts();
  const productsById = new Map(products.map((p) => [p.id, p]));
  const allTransactions = fetchTransactions(productId);
  const sales = allTransactions.filter(
    (t) => t.transaction_type === "sale" && new Date(t.created_at).getTime() >= rangeStart,
  );

  const product = productId ? productsById.get(productId) ?? null : null;

  // Sale transactions don't carry a price (only restocks record
  // cost_per_unit), so revenue/profit use each sale's own product's
  // *current* selling_price_per_unit/margin rather than a historical
  // per-sale price — consistent with how ProfitabilityDashboard already
  // computes margins. Looked up per-transaction (not a single shared
  // price) so the "All Products" aggregate view reflects each product's
  // own price rather than collapsing to one.
  const buckets = new Map<string, { qty: number; value: number; profit: number }>();
  for (const t of sales) {
    const key = toDateKey(t.created_at, bucketDays, rangeStart);
    const p = productsById.get(t.product_id);
    const sellingPrice = p?.selling_price_per_unit ?? 0;
    const { marginAmount } = calculateMargin(p?.cost_per_unit, p?.selling_price_per_unit);
    const existing = buckets.get(key) ?? { qty: 0, value: 0, profit: 0 };
    existing.qty += t.quantity;
    existing.value += t.quantity * sellingPrice;
    existing.profit += t.quantity * (marginAmount ?? 0);
    buckets.set(key, existing);
  }

  // Build a complete, gap-filled series (zero-sales buckets included) so
  // the chart doesn't silently skip quiet days.
  const bucketCount = Math.ceil(days / bucketDays);
  const data: TrendDataPoint[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = new Date(rangeStart + i * bucketDays * DAY_MS);
    const key = bucketStart.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    data.push({
      date: key,
      salesQuantity: bucket?.qty ?? 0,
      salesValue: bucket?.value ?? 0,
      profit: bucket?.profit ?? 0,
      pricePerUnit: product?.selling_price_per_unit ?? null,
    });
  }

  const totalQty = data.reduce((s, d) => s + d.salesQuantity, 0);
  const totalValue = data.reduce((s, d) => s + d.salesValue, 0);
  const totalProfit = data.reduce((s, d) => s + d.profit, 0);
  const avgPerDay = days > 0 ? totalQty / days : 0;

  const best = data.reduce<TrendDataPoint | null>(
    (max, d) => (!max || d.salesQuantity > max.salesQuantity ? d : max),
    null,
  );
  const worst = data.reduce<TrendDataPoint | null>(
    (min, d) => (!min || d.salesQuantity < min.salesQuantity ? d : min),
    null,
  );

  const quantities = data.map((d) => d.salesQuantity);
  const { slope, r2 } = linearRegression(quantities);
  const meanQty = quantities.length ? quantities.reduce((s, v) => s + v, 0) / quantities.length : 0;

  const nextPeriodEstimate = Math.max(0, Math.round((meanQty + slope * bucketCount) * bucketCount));
  // Confidence needs both a real trend fit (r2) and enough history to
  // trust it — a perfect fit over 2 data points isn't meaningful.
  const confidence = quantities.length >= 4 ? Math.round(r2 * 100) / 100 : Math.min(0.5, r2);

  let trend: TrendForecast["trend"] = "stable";
  if (meanQty > 0) {
    const relativeSlope = slope / Math.max(meanQty, 1);
    if (relativeSlope > 0.05) trend = "up";
    else if (relativeSlope < -0.05) trend = "down";
  }

  return {
    data,
    summary: {
      totalQty,
      totalValue,
      totalProfit,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      bestDay: best ? { date: best.date, quantity: best.salesQuantity } : null,
      worstDay: worst ? { date: worst.date, quantity: worst.salesQuantity } : null,
    },
    forecast: {
      nextPeriodEstimate,
      confidence,
      trend,
    },
  };
}
