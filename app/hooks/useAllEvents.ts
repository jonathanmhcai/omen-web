"use client";

import { useQuery } from "@tanstack/react-query";
import { PolymarketEvent } from "../lib/types";

const PAGE_SIZE = 500;
const OPTIMISTIC_PAGES = 4;

interface UseAllEventsOptions {
  tagIds?: string[];
  excludeTagIds?: string[];
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
}

function buildParams(
  offset: number,
  { tagIds, excludeTagIds, active, closed, archived }: Required<Pick<UseAllEventsOptions, "active" | "archived">> & Pick<UseAllEventsOptions, "tagIds" | "excludeTagIds" | "closed">,
): URLSearchParams {
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

async function fetchPage(
  offset: number,
  opts: Required<Pick<UseAllEventsOptions, "active" | "archived">> & Pick<UseAllEventsOptions, "tagIds" | "excludeTagIds" | "closed">,
): Promise<PolymarketEvent[]> {
  const res = await fetch(`/api/events?${buildParams(offset, opts)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchAllEvents(opts: Required<Pick<UseAllEventsOptions, "active" | "archived">> & Pick<UseAllEventsOptions, "tagIds" | "excludeTagIds" | "closed">): Promise<PolymarketEvent[]> {
  // Fire first N pages in parallel
  const initial = await Promise.all(
    Array.from({ length: OPTIMISTIC_PAGES }, (_, i) => fetchPage(i * PAGE_SIZE, opts)),
  );

  const all: PolymarketEvent[] = initial.flat();
  const lastPage = initial[initial.length - 1];

  // If the last optimistic page was full, keep fetching sequentially
  if (lastPage.length === PAGE_SIZE) {
    let offset = OPTIMISTIC_PAGES * PAGE_SIZE;
    while (true) {
      const data = await fetchPage(offset, opts);
      all.push(...data);
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }

  return all;
}

export function useAllEvents({ tagIds, excludeTagIds, active = true, closed, archived = true }: UseAllEventsOptions = {}) {
  const tagKey = tagIds?.join(",") ?? "";
  const excludeTagKey = excludeTagIds?.join(",") ?? "";

  const { data, isLoading, error } = useQuery<PolymarketEvent[]>({
    queryKey: ["allEvents", tagKey, excludeTagKey, active, closed, archived],
    queryFn: () => fetchAllEvents({ tagIds, excludeTagIds, active, closed, archived }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    events: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
}
