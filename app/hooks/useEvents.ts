"use client";

import { useCallback, useEffect, useState } from "react";
import { PolymarketEvent } from "../lib/types";

interface UseEventsOptions {
  limit?: number;
  active?: boolean;
  archived?: boolean;
  featured?: boolean;
  endDateMin?: Date;
  order?: string;
  ascending?: boolean;
  volumeMin?: number;
  excludeTagIds?: string[];
}

export function useEvents({ limit = 10, active = true, archived = true, featured = false, endDateMin, order, ascending, volumeMin, excludeTagIds }: UseEventsOptions = {}) {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const excludeTagKey = excludeTagIds?.join(",") ?? "";

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(page * limit),
      active: String(active),
      archived: String(!archived),
    });
    if (featured) {
      params.set("featured", "true");
    }
    if (endDateMin) {
      params.set("end_date_min", endDateMin.toISOString());
    }
    if (volumeMin != null) {
      params.set("volume_min", String(volumeMin));
    }
    if (order) {
      params.set("order", order);
      params.set("ascending", String(ascending ?? true));
    }

    if (excludeTagIds && excludeTagIds.length > 0) {
      excludeTagIds.forEach(tag => params.append("exclude_tag_id", tag));
    }

    fetch(`/api/events?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setHasMore(data.length === limit);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, active, archived, featured, endDateMin, order, ascending, volumeMin, excludeTagKey, page]);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const firstPage = useCallback(() => setPage(0), []);

  return { events, loading, error, page, hasMore, nextPage, prevPage, firstPage };
}
