"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Meh } from "lucide-react";
import type { IDockviewPanelProps } from "dockview";
import { useMapPageContext } from "./MapPageContext";
import { PolymarketEvent, PolymarketMarket } from "../lib/types";

function isMarketActionable(market: PolymarketMarket): boolean {
  if (market.closed) return false;
  if (!market.active) return false;
  if (market.archived) return false;
  return true;
}

function formatLocationName(slug: string): string {
  if (slug === "us-washington-dc") return "United States";
  const name = slug.startsWith("us-") ? slug.slice(3) : slug;
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
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

function MarketList({
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

const EVENTS_PAGE_SIZE = 10;

interface EventsPanelParams {
  location: string;
}

export default function EventsPanel({
  api,
  params,
}: IDockviewPanelProps<EventsPanelParams>) {
  const ctx = useMapPageContext();
  const location = params.location;
  const events = ctx.eventsByLocation.get(location) ?? [];
  const sorted = [...events].sort(
    (a, b) => (b.volume24hr || 0) - (a.volume24hr || 0)
  );
  const [visibleCount, setVisibleCount] = useState(EVENTS_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Set panel title to location name
  useEffect(() => {
    api.setTitle(formatLocationName(location));
  }, [api, location]);

  // Reset when location changes
  useEffect(() => {
    setVisibleCount(EVENTS_PAGE_SIZE);
  }, [location]);

  const loadMore = useCallback(() => {
    setVisibleCount((v) => Math.min(v + EVENTS_PAGE_SIZE, sorted.length));
  }, [sorted.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const visible = sorted.slice(0, visibleCount);

  return (
    <div className="flex h-full flex-col bg-background pb-7">
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Meh size={32} strokeWidth={1.5} />
            <p className="text-sm">Nothing happening</p>
          </div>
        )}
        {visible.map((e) => (
          <div key={e.id} className="border-b border-border px-4 py-3">
            <div className="flex items-start gap-3">
              {e.image && (
                <img
                  src={e.image}
                  alt=""
                  className="mt-0.5 h-8 w-8 shrink-0 rounded object-cover"
                />
              )}
              <p className="text-sm font-medium text-foreground">{e.title}</p>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>${Math.round(e.volume || 0).toLocaleString()} vol</span>
              <span>
                ${Math.round(e.volume24hr || 0).toLocaleString()} 24h
              </span>
              {e.endDate && (
                <span>Ends {new Date(e.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              )}
            </div>
            {e.markets && e.markets.length > 0 && (
              <MarketList markets={e.markets} onMarket={ctx.onMarket} />
            )}
          </div>
        ))}
        {visibleCount < sorted.length && (
          <div
            ref={sentinelRef}
            className="px-4 py-3 text-center text-xs text-muted-foreground"
          >
            Loading more...
          </div>
        )}
      </div>
      {events.length > 0 && (
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          {events.length} events
        </div>
      )}
    </div>
  );
}
