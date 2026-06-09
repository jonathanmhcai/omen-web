"use client";

import { useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import MetricTile from "../../components/admin/dashboard/MetricTile";
import VolumeHistogram, {
  type VolumeMetric,
} from "../../components/admin/dashboard/VolumeHistogram";
import DepositsHistogram from "../../components/admin/dashboard/DepositsHistogram";
import DepositsTable from "../../components/admin/dashboard/DepositsTable";
import { useAdminStats } from "../../hooks/admin/useAdminStats";
import { useAdminVolumeSeries } from "../../hooks/admin/useAdminVolumeSeries";
import { useAdminDepositsSeries } from "../../hooks/admin/useAdminDepositsSeries";
import { useAdminDeposits } from "../../hooks/admin/useAdminDeposits";
import { AdminStatsWindow } from "../../lib/types";
import { formatNumber, formatShares } from "../../lib/utils";

const WINDOWS: { value: AdminStatsWindow; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "all", label: "All" },
];

const METRICS: { value: VolumeMetric; label: string }[] = [
  { value: "notional", label: "Notional" },
  { value: "shares", label: "Shares" },
];

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

// Percent change current vs prior. Uses |prior| so signed values compare
// directionally. Returns null when there's no prior to compare against
// (window=all, or prior was 0 so % is undefined).
function deltaPercent(current: number, prior: number | null): number | null {
  if (prior == null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

function deltaPercentString(
  current: string,
  prior: string | null,
): number | null {
  return deltaPercent(Number(current), prior == null ? null : Number(prior));
}

export default function DashboardClient() {
  const [window, setWindow] = useState<AdminStatsWindow>("7d");
  const [metric, setMetric] = useState<VolumeMetric>("notional");
  const { stats, loading, error } = useAdminStats(window);
  const {
    series: volumeSeries,
    loading: volumeLoading,
    error: volumeError,
  } = useAdminVolumeSeries(window);
  const {
    series: depositsSeries,
    loading: depositsSeriesLoading,
    error: depositsSeriesError,
  } = useAdminDepositsSeries(window);

  const [depositSorting, setDepositSorting] = useState<SortingState>([
    { id: "settled_at", desc: true },
  ]);
  const {
    deposits,
    loading: depositsLoading,
    error: depositsError,
    page: depositsPage,
    hasMore: depositsHasMore,
    total: depositsTotal,
    nextPage: depositsNextPage,
    prevPage: depositsPrevPage,
    firstPage: depositsFirstPage,
  } = useAdminDeposits({ sorting: depositSorting, limit: 15 });

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-500">
        Failed to load stats: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-black/[.08] p-1 dark:border-white/[.145] w-fit">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              onClick={() => setWindow(w.value)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                window === w.value
                  ? "bg-zinc-100 text-foreground dark:bg-zinc-800"
                  : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border border-black/[.08] p-1 dark:border-white/[.145] w-fit">
          {METRICS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMetric(m.value)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                metric === m.value
                  ? "bg-zinc-100 text-foreground dark:bg-zinc-800"
                  : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricTile
          label="Total custodied"
          value={stats ? formatNumber(Number(stats.totalCustodiedUsd)) : ""}
          sublabel="USDC + open positions"
          deltaPercent={
            stats
              ? deltaPercentString(
                  stats.totalCustodiedUsd,
                  stats.totalCustodiedUsdPrior,
                )
              : null
          }
          loading={loading}
        />
        <MetricTile
          label="Deposits"
          value={stats ? formatNumber(Number(stats.depositsUsd)) : ""}
          sublabel="Settled fiat deposits"
          deltaPercent={
            stats
              ? deltaPercentString(stats.depositsUsd, stats.depositsUsdPrior)
              : null
          }
          loading={loading}
        />
        <MetricTile
          label="Trade volume"
          value={
            stats
              ? metric === "notional"
                ? formatNumber(Number(stats.tradeVolumeUsd))
                : formatShares(Number(stats.tradeVolumeShares))
              : ""
          }
          sublabel={metric === "notional" ? "USDC traded" : "Shares traded"}
          deltaPercent={
            stats
              ? metric === "notional"
                ? deltaPercentString(
                    stats.tradeVolumeUsd,
                    stats.tradeVolumeUsdPrior,
                  )
                : deltaPercentString(
                    stats.tradeVolumeShares,
                    stats.tradeVolumeSharesPrior,
                  )
              : null
          }
          loading={loading}
        />
        <MetricTile
          label="Active traders"
          value={stats ? formatCount(stats.activeTraders) : ""}
          sublabel="Unique users who traded"
          deltaPercent={
            stats
              ? deltaPercent(stats.activeTraders, stats.activeTradersPrior)
              : null
          }
          loading={loading}
        />
        <MetricTile
          label="New traders"
          value={stats ? formatCount(stats.newFirstTimeTraders) : ""}
          sublabel="First-ever trade in window"
          deltaPercent={
            stats
              ? deltaPercent(
                  stats.newFirstTimeTraders,
                  stats.newFirstTimeTradersPrior,
                )
              : null
          }
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DepositsHistogram
          series={depositsSeries}
          loading={depositsSeriesLoading}
          error={depositsSeriesError}
        />
        <VolumeHistogram
          series={volumeSeries}
          metric={metric}
          loading={volumeLoading}
          error={volumeError}
        />
      </div>

      <div className="pt-4">
        <DepositsTable
          deposits={deposits}
          loading={depositsLoading}
          error={depositsError}
          page={depositsPage}
          hasMore={depositsHasMore}
          total={depositsTotal}
          onNextPage={depositsNextPage}
          onPrevPage={depositsPrevPage}
          onFirstPage={depositsFirstPage}
          sorting={depositSorting}
          onSortingChange={setDepositSorting}
        />
      </div>
    </div>
  );
}
