"use client";

import EventCard from "./EventCard";
import type { PolymarketEvent } from "../lib/types";

interface EventPopupCardProps {
  event: PolymarketEvent;
  slug: string;
  onClose: () => void;
}

export default function EventPopupCard({ event, slug, onClose }: EventPopupCardProps) {
  return (
    <div className="w-[320px] max-h-[400px] flex flex-col rounded-lg border border-border bg-popover shadow-2xl overflow-hidden">
      <div className="px-3 py-3 overflow-y-auto">
        <EventCard event={event} slug={slug} onClose={onClose} />
      </div>
    </div>
  );
}
