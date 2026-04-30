"use client";

import { useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import MetricTile from "../../components/admin/dashboard/MetricTile";
import DepositsTable from "../../components/admin/dashboard/DepositsTable";
import { useAdminStats } from "../../hooks/admin/useAdminStats";
import { useAdminDeposits } from "../../hooks/admin/useAdminDeposits";
import { AdminStatsWindow } from "../../lib/types";
import { formatNumber } from "../../lib/utils";

const WINDOWS: { value: AdminStatsWindow; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "all", label: "All" },
];

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

function formatSignedUsd(value: string): string {
  const n = Number(value);
  const formatted = formatNumber(Math.abs(n));
  return n < 0 ? `-${formatted}` : formatted;
}

// Percent change current vs prior. Uses |prior| so negative net inflows
// (outflows) compare directionally — e.g. -$1k → +$500 reads as improvement.
// Returns null when there's no prior to compare against (window=all, or
// prior was 0 so % is undefined).
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

export default function DashboardPage() {
  const [window, setWindow] = useState<AdminStatsWindow>("7d");
  const { stats, loading, error } = useAdminStats(window);

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
          label="Net inflow"
          value={stats ? formatSignedUsd(stats.netInflowUsd) : ""}
          sublabel="Settled deposits − withdrawals"
          deltaPercent={
            stats
              ? deltaPercentString(stats.netInflowUsd, stats.netInflowUsdPrior)
              : null
          }
          loading={loading}
        />
        <MetricTile
          label="Trade volume"
          value={stats ? formatNumber(Number(stats.tradeVolumeUsd)) : ""}
          sublabel="USDC traded"
          deltaPercent={
            stats
              ? deltaPercentString(
                  stats.tradeVolumeUsd,
                  stats.tradeVolumeUsdPrior,
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
