"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminVolumeGrain } from "../../../lib/types";

export interface SeriesPoint {
  /** Naive local-wall-clock bucket start (server bucketed in the browser tz). */
  bucket: string;
  value: number;
}

interface BarSeriesChartProps {
  title: string;
  grain: AdminVolumeGrain;
  /** Null until loaded; loading/empty/error are surfaced as placeholders. */
  data: SeriesPoint[] | null;
  loading?: boolean;
  error?: string | null;
  emptyLabel?: string;
  formatValue: (v: number) => string;
  /** Appended after the value in the tooltip, e.g. " shares". */
  valueSuffix?: string;
  /** Bar fill for non-negative values. */
  fill?: string;
  /** Bar fill for negative values (enables per-bar coloring + a zero line). */
  negativeFill?: string;
  /** Optional control(s) rendered at the right of the header. */
  headerRight?: React.ReactNode;
}

// Buckets arrive as naive local-wall-clock stamps. `new Date(stamp)` parses
// them as local time, so format in local time (no timeZone option) and the
// labels match the viewer's clock.
function tickFormatter(grain: AdminVolumeGrain): (iso: string) => string {
  if (grain === "hour") {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric" });
    return (iso) => fmt.format(new Date(iso));
  }
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  return (iso) => fmt.format(new Date(iso));
}

function tooltipLabel(grain: AdminVolumeGrain, iso: string): string {
  const date = new Date(iso);
  if (grain === "hour") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    }).format(date);
  }
  const day = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return grain === "week" ? `Week of ${day}` : day;
}

export default function BarSeriesChart({
  title,
  grain,
  data,
  loading,
  error,
  emptyLabel = "No data in this window",
  formatValue,
  valueSuffix = "",
  fill = "#2563eb",
  negativeFill,
  headerRight,
}: BarSeriesChartProps) {
  const formatTick = useMemo(() => tickFormatter(grain), [grain]);
  const hasNegative =
    negativeFill != null && (data?.some((d) => d.value < 0) ?? false);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/[.08] p-6 dark:border-white/[.145]">
      <div className="flex min-h-6 items-center justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </p>
        {headerRight}
      </div>
      {error ? (
        <div className="flex h-64 items-center justify-center text-sm text-red-500">
          Failed to load: {error}
        </div>
      ) : loading || data == null ? (
        <div className="h-64 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
          {emptyLabel}
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-black/[.06] dark:text-white/[.08]"
              />
              <XAxis
                dataKey="bucket"
                tickFormatter={formatTick}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-zinc-500 dark:text-zinc-400"
              />
              <YAxis
                tickFormatter={(v: number) => formatValue(v)}
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-zinc-500 dark:text-zinc-400"
              />
              {hasNegative && (
                <ReferenceLine
                  y={0}
                  stroke="currentColor"
                  className="text-black/[.2] dark:text-white/[.25]"
                />
              )}
              <Tooltip
                cursor={{
                  fill: "currentColor",
                  className: "text-black/[.04] dark:text-white/[.06]",
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as SeriesPoint;
                  return (
                    <div className="rounded-lg border border-black/[.08] bg-background px-3 py-2 text-xs shadow-sm dark:border-white/[.145]">
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {tooltipLabel(grain, point.bucket)}
                      </p>
                      <p className="font-semibold tabular-nums">
                        {formatValue(point.value)}
                        {valueSuffix}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" fill={fill} radius={[2, 2, 0, 0]} maxBarSize={48}>
                {negativeFill != null &&
                  data.map((d, i) => (
                    <Cell key={i} fill={d.value < 0 ? negativeFill : fill} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
