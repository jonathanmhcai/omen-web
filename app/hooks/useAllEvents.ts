"use client";

import { useEffect, useState } from "react";
import { PolymarketEvent } from "../lib/types";

const PAGE_SIZE = 500;

interface UseAllEventsOptions {
  tagIds?: string[];
  active?: boolean;
  archived?: boolean;
}

export function useAllEvents({ tagIds, active = true, archived = true }: UseAllEventsOptions = {}) {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tagKey = tagIds?.join(",") ?? "";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchAll() {
      const all: PolymarketEvent[] = [];
      let offset = 0;

      while (true) {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
          active: String(active),
          archived: String(!archived),
        });
        if (tagIds && tagIds.length > 0) {
          tagIds.forEach((tag) => params.append("tag_id", tag));
        }

        const res = await fetch(`/api/events?${params}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: PolymarketEvent[] = await res.json();

        if (cancelled) return;
        all.push(...data);

        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      if (!cancelled) {
        setEvents(all);
        setLoading(false);
      }
    }

    fetchAll().catch((err) => {
      if (!cancelled) {
        setError(err.message);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [tagKey, active, archived]);

  return { events, loading, error };
}
