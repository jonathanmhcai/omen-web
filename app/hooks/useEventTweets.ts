"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";
import type { StoryTweet } from "./useStories";

/**
 * A story tweet with its X post time pre-resolved to Unix **seconds**
 * — the same unit the price chart's `t` axis uses, so markers can be
 * placed via the chart's x scale without per-render date parsing.
 */
export type EventTweet = StoryTweet & { tSeconds: number };

interface EventTweetsResponse {
  tweets: StoryTweet[];
}

/**
 * All tweets from `relevance='relevant'` published stories for this
 * event, for overlaying as markers on the event-detail price chart.
 * Single fetch (the server returns the full deduped set, newest-first,
 * capped) — not paginated like `useStories`, since the chart needs
 * the whole set up front to place markers across the time domain.
 *
 * `posted_at` (ISO) is converted once to `tSeconds` here; rows whose
 * timestamp can't be parsed are dropped (the chart can't place them).
 */
export function useEventTweets(polymarketEventId: string | undefined) {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  const query = useQuery<EventTweetsResponse>({
    queryKey: ["event-tweets", polymarketEventId ?? null],
    queryFn: async () => {
      const headers: HeadersInit = sessionToken
        ? { Authorization: `Bearer ${sessionToken}` }
        : {};
      const res = await fetch(
        `${API_BASE}/events/${polymarketEventId}/tweets`,
        { headers }
      );
      if (!res.ok) throw new Error(`event-tweets ${res.status}`);
      return res.json();
    },
    enabled: !!polymarketEventId,
    // Tweets trickle in over an event's life; the chart overlay isn't
    // realtime. Refetch on a slow cadence so a long-open chart picks
    // up new markers without hammering the endpoint.
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const tweets = useMemo<EventTweet[]>(() => {
    const raw = query.data?.tweets ?? [];
    const out: EventTweet[] = [];
    for (const t of raw) {
      const ms = Date.parse(t.posted_at);
      if (Number.isNaN(ms)) continue;
      out.push({ ...t, tSeconds: Math.floor(ms / 1000) });
    }
    return out;
  }, [query.data]);

  return { tweets, isLoading: query.isLoading };
}
