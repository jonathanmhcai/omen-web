"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
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

export function useCreateOrder(conditionId: string | undefined) {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error, data } = useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_BASE}/polymarket/orders/v2`, {
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

      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["usdcBalance"] });
      if (conditionId) {
        queryClient.invalidateQueries({ queryKey: ["market", conditionId] });
      }
    },
  });

  return {
    createOrder: mutateAsync,
    loading: isPending,
    error: error?.message ?? null,
    data: data ?? null,
  };
}
