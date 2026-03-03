"use client";

import { useCallback, useState } from "react";
import {
  useWallets,
  useSessionSigners,
  getEmbeddedConnectedWallet,
} from "@privy-io/react-auth";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

const SERVER_WALLET_SIGNER_ID = "rb5o0khtxqqrrq3fclrnmnex";
const DEFAULT_INVITE_CODE = "SITUATIONMONITOR";

export function useSetup() {
  const { wallets } = useWallets();
  const { addSessionSigners } = useSessionSigners();
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setup = useCallback(async (inviteCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Delegate signing to the server wallet
      const wallet = getEmbeddedConnectedWallet(wallets);
      if (!wallet) throw new Error("No embedded wallet found");

      await addSessionSigners({
        address: wallet.address,
        signers: [{ signerId: SERVER_WALLET_SIGNER_ID, policyIds: [] }],
      });

      // 2. Call /me/setup with invite code
      const res = await fetch(`${API_BASE}/me/setup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode: inviteCode || DEFAULT_INVITE_CODE }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Setup failed");
      }

      return { bonusUsdc: data.bonusUsdc as number | null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Setup failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallets, addSessionSigners, sessionToken]);

  return { setup, loading, error };
}
