"use client";

import { cn } from "@/lib/utils";
import { PolymarketPosition, usePositions } from "../hooks/usePositions";

export default function Positions() {
  const { data } = usePositions();

  if (!data || data.positions.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <h2 className="px-4 pt-3 pb-1 text-sm font-semibold">Positions</h2>
      <div className="flex flex-col p-2">
        {data.positions.map((p) => (
          <PositionRow key={p.asset} position={p} />
        ))}
      </div>
    </div>
  );
}

function PositionRow({ position }: { position: PolymarketPosition }) {
  const pnlColorClass =
    position.cashPnl > 0
      ? "text-green-500"
      : position.cashPnl < 0
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <a
      href={`https://polymarket.com/event/${position.eventSlug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-foreground/5"
    >
      {position.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={position.icon}
          alt=""
          className="h-10 w-10 shrink-0 rounded-md object-cover"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">
          {position.outcome}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {position.title}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold">
          {displayDollars(position.currentValue)}
        </span>
        <span className={cn("text-xs", pnlColorClass)}>
          {displayDollars(position.cashPnl, true)} (
          {formatPercentSigned(position.percentPnl)})
        </span>
      </div>
    </a>
  );
}

function displayDollars(num: number, showPlusSign = false): string {
  const sign = num < 0 ? "-" : num > 0 && showPlusSign ? "+" : "";
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function formatPercentSigned(num: number): string {
  if (isNaN(num)) return "0%";
  if (num > 0 && num < 1) return "+<1%";
  if (num > -1 && num < 0) return "-<1%";
  return `${num >= 0 ? "+" : ""}${num.toFixed()}%`;
}
