"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Meh } from "lucide-react";
import type { IDockviewPanelProps } from "dockview";
import { useMapPageContext } from "./MapPageContext";
import MarketList from "./MarketList";
import { slugToDisplayName } from "./geo";
import { PolymarketEvent } from "../lib/types";

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
    api.setTitle(slugToDisplayName(location));
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
