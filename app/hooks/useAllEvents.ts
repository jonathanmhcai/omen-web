"use client";

import { useEffect, useState } from "react";
import { PolymarketEvent } from "../lib/types";

const PAGE_SIZE = 500;
const OPTIMISTIC_PAGES = 3;

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

    function buildParams(offset: number): URLSearchParams {
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
      return params;
    }

    async function fetchPage(offset: number): Promise<PolymarketEvent[]> {
      const res = await fetch(`/api/events?${buildParams(offset)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    }

    async function fetchAll() {
      // Fire first N pages in parallel
      const initial = await Promise.all(
        Array.from({ length: OPTIMISTIC_PAGES }, (_, i) => fetchPage(i * PAGE_SIZE)),
      );
      if (cancelled) return;

      const all: PolymarketEvent[] = initial.flat();
      const lastPage = initial[initial.length - 1];

      // If the last optimistic page was full, keep fetching sequentially
      if (lastPage.length === PAGE_SIZE) {
        let offset = OPTIMISTIC_PAGES * PAGE_SIZE;
        while (true) {
          const data = await fetchPage(offset);
          if (cancelled) return;
          all.push(...data);
          if (data.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }
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
