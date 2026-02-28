"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

export interface SupportedAsset {
  chainId: string;
  chainName: string;
  token: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
  };
  minCheckoutUsd: number;
}

export interface DepositAddressesResponse {
  addresses: {
    evm: string;
    svm: string;
    btc: string;
  };
  supportedAssets: SupportedAsset[];
}

export function useDepositAddresses() {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  return useQuery<DepositAddressesResponse>({
    queryKey: ["deposit-addresses"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/polymarket/bridge/deposit-addresses`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch deposit addresses");
      }
      return res.json();
    },
    enabled: !!sessionToken,
  });
}
