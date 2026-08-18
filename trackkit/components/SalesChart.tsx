"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TrendDataPoint } from "@/lib/analytics";

export type ChartMetric = "salesQuantity" | "salesValue" | "profit";

const METRIC_CONFIG: Record<ChartMetric, { label: string; color: string; prefix: string }> = {
  salesQuantity: { label: "Quantity Sold", color: "var(--color-link-blue)", prefix: "" },
  salesValue: { label: "Revenue", color: "var(--color-grass-green)", prefix: "₦" },
  profit: { label: "Profit", color: "var(--color-ember-orange)", prefix: "₦" },
};

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

interface ChartTooltipPayload {
  payload: TrendDataPoint;
}

function ChartTooltip({ active, payload, metric }: { active?: boolean; payload?: ChartTooltipPayload[]; metric: ChartMetric }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const config = METRIC_CONFIG[metric];
  const value = point[metric];

  return (
    <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-card)] px-3 py-2 shadow-subtle-3 text-[12px]">
      <div className="font-semibold text-heading-charcoal">{formatDateLabel(point.date)}</div>
      <div className="text-muted-gray">
        {config.label}: <span className="font-medium text-heading-charcoal">{config.prefix}{value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}</span>
      </div>
    </div>
  );
}

interface SalesChartProps {
  data: TrendDataPoint[];
  metric: ChartMetric;
}

export function SalesChart({ data, metric }: SalesChartProps) {
  const config = METRIC_CONFIG[metric];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--border-hairline)" }}
          tickLine={false}
          minTickGap={20}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<ChartTooltip metric={metric} />} />
        <Line
          type="monotone"
          dataKey={metric}
          stroke={config.color}
          strokeWidth={2}
          dot={data.length <= 31}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
