"use client";

import { useState } from "react";
import { PolymarketMarket } from "../lib/types";

function parseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function isMarketActionable(market: PolymarketMarket): boolean {
  if (market.closed) return false;
  if (!market.active) return false;
  if (market.archived) return false;
  return true;
}

function getYesPrice(market: PolymarketMarket): number {
  const outcomes: string[] = parseJSON(market.outcomes, []);
  const prices: string[] = parseJSON(market.outcomePrices, []);
  const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  return yesIndex !== -1 ? parseFloat(prices[yesIndex] || "0") : 0;
}

function sortMarketsByYesPrice(
  markets: PolymarketMarket[]
): PolymarketMarket[] {
  return [...markets].sort((a, b) => getYesPrice(b) - getYesPrice(a));
}

function MarketRow({
  market,
  onMarket,
}: {
  market: PolymarketMarket;
  onMarket: (conditionId: string, opts?: { outcomeIndex?: number; title?: string }) => void;
}) {
  const outcomes: string[] = parseJSON(market.outcomes, []);
  const prices: string[] = parseJSON(market.outcomePrices, []);
  const title = market.groupItemTitle || market.question;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <p className="text-xs text-foreground flex-1 min-w-0">{title}</p>
      <div className="flex shrink-0 gap-1.5">
        {outcomes.map((outcome, i) => {
          const price = parseFloat(prices[i] || "0");
          const pct = Math.round(price * 100);
          const isYes = outcome.toLowerCase() === "yes";
          return (
            <button
              key={i}
              onClick={() => onMarket(market.conditionId, { outcomeIndex: i, title })}
              className={`rounded px-2 py-1 text-xs font-medium ${
                isYes
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                  : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
              }`}
            >
              {outcome} {pct}¢
            </button>
          );
        })}
      </div>
    </div>
  );
}

const INITIAL_MARKET_COUNT = 4;

export default function MarketList({
  markets,
  onMarket,
}: {
  markets: PolymarketMarket[];
  onMarket: (conditionId: string, opts?: { outcomeIndex?: number; title?: string }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = sortMarketsByYesPrice(markets.filter(isMarketActionable));
  const visible = expanded ? sorted : sorted.slice(0, INITIAL_MARKET_COUNT);
  const hiddenCount = sorted.length - INITIAL_MARKET_COUNT;

  return (
    <div className="mt-2 flex flex-col gap-0.5">
      {visible.map((m) => (
        <MarketRow key={m.id} market={m} onMarket={onMarket} />
      ))}
      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs text-muted-foreground hover:text-foreground text-left"
        >
          Show {hiddenCount} more
        </button>
      )}
      {expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-1 text-xs text-muted-foreground hover:text-foreground text-left"
        >
          Show less
        </button>
      )}
    </div>
  );
}
