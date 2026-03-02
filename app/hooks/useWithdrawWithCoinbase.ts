"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import {
  useFetchOfframpTransactions,
  fetchBridgeWithdrawalAddress,
} from "./useCoinbaseOfframpSession";
import { useWalletTransaction } from "./useWalletTransaction";
import { useCookieString } from "./useCookieString";
import {
  SESSION_TOKEN_KEY,
  USDCE_ADDRESS,
  USDCE_DECIMALS,
} from "../lib/constants";

export function useWithdrawWithCoinbase() {
  const fetchOfframpTransactions = useFetchOfframpTransactions();
  const { sendTransaction } = useWalletTransaction();
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number): Promise<void> => {
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      // 1. Fetch offramp transactions to get Coinbase's deposit address
      const txResponse = await fetchOfframpTransactions();
      const toAddress = txResponse.transactions?.[0]?.to_address;
      if (!toAddress) {
        throw new Error("No deposit address found from Coinbase transaction");
      }

      // 2. Get bridge withdrawal address
      const bridgeResponse = await fetchBridgeWithdrawalAddress(
        sessionToken,
        toAddress,
      );
      const bridgeEvmAddress = bridgeResponse.addresses.evm;
      if (!bridgeEvmAddress) {
        throw new Error("No bridge EVM address returned");
      }

      // 3. Send USDC.e to the bridge address
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          bridgeEvmAddress.trim() as `0x${string}`,
          parseUnits(amount.toString(), USDCE_DECIMALS),
        ],
      });

      await sendTransaction({
        to: USDCE_ADDRESS,
        data,
        value: "0x0",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });
}
