"use client";

import { useCallback } from "react";
import {
  useWallets,
  usePrivy,
  useAuthorizationSignature,
  getEmbeddedConnectedWallet,
} from "@privy-io/react-auth";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

export interface TransactionData {
  to: string;
  data: `0x${string}`;
  value?: string;
}

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

export function useWalletTransaction() {
  const { wallets } = useWallets();
  const { user: privyUser } = usePrivy();
  const { generateAuthorizationSignature } = useAuthorizationSignature();
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  const sendTransaction = useCallback(
    async (transactionData: TransactionData): Promise<void> => {
      const wallet = getEmbeddedConnectedWallet(wallets);
      if (!wallet) {
        throw new Error("No embedded wallet found");
      }
      if (!privyUser) {
        throw new Error("No Privy user available");
      }
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const walletAccount = privyUser.linkedAccounts?.find(
        (account: any) =>
          account.type === "wallet" && account.address === wallet.address,
      ) as { id: string } | undefined;

      if (!walletAccount?.id) {
        throw new Error("Wallet account not found");
      }

      const walletId = walletAccount.id;

      const transactionBody = {
        method: "eth_sendTransaction",
        caip2: "eip155:137",
        chain_type: "ethereum",
        sponsor: true,
        params: {
          transaction: {
            to: transactionData.to,
            data: transactionData.data,
            value: transactionData.value || "0x0",
          },
        },
      };

      const requestUrl = `https://api.privy.io/v1/wallets/${walletId}/rpc`;

      const { signature } = await generateAuthorizationSignature({
        version: 1,
        method: "POST" as const,
        url: requestUrl,
        headers: {
          "privy-app-id": PRIVY_APP_ID,
        },
        body: transactionBody,
      });

      const res = await fetch(`${API_BASE}/wallet/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionBody,
          authorizationSignature: signature,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Transaction failed");
      }
    },
    [wallets, privyUser, generateAuthorizationSignature, sessionToken],
  );

  return { sendTransaction };
}
