"use client";

import { useQuery } from "@tanstack/react-query";
import { PolymarketEvent } from "../lib/types";

async function fetchEvent(id: string): Promise<PolymarketEvent> {
  const res = await fetch(`/api/events/${id}`);
  if (!res.ok) throw new Error(`Failed to load event ${id}: ${res.status}`);
  return res.json();
}

export function useEvent(id: string | undefined) {
  return useQuery<PolymarketEvent>({
    queryKey: ["event", id],
    queryFn: () => fetchEvent(id!),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}
