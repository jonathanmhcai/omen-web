"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Flame, MapPin } from "lucide-react";
import type { IDockviewPanelProps } from "dockview";
import { useMapPageContext } from "./MapPageContext";
import { slugToDisplayName } from "./geo";
import { PolymarketEvent } from "../lib/types";

const PAGE_SIZE = 10;

function getLeadingProbability(event: PolymarketEvent): number | null {
  if (!event.markets || event.markets.length === 0) return null;
  let best = 0;
  for (const market of event.markets) {
    if (market.closed || !market.active) continue;
    let prices: string[];
    try { prices = JSON.parse(market.outcomePrices); } catch { continue; }
    for (const p of prices) {
      const v = parseFloat(p);
      if (v > best) best = v;
    }
  }
  return best > 0 ? best : null;
}

interface RankedEvent {
  event: PolymarketEvent;
  locationSlug: string;
}

export default function HotMarketsPanel({
  api,
}: IDockviewPanelProps<{}>) {
  const ctx = useMapPageContext();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.setTitle("Trending Events");
  }, [api]);

  const ranked = useMemo<RankedEvent[]>(() => {
    const items: RankedEvent[] = [];
    for (const [locationSlug, events] of ctx.eventsByLocation) {
      for (const event of events) {
        items.push({ event, locationSlug });
      }
    }
    items.sort((a, b) => (b.event.volume24hr || 0) - (a.event.volume24hr || 0));
    return items;
  }, [ctx.eventsByLocation]);

  const loadMore = useCallback(() => {
    setVisibleCount((v) => Math.min(v + PAGE_SIZE, ranked.length));
  }, [ranked.length]);

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

  const visible = ranked.slice(0, visibleCount);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        {ranked.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Fetching events...</p>
          </div>
        )}

        {visible.map((item, i) => {
          const prob = getLeadingProbability(item.event);
          return (
            <button
              key={item.event.id}
              onClick={() => {
                ctx.flyToLocationRef.current?.(item.locationSlug);
                window.dispatchEvent(new CustomEvent("open-event-popup", { detail: { event: item.event, slug: item.locationSlug } }));
              }}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-2 text-left hover:bg-accent/50 transition-colors"
            >
              <span className="w-5 shrink-0 text-xs font-medium text-muted-foreground text-right">
                {i + 1}
              </span>
              <p className="flex-1 min-w-0 truncate text-sm text-foreground">
                {item.event.title}
              </p>
              <span className="w-28 shrink-0 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{slugToDisplayName(item.locationSlug)}</span>
              </span>
              <span className="w-20 shrink-0 text-xs text-muted-foreground text-right tabular-nums">
                ${Math.round(item.event.volume24hr || 0).toLocaleString()}
              </span>
              <span className="w-6 shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                {prob !== null ? `${Math.round(prob * 100)}%` : ""}
              </span>
            </button>
          );
        })}

        {visibleCount < ranked.length && (
          <div
            ref={sentinelRef}
            className="px-4 py-3 text-center text-xs text-muted-foreground"
          >
            Loading more...
          </div>
        )}
      </div>

      {ranked.length > 0 && (
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          {ranked.length} events
        </div>
      )}
    </div>
  );
}
