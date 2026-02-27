"use client";

import { useCallback, useEffect, useState } from "react";
import { SESSION_TOKEN_KEY } from "../lib/constants";
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
  const [data, setData] = useState<PositionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!sessionToken) return;

    setLoading(true);
    try {
      const res = await fetch("/api/polymarket/positions", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        if (res.status === 404) {
          // No polymarket account — not an error, just no positions
          setData({ positions: [], totalValue: 0 });
          return;
        }
        throw new Error("Failed to fetch positions");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { data, loading, error, refetch: fetchPositions };
}
