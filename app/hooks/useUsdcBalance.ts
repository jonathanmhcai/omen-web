"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

export function useUsdcBalance() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["usdcBalance"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/me/portfolio-value`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return (json.usdc as number) ?? null;
    },
    enabled: !!sessionToken,
    refetchInterval: 10_000,
  });

  return { balance: data ?? null, loading: isLoading, refetch };
}
