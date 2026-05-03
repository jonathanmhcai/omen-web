"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PolymarketPosition, usePositions } from "../hooks/usePositions";

// Module-level store: persists across page navigations that unmount the
// RightSidebar tree (each page renders its own AppShell, so component state
// would otherwise reset on route change).
let expandedAssetState: string | null = null;
const expandedListeners = new Set<() => void>();
function setExpandedAsset(next: string | null) {
  expandedAssetState = next;
  expandedListeners.forEach((l) => l());
}
function subscribeExpanded(l: () => void) {
  expandedListeners.add(l);
  return () => {
    expandedListeners.delete(l);
  };
}
function useExpandedAsset() {
  return useSyncExternalStore(
    subscribeExpanded,
    () => expandedAssetState,
    () => null,
  );
}

export default function Positions() {
  const { data } = usePositions();
  const expandedAsset = useExpandedAsset();

  if (!data || data.positions.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <h2 className="px-4 pt-3 pb-1 text-sm font-semibold">Positions</h2>
      <div className="flex flex-col p-2">
        {data.positions.map((p) => (
          <PositionRow
            key={p.asset}
            position={p}
            expanded={expandedAsset === p.asset}
            onToggle={() =>
              setExpandedAsset(expandedAsset === p.asset ? null : p.asset)
            }
          />
        ))}
      </div>
    </div>
  );
}

function PositionRow({
  position,
  expanded,
  onToggle,
}: {
  position: PolymarketPosition;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pnlColorClass =
    position.cashPnl > 0
      ? "text-green-500"
      : position.cashPnl < 0
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-foreground/5"
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
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="mx-1 mt-1 mb-2 px-3 pt-1 pb-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <DetailCell
              label="ENTRY PRICE"
              value={`${Math.round(position.avgPrice * 100)}¢`}
            />
            <DetailCell
              label="CURRENT PRICE"
              value={`${Math.round(position.curPrice * 100)}¢`}
            />
            <DetailCell
              label="SHARES"
              value={position.size.toFixed(2)}
            />
            <DetailCell
              label="END DATE"
              value={
                position.endDate ? formatEndDate(position.endDate) : "—"
              }
            />
          </div>
          <Button asChild variant="secondary" className="mt-3 w-full">
            <Link href={`/event/${position.eventId}`}>View event</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function formatEndDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
