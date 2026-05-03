"use client";

import { Calendar } from "lucide-react";
import { PolymarketEvent } from "../../lib/types";

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventHeader({ event }: { event: PolymarketEvent }) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-border pb-3">
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {event.endDate && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[13px] font-medium">
              {formatEventDate(event.endDate)}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-[19px] font-semibold leading-snug line-clamp-2">
            {event.title || event.subtitle || "Untitled Event"}
          </h1>
          {event.subtitle && event.title && (
            <p className="truncate text-sm text-muted-foreground">
              {event.subtitle}
            </p>
          )}
        </div>
      </div>
      {event.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.icon}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      )}
    </div>
  );
}
