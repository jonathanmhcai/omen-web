"use client";

import { MapPin } from "lucide-react";
import type { IDockviewPanelProps } from "dockview";
import { useMapPageContext } from "./MapPageContext";
import MarketList from "./MarketList";
import { slugToDisplayName } from "./geo";
import { PolymarketEvent } from "../lib/types";

interface EventPanelParams {
  event: PolymarketEvent;
  locationSlug: string;
}

export default function EventPanel({
  params,
}: IDockviewPanelProps<EventPanelParams>) {
  const ctx = useMapPageContext();
  const e = params.event;
  const locationSlug = params.locationSlug;
  const locationName = slugToDisplayName(locationSlug);
  const locationEvents = ctx.eventsByLocation.get(locationSlug) ?? [];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
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

          <button
            onClick={() => ctx.onLocationSelect(locationSlug, locationEvents)}
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

          {e.markets && e.markets.length > 0 && (
            <MarketList markets={e.markets} onMarket={ctx.onMarket} />
          )}
        </div>
      </div>
    </div>
  );
}
