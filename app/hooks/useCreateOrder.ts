"use client";

import { useCallback, useState } from "react";
import { SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

interface CreateOrderParams {
  tokenID: string;
  side: "BUY" | "SELL";
  amount: number;
  price: number;
  options: {
    tickSize: number;
    negRisk: boolean;
  };
  orderType: "FOK";
}

export function useCreateOrder() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  const createOrder = useCallback(
    async (params: CreateOrderParams) => {
      if (!sessionToken) {
        setError("Not authenticated");
        return;
      }

      setLoading(true);
      setError(null);
      setData(null);

      try {
        const res = await fetch("/api/polymarket/orders/v2", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(responseData.error || responseData.message || "Order failed");
        }

        setData(responseData);
        return responseData;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sessionToken],
  );

  return { createOrder, loading, error, data };
}
