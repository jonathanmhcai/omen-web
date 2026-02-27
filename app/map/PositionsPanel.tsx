"use client";

import type { IDockviewPanelProps } from "dockview";
import { usePositions, PolymarketPosition } from "../hooks/usePositions";

function formatDollars(n: number): string {
  return "$" + n.toFixed(2);
}

function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(1) + "%";
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function PositionRow({ position }: { position: PolymarketPosition }) {
  const pnlColor =
    position.cashPnl > 0
      ? "text-emerald-600"
      : position.cashPnl < 0
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      {position.icon && (
        <img
          src={position.icon}
          alt=""
          className="mt-0.5 h-6 w-6 shrink-0 rounded"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {position.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
              position.outcome.toLowerCase() === "yes"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {position.outcome}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatDollars(position.initialValue)} cost
          </span>
          {position.endDate && (
            <span className="text-[11px] text-muted-foreground">
              {formatDate(position.endDate)}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-medium text-foreground">
          {formatDollars(position.currentValue)}
        </p>
        <p className={`text-[11px] font-medium ${pnlColor}`}>
          {formatPercent(position.percentPnl)}
        </p>
      </div>
    </div>
  );
}

export default function PositionsPanel({}: IDockviewPanelProps) {
  const { data, loading, error } = usePositions();
  const positions = data?.positions ?? [];

  return (
    <div className="flex h-full flex-col bg-background pb-7">
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          </div>
        )}

        {!loading && error && (
          <p className="px-3 py-6 text-center text-xs text-red-500">{error}</p>
        )}

        {!loading && !error && positions.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No open positions
          </p>
        )}

        {!loading &&
          !error &&
          positions.map((p) => (
            <PositionRow key={p.asset} position={p} />
          ))}
      </div>
    </div>
  );
}
