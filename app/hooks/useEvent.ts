"use client";

import { useQuery } from "@tanstack/react-query";
import { PolymarketEvent } from "../lib/types";

async function fetchEvent(slug: string): Promise<PolymarketEvent> {
  const res = await fetch(`/api/events/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`Failed to load event ${slug}: ${res.status}`);
  return res.json();
}

export function useEvent(slug: string | undefined) {
  return useQuery<PolymarketEvent>({
    queryKey: ["event", slug],
    queryFn: () => fetchEvent(slug!),
    enabled: !!slug,
    refetchInterval: 30_000,
  });
}
