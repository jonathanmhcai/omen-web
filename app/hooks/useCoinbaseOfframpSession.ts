"use client";

import { useMutation } from "@tanstack/react-query";
import { API_BASE, SESSION_TOKEN_KEY, USDC_ADDRESS } from "../lib/constants";
import { useCookieString } from "./useCookieString";

interface CoinbaseOfframpSessionResponse {
  sessionToken: string;
  partnerUserRef: string;
}

export interface OfframpTransaction {
  transaction_id: string;
  status: string;
  to_address: string;
  from_address: string;
  tx_hash: string;
  asset: string;
  network: string;
  sell_amount: string;
}

interface OfframpTransactionsResponse {
  transactions: OfframpTransaction[];
  total_count: number;
}

interface BridgeWithdrawalResponse {
  addresses: {
    evm: string;
    svm: string;
    btc: string;
  };
}

export function useCoinbaseOfframpSession() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  return useMutation<CoinbaseOfframpSessionResponse>({
    mutationFn: async () => {
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_BASE}/coinbase/offramp/session-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to create Coinbase session");
      }

      return data;
    },
  });
}

export function useFetchOfframpTransactions() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  return async (): Promise<OfframpTransactionsResponse> => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    const res = await fetch(`${API_BASE}/coinbase/offramp/transactions`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch offramp transactions");
    }

    return data;
  };
}

export async function fetchBridgeWithdrawalAddress(
  sessionToken: string,
  recipientAddr: string,
): Promise<BridgeWithdrawalResponse> {
  const res = await fetch(
    `${API_BASE}/polymarket/bridge/withdrawal-addresses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toChainId: "137",
        toTokenAddress: USDC_ADDRESS,
        recipientAddr,
      }),
    },
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Failed to get bridge withdrawal address");
  }

  return data;
}

export function useBridgeWithdrawal() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  return useMutation<BridgeWithdrawalResponse, Error, string>({
    mutationFn: async (recipientAddr: string) => {
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      return fetchBridgeWithdrawalAddress(sessionToken, recipientAddr);
    },
  });
}
