"use client";

import { useQuery } from "@tanstack/react-query";
import { PolymarketMarket } from "../lib/types";

export function useMarket(conditionId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery<PolymarketMarket | null>({
    queryKey: ["market", conditionId],
    queryFn: async () => {
      const res = await fetch(
        `/api/markets?condition_ids=${encodeURIComponent(conditionId!)}`
      );
      if (!res.ok) throw new Error("Failed to fetch market");
      const markets: PolymarketMarket[] = await res.json();
      return markets[0] ?? null;
    },
    enabled: !!conditionId,
    refetchInterval: 10_000,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
