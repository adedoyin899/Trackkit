"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  WarningOctagon,
  WarningCircle,
  Info,
  CheckCircle,
  Truck,
} from "@phosphor-icons/react";
import { useLocalInventory } from "@/hooks/useLocalInventory";
import { getReorderRecommendations, type ReorderUrgency } from "@/lib/reorder-recommendation";
import { useReorderDismissedStore } from "@/lib/reorder-dismissed-store";

type UrgencyFilter = "all" | ReorderUrgency;

const URGENCY_STYLES: Record<ReorderUrgency, { label: string; icon: typeof WarningOctagon; className: string }> = {
  high: { label: "HIGH", icon: WarningOctagon, className: "bg-[var(--color-alert-red)]/15 text-[var(--color-alert-red)]" },
  medium: { label: "MEDIUM", icon: WarningCircle, className: "bg-[var(--color-honey)]/20 text-[var(--color-gold)]" },
  low: { label: "LOW", icon: Info, className: "bg-[var(--color-link-blue)]/15 text-[var(--color-link-blue)]" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

function formatNaira(val: number) {
  return `₦${val.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function ReorderRecommendations() {
  const dismissedUntil = useReorderDismissedStore((s) => s.dismissedUntil);
  const isDismissed = useReorderDismissedStore((s) => s.isDismissed);
  const markOrdered = useReorderDismissedStore((s) => s.markOrdered);
  const { products } = useLocalInventory();
  const [filter, setFilter] = useState<UrgencyFilter>("all");

  const recommendations = useMemo(
    () => getReorderRecommendations().filter((r) => !isDismissed(r.productId)),
    // products triggers a recompute when inventory/transactions change;
    // getReorderRecommendations reads SQLite directly rather than taking
    // products as an argument (same pattern as lib/analytics.ts).
    // dismissedUntil is the actual reactive data behind isDismissed() —
    // isDismissed itself is a stable function reference, so without this
    // the memo wouldn't recompute when a dismissal actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, isDismissed, dismissedUntil],
  );

  const filtered = filter === "all" ? recommendations : recommendations.filter((r) => r.urgency === filter);

  const counts = {
    high: recommendations.filter((r) => r.urgency === "high").length,
    medium: recommendations.filter((r) => r.urgency === "medium").length,
    low: recommendations.filter((r) => r.urgency === "low").length,
  };
  const estimatedTotalCost = recommendations.reduce((sum, r) => sum + (r.estimatedCost ?? 0), 0);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[15px] font-medium text-body-brown">
          <Bell weight="fill" className="text-ember-orange" /> Reorder Recommendations
        </h3>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["all", "high", "medium", "low"] as UrgencyFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
              filter === f
                ? "border-ink-black bg-ink-black text-white"
                : "border-stone-surface bg-white text-muted-gray hover:bg-cream-canvas"
            }`}
          >
            {f === "all" ? `All (${recommendations.length})` : `${f[0].toUpperCase()}${f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((rec) => {
          const style = URGENCY_STYLES[rec.urgency];
          const UrgencyIcon = style.icon;
          return (
            <div key={rec.productId} className="rounded-cards bg-white p-4 shadow-subtle-3 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`mb-1 inline-flex items-center gap-1 rounded-badges px-2 py-0.5 text-[11px] font-bold ${style.className}`}
                  >
                    <UrgencyIcon weight="fill" size={12} /> {style.label}
                  </span>
                  <p className="text-[15px] font-medium text-heading-charcoal">
                    {rec.productName.toUpperCase()}
                    <span className="ml-1.5 text-[12px] font-normal text-muted-gray">
                      {rec.currentQty} {rec.unit}(s) left
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-[13px] text-body-brown">{rec.message}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-gray">
                <span className="flex items-center gap-1">
                  <Truck size={13} /> Reorder by {formatDate(rec.recommendedReorderDate!)}
                </span>
                {rec.estimatedCost != null && (
                  <span>Est. cost: {formatNaira(rec.estimatedCost)}</span>
                )}
                <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
              </div>

              <button
                type="button"
                onClick={() => markOrdered(rec.productId)}
                className="flex items-center gap-1 rounded-buttons border border-stone-surface px-3 py-1.5 text-[12px] font-semibold text-body-brown hover:bg-cream-canvas"
              >
                <CheckCircle size={14} /> Mark as ordered
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-cards border border-stone-surface bg-cream-canvas p-3 text-[12px] text-body-brown">
        {counts.high > 0 && (
          <span className="font-semibold text-[var(--color-alert-red)]">
            {counts.high} urgent reorder{counts.high > 1 ? "s" : ""}
          </span>
        )}
        {counts.high > 0 && (estimatedTotalCost > 0) && " · "}
        {estimatedTotalCost > 0 && <>Est. total to restock: {formatNaira(estimatedTotalCost)}</>}
      </div>
    </div>
  );
}
