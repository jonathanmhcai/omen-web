"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

export interface PolymarketPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventId: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
}

export interface PositionsResponse {
  positions: PolymarketPosition[];
  totalValue: number;
}

export function usePositions() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  const { data, isLoading, error, refetch } = useQuery<PositionsResponse>({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/polymarket/positions`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        if (res.status === 404) {
          return { positions: [], totalValue: 0 };
        }
        throw new Error("Failed to fetch positions");
      }
      return res.json();
    },
    enabled: !!sessionToken,
    refetchInterval: 10_000,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
