"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "../lib/constants";

export interface FeedTag {
  key: string;
  label: string;
  /** polymarket_tags.slug, or null for the unfiltered "All" tab. */
  slug: string | null;
  /**
   * Polymarket gamma tag id (`polymarket_tags.polymarket_id`). Null
   * when the tab has no slug ("All") or when the slug isn't yet
   * indexed. Surfaces that hit gamma directly (e.g. mobile search)
   * filter tabs without a polymarketId.
   */
  polymarketId: string | null;
  /**
   * Slugs whose stories are filtered OUT of this tab. Set on the server
   * to keep tabs orthogonal — e.g. Politics excludes Iran so the same
   * geopolitics story doesn't appear in both. Optional; absent → no
   * exclusions.
   */
  excludeSlugs?: string[];
}

interface FeedTagsResponse {
  tags: FeedTag[];
}

/**
 * Feed tab list, served by `GET /feed-tags`. Unauthenticated — the
 * homepage feed is public, so the tab list must be too. Server is the
 * single source of truth — no client-side fallback, by design. Cached
 * aggressively (15min stale) so warm starts paint from React Query;
 * callers should render a skeleton on the very first cold start while
 * `tags` is undefined.
 */
export function useFeedTags(): FeedTag[] | undefined {
  const { data } = useQuery<FeedTagsResponse>({
    queryKey: ["feed-tags"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/feed-tags`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    staleTime: 15 * 60 * 1000,
  });
  return data?.tags;
}
