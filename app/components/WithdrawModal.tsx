"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { useWithdrawWithCoinbase } from "../hooks/useWithdrawWithCoinbase";
import { useSendUsdce } from "../hooks/useSendUsdce";
import ModalShell from "./ModalShell";
import WithdrawWithCoinbaseTab from "./WithdrawWithCoinbaseTab";
import WithdrawCryptoTab from "./WithdrawCryptoTab";

interface WithdrawModalProps {
  onClose: () => void;
}

export default function WithdrawModal({ onClose }: WithdrawModalProps) {
  const { balance } = useUsdcBalance();
  const coinbaseWithdraw = useWithdrawWithCoinbase();
  const cryptoWithdraw = useSendUsdce();
  const [amount, setAmount] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);

  const isPending = popupOpen || coinbaseWithdraw.isPending || cryptoWithdraw.isPending;
  const isSuccess = coinbaseWithdraw.isSuccess || cryptoWithdraw.isSuccess;
  const isError = coinbaseWithdraw.isError || cryptoWithdraw.isError;
  const errorMessage = coinbaseWithdraw.error?.message || cryptoWithdraw.error?.message;

  return (
    <ModalShell
      open
      onClose={onClose}
      title="Withdraw"
      isPending={isPending}
      isSuccess={isSuccess}
      isError={isError}
      errorMessage={errorMessage}
      loadingMessage={
        popupOpen
          ? "Waiting for Coinbase..."
          : "Transferring funds..."
      }
      successMessage={cryptoWithdraw.isSuccess ? "Funds transferred" : "Withdrawal submitted"}
      successDescription={cryptoWithdraw.isSuccess ? "Funds will take seconds to settle." : "Funds may take ~5 min to settle."}
    >
      <Tabs defaultValue="coinbase">
        <TabsList>
          <TabsTrigger value="coinbase">Coinbase</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>

        <TabsContent value="coinbase">
          <WithdrawWithCoinbaseTab
            balance={balance}
            onAmountChange={setAmount}
            onPopupOpened={() => setPopupOpen(true)}
            onComplete={() => {
              setPopupOpen(false);
              coinbaseWithdraw.mutate(amount);
            }}
            onCancel={() => setPopupOpen(false)}
          />
        </TabsContent>

        <TabsContent value="crypto">
          <WithdrawCryptoTab
            balance={balance}
            onWithdraw={(recipient, amount) => cryptoWithdraw.mutate({ recipient, amount })}
            isPending={cryptoWithdraw.isPending}
          />
        </TabsContent>
      </Tabs>
    </ModalShell>
  );
}
