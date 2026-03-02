"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { useWalletTransaction } from "./useWalletTransaction";
import { USDCE_ADDRESS, USDCE_DECIMALS } from "../lib/constants";

interface SendUsdceArgs {
  recipient: string;
  amount: number;
}

export function useSendUsdce() {
  const { sendTransaction } = useWalletTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, amount }: SendUsdceArgs): Promise<void> => {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          recipient.trim() as `0x${string}`,
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
