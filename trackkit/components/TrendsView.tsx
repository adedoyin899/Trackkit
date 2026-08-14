"use client";

import { useMemo, useState } from "react";
import { ChartLineUp, TrendUp, TrendDown, Minus } from "@phosphor-icons/react";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { computeTrends, type TrendPeriod } from "@/lib/analytics";
import { SalesChart, type ChartMetric } from "@/components/SalesChart";

const PERIOD_OPTIONS: { id: TrendPeriod; label: string }[] = [
  { id: "week", label: "1 Week" },
  { id: "month", label: "1 Month" },
  { id: "quarter", label: "3 Months" },
];

const METRIC_OPTIONS: { id: ChartMetric; label: string }[] = [
  { id: "salesQuantity", label: "Quantity" },
  { id: "salesValue", label: "Revenue" },
  { id: "profit", label: "Profit" },
];

function formatNaira(val: number) {
  return `₦${val.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function TrendsView() {
  const { products } = useLocalInventory();
  const [productId, setProductId] = useState<string>("");
  const [period, setPeriod] = useState<TrendPeriod>("week");
  const [metric, setMetric] = useState<ChartMetric>("salesQuantity");

  // computeTrends() re-reads SQLite directly rather than taking `products`
  // as an argument, so it isn't referenced in the callback body — but the
  // memo still needs to recompute whenever the reactive products query
  // changes (e.g. right after logging a sale), so it stays as a dep.
  const result = useMemo(
    () => computeTrends({ productId: productId || undefined, period }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productId, period, products],
  );

  const { data, summary, forecast } = result;
  const selectedProduct = products.find((p) => p.id === productId);

  const TrendIcon = forecast.trend === "up" ? TrendUp : forecast.trend === "down" ? TrendDown : Minus;
  const trendColor =
    forecast.trend === "up"
      ? "text-[var(--color-grass-green)]"
      : forecast.trend === "down"
      ? "text-[var(--color-alert-red)]"
      : "text-muted-gray";

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center gap-2">
        <ChartLineUp weight="fill" size={22} className="text-[var(--color-link-blue)]" />
        <h1 className="text-[24px] font-bold text-heading-charcoal">Sales Trends</h1>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-subtle-3 space-y-3">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-muted-gray">Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-lg border border-stone-surface bg-cream-canvas px-3 py-2 text-[14px] outline-none focus:border-[var(--color-link-blue)]"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.toUpperCase()} ({p.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`flex-1 rounded-buttons py-2 text-[13px] font-semibold transition-colors ${
                period === opt.id
                  ? "bg-ink-black text-white"
                  : "bg-cream-canvas text-body-brown hover:bg-stone-surface"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMetric(opt.id)}
              className={`flex-1 rounded-full border py-1.5 text-[12px] font-medium transition-colors ${
                metric === opt.id
                  ? "border-ink-black bg-ink-black text-white"
                  : "border-stone-surface bg-white text-muted-gray hover:bg-cream-canvas"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-subtle-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-heading-charcoal">
            {selectedProduct ? selectedProduct.name.toUpperCase() : "All Products"}
          </h3>
          <span className={`flex items-center gap-1 text-[12px] font-semibold ${trendColor}`}>
            <TrendIcon weight="bold" size={14} />
            {forecast.trend === "up" ? "Trending up" : forecast.trend === "down" ? "Trending down" : "Stable"}
          </span>
        </div>
        {data.every((d) => d.salesQuantity === 0) ? (
          <div className="py-10 text-center text-[13px] text-muted-gray">
            No sales recorded in this period yet.
          </div>
        ) : (
          <SalesChart data={data} metric={metric} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-3 shadow-subtle-3">
          <div className="text-[11px] text-muted-gray">Total Sold</div>
          <div className="text-[18px] font-bold text-ink-black">{summary.totalQty}</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-subtle-3">
          <div className="text-[11px] text-muted-gray">Avg/Day</div>
          <div className="text-[18px] font-bold text-ink-black">{summary.avgPerDay}</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-subtle-3">
          <div className="text-[11px] text-muted-gray">Revenue</div>
          <div className="text-[15px] font-bold text-ink-black">{formatNaira(summary.totalValue)}</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-subtle-3">
          <div className="text-[11px] text-muted-gray">Profit</div>
          <div className="text-[15px] font-bold text-[var(--color-grass-green)]">{formatNaira(summary.totalProfit)}</div>
        </div>
      </div>

      {summary.totalQty > 0 && (
        <div className="rounded-xl border border-stone-surface bg-cream-canvas p-4 text-[13px] text-body-brown">
          <span className="font-semibold text-heading-charcoal">Forecast: </span>
          At this pace, expect ~{forecast.nextPeriodEstimate} units next {period === "week" ? "week" : period === "month" ? "month" : "quarter"}
          {" "}(confidence: {Math.round(forecast.confidence * 100)}%).
          {summary.bestDay && summary.bestDay.quantity > 0 && (
            <> Best day: {new Date(summary.bestDay.date).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "short" })} ({summary.bestDay.quantity} sold).</>
          )}
        </div>
      )}
    </div>
  );
}
