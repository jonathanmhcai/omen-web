"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

export type TweetMediaKind = "photo" | "video" | "gif";
export type TweetAuthorVerifiedType = "blue" | "business" | "government" | null;

export interface TweetMedia {
  url: string;
  width: number | null;
  height: number | null;
  kind: TweetMediaKind;
}

export interface StoryTweet {
  tweet_id: string;
  author_handle: string;
  author_display_name: string;
  author_avatar_url: string | null;
  author_verified_type: TweetAuthorVerifiedType;
  body: string;
  posted_at: string;
  similarity: number | null;
  is_seed: boolean;
  permalink: string;
  media: TweetMedia[];
}

export interface StoryMarketOutcome {
  outcome: string | null;
  price: number | null;
  token_id: string;
}

export interface StoryMarket {
  id: string;
  polymarket_id: string;
  condition_id: string;
  slug: string;
  question: string;
  end_date: string | null;
  volume_24hr: number | null;
  volume_1wk: number | null;
  volume_1mo: number | null;
  /** Lifetime volume (`polymarket_markets.volume_num`). */
  volume_total: number | null;
  best_bid: number | null;
  best_ask: number | null;
  last_trade_price: number | null;
  one_day_price_change: number | null;
  matched_at: string;
  outcomes: StoryMarketOutcome[];
  event_polymarket_id: string;
  event_slug: string;
}

export interface Story {
  id: string;
  headline: string;
  created_at: string;
  promoted_at: string;
  latest_media_at: string;
  media_count: number;
  distinct_author_count: number;
  hero_image: TweetMedia | null;
  tweets: StoryTweet[];
  markets: StoryMarket[];
}

interface StoriesResponse {
  stories: Story[];
  next_cursor: string | null;
}

const PAGE_SIZE = 20;

export function useStories(tagSlug?: string, excludeSlugs?: readonly string[]) {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  // Stable cache key segment for the exclusion list — sorted+joined so
  // [a,b] and [b,a] hit the same cache entry. Empty/absent → null.
  const excludeKey =
    excludeSlugs && excludeSlugs.length > 0
      ? [...excludeSlugs].sort().join(",")
      : null;

  const query = useInfiniteQuery<StoriesResponse>({
    queryKey: [
      "stories",
      sessionToken ? "auth" : "anon",
      tagSlug ?? null,
      excludeKey,
    ],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      if (pageParam) params.set("cursor", pageParam as string);
      if (tagSlug) params.set("filter_by_tag_slug", tagSlug);
      if (excludeSlugs) {
        for (const slug of excludeSlugs) params.append("exclude_tag_slug", slug);
      }
      const headers: Record<string, string> = {};
      if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
      const res = await fetch(`${API_BASE}/stories?${params}`, { headers });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });

  const stories = useMemo<Story[]>(
    () => query.data?.pages.flatMap((p) => p.stories) ?? [],
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
