"use client";

import { useCallback, useEffect, useState } from "react";
import { SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

export function useUsdcBalance() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!sessionToken) return;

    setLoading(true);
    try {
      const res = await fetch("/api/me/portfolio-value", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setBalance(data.usdc ?? null);
    } catch {
      // silently fail — balance is non-critical
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
