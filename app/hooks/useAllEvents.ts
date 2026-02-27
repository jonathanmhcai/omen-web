"use client";

import { useEffect, useState } from "react";
import { PolymarketEvent } from "../lib/types";

const PAGE_SIZE = 500;

interface UseAllEventsOptions {
  tagIds?: string[];
  excludeTagIds?: string[];
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
}

export function useAllEvents({ tagIds, excludeTagIds, active = true, closed, archived = true }: UseAllEventsOptions = {}) {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tagKey = tagIds?.join(",") ?? "";
  const excludeTagKey = excludeTagIds?.join(",") ?? "";

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
          archived: String(archived),
        });
        if (closed !== undefined) {
          params.set("closed", String(closed));
        }
        if (tagIds && tagIds.length > 0) {
          tagIds.forEach((tag) => params.append("tag_id", tag));
        }
        if (excludeTagIds && excludeTagIds.length > 0) {
          excludeTagIds.forEach((tag) => params.append("exclude_tag_id", tag));
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
  }, [tagKey, excludeTagKey, active, closed, archived]);

  return { events, loading, error };
}
