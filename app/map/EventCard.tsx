"use client";

import { MapPin, X } from "lucide-react";
import { useMapPageContext } from "./MapPageContext";
import MarketList from "./MarketList";
import { slugToDisplayName } from "./geo";
import type { PolymarketEvent } from "../lib/types";

interface EventCardProps {
  event: PolymarketEvent;
  slug: string;
  onClose?: () => void;
}

export default function EventCard({ event, slug, onClose }: EventCardProps) {
  const ctx = useMapPageContext();
  const locationName = slugToDisplayName(slug);
  const locationEvents = ctx.eventsByLocation.get(slug) ?? [];

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {event.image && (
            <img
              src={event.image}
              alt=""
              className="mt-0.5 h-8 w-8 shrink-0 rounded object-cover"
            />
          )}
          <p className="text-sm font-medium text-foreground">{event.title}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span>${Math.round(event.volume || 0).toLocaleString()} vol</span>
        <span>${Math.round(event.volume24hr || 0).toLocaleString()} 24h</span>
        {event.endDate && (
          <span>
            Ends{" "}
            {new Date(event.endDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      <button
        onClick={() => {
          ctx.onLocationSelect(slug, locationEvents);
          onClose?.();
        }}
        className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MapPin className="h-3 w-3" />
        <span>{locationName}</span>
        {locationEvents.length > 0 && (
          <span className="text-muted-foreground/60">
            — {locationEvents.length} event{locationEvents.length !== 1 ? "s" : ""}
          </span>
        )}
      </button>

      {event.markets && event.markets.length > 0 && (
        <MarketList markets={event.markets} onMarket={ctx.onMarket} />
      )}
    </>
  );
}
