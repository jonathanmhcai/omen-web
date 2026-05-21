"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";
import type { Story, StoryMarket } from "./useStories";

const PAGE_SIZE = 20;

// The endpoint omits `markets` since the event-stories tab doesn't
// render them (the event-detail page already frames the event).
type ServerStory = Omit<Story, "markets">;

interface EventStoriesResponse {
  stories: ServerStory[];
  next_cursor: string | null;
}

/**
 * Stories whose feed-card surface set includes this event — the
 * server filters via the same lockstep guard as `/stories`, so a
 * story shown in this tab is one whose home-feed card would include
 * this event.
 *
 * Returns `Story[]` for shape compatibility with `StoryCard`. Each
 * story is normalized with `markets: []` since the endpoint omits
 * the field — the tab passes `showMarkets={false}` to `StoryCard`
 * so the empty array is never rendered.
 */
export function useEventStories(polymarketEventId: string | undefined) {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  const query = useInfiniteQuery<EventStoriesResponse>({
    queryKey: [
      "event-stories",
      sessionToken ? "auth" : "anon",
      polymarketEventId ?? null,
    ],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      if (pageParam) params.set("cursor", pageParam as string);
      const headers: Record<string, string> = {};
      if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
      const res = await fetch(
        `${API_BASE}/events/${polymarketEventId}/stories?${params}`,
        { headers }
      );
      if (!res.ok) throw new Error(`event-stories ${res.status}`);
      return res.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!polymarketEventId,
  });

  const stories = useMemo<Story[]>(
    () =>
      query.data?.pages.flatMap((p) =>
        p.stories.map((s) => ({ ...s, markets: [] as StoryMarket[] }))
      ) ?? [],
    [query.data]
  );

  return {
    stories,
    isLoading: query.isLoading,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
