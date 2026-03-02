"use client";

import { useMutation } from "@tanstack/react-query";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

interface CoinflowSessionResponse {
  destinationAuthKey: string;
}

export function useCoinflowSession() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  return useMutation<CoinflowSessionResponse>({
    mutationFn: async () => {
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_BASE}/coinflow/onramp/session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      return data;
    },
  });
}
