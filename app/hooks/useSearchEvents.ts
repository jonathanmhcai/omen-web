"use client";

import { useEffect, useState } from "react";
import { PolymarketEvent } from "../lib/types";

export function useSearchEvents(query: string) {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const params = new URLSearchParams({
      q: query.trim(),
      search_tags: "false",
      search_profiles: "false",
      limit_per_type: "20",
    });

    fetch(`/api/search?${params}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Search API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setEvents(data.events ?? []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  return { events, loading, error };
}
