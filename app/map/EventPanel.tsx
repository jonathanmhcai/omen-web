"use client";

import type { IDockviewPanelProps } from "dockview";
import EventCard from "./EventCard";
import { PolymarketEvent } from "../lib/types";

interface EventPanelParams {
  event: PolymarketEvent;
  locationSlug: string;
}

export default function EventPanel({
  params,
}: IDockviewPanelProps<EventPanelParams>) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <EventCard event={params.event} slug={params.locationSlug} />
        </div>
      </div>
    </div>
  );
}
