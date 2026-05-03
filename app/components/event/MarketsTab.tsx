"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PolymarketEvent } from "../../lib/types";
import {
  getMarketDisplayLabel,
  getMarketsSortedByYesProbability,
  isMarketActionable,
  MarketWithYes,
} from "../../lib/market";
import { formatShortDollars } from "../../lib/format";

const COLLAPSED_COUNT = 4;

export function MarketsTab({ event }: { event: PolymarketEvent }) {
  const [expanded, setExpanded] = useState(false);

  const sortedMarkets = useMemo(() => {
    if (!event.markets?.length) return [];
    const actionable = event.markets.filter(isMarketActionable);
    return getMarketsSortedByYesProbability(actionable);
  }, [event.markets]);

  const showImages = useMemo(() => {
    const uris = new Set(
      sortedMarkets.map(({ market }) => market.image || market.icon || "")
    );
    return uris.size > 1;
  }, [sortedMarkets]);

  const visible =
    expanded || sortedMarkets.length <= COLLAPSED_COUNT
      ? sortedMarkets
      : sortedMarkets.slice(0, COLLAPSED_COUNT);
  const hasMore = sortedMarkets.length > COLLAPSED_COUNT;

  if (sortedMarkets.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No markets available
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        {visible.map((m) => (
          <MarketRow key={m.market.id} m={m} showImage={showImages} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex w-full items-center justify-center gap-1 py-3 text-sm font-medium text-primary hover:opacity-80"
        >
          {expanded ? "Show less" : "Show more"}
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

function MarketRow({ m, showImage }: { m: MarketWithYes; showImage: boolean }) {
  const { market, outcomes, prices } = m;
  const imageUri = market.image || market.icon;

  return (
    <div className="flex items-center gap-3">
      {showImage && (
        <div className="shrink-0">
          {imageUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUri}
              alt=""
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-muted" />
          )}
        </div>
      )}
      <div className="flex flex-1 min-w-0 flex-col">
        <p className="truncate text-base font-medium">
          {getMarketDisplayLabel(market)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatShortDollars(market.volume)} vol.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {outcomes.map((label, i) => {
          const pct = Math.round((prices[i] ?? 0) * 100);
          return (
            <span
              key={`${label}-${i}`}
              className={`flex h-10 min-w-[88px] items-center justify-center gap-1.5 rounded-lg px-3 ${outcomeBgClass(
                label
              )}`}
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-[15px] font-bold tabular-nums">{pct}%</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function outcomeBgClass(outcome: string): string {
  const o = outcome.trim().toLowerCase();
  if (o === "yes") return "bg-green-500/10 text-green-600 dark:text-green-400";
  if (o === "no") return "bg-red-500/10 text-red-600 dark:text-red-400";
  return "bg-muted text-foreground";
}
