"use client";

import { useState } from "react";
import {
  CoinflowPurchase,
  SettlementType,
  PaymentMethods,
  Currency,
} from "@coinflowlabs/react";
import { Button } from "@/components/ui/button";
import { useCoinflowSession } from "../hooks/useCoinflowSession";
import { Loader2, CheckCircle2 } from "lucide-react";

const MERCHANT_ID = process.env.NEXT_PUBLIC_COINFLOW_MERCHANT_ID!;
const COINFLOW_ENV = (process.env.NEXT_PUBLIC_COINFLOW_ENV ?? "sandbox") as
  | "sandbox"
  | "prod";

const MIN_AMOUNT = 5;

interface BuyWithCardTabProps {
  evmAddress: string;
  onClose: () => void;
}

export default function BuyWithCardTab({
  evmAddress,
  onClose,
}: BuyWithCardTabProps) {
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const session = useCoinflowSession();

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= MIN_AMOUNT;

  function handleContinue() {
    setAuthError(null);
    session.mutate();
  }

  function handleBack() {
    session.reset();
    setAuthError(null);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div className="text-center">
          <p className="text-lg font-medium">Payment submitted</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your USDC balance will update once the payment settles.
          </p>
        </div>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  if (session.isSuccess && session.data) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            &larr; Back
          </button>
          <span className="text-sm font-medium">${parsedAmount.toFixed(2)}</span>
        </div>

        {authError && (
          <p className="text-sm text-destructive">{authError}</p>
        )}

        <div className="min-h-[400px] rounded-xl overflow-hidden border border-border">
          <CoinflowPurchase
            wallet={{ address: evmAddress, sendTransaction: noopSendTx, signMessage: noopSignMsg }}
            merchantId={MERCHANT_ID}
            env={COINFLOW_ENV}
            blockchain="polygon"
            settlementType={SettlementType.USDC}
            subtotal={{ cents: Math.round(parsedAmount * 100), currency: Currency.USD }}
            destinationAuthKey={session.data.destinationAuthKey}
            allowedPaymentMethods={[PaymentMethods.card, PaymentMethods.applePay]}
            onSuccess={() => setSuccess(true)}
            onAuthDeclined={(info) =>
              setAuthError(info.message || "Payment was declined. Please try again.")
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Buy USDC with credit card or Apple Pay. Minimum ${MIN_AMOUNT}.
      </p>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <input
          type="number"
          min={MIN_AMOUNT}
          step="1"
          placeholder={`${MIN_AMOUNT}.00`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-7 pr-3 text-sm outline-none focus:border-ring"
        />
      </div>

      {amount && !isValidAmount && (
        <p className="text-sm text-destructive">
          Minimum amount is ${MIN_AMOUNT}
        </p>
      )}

      {session.isError && (
        <p className="text-sm text-destructive">
          {session.error?.message || "Something went wrong. Please try again."}
        </p>
      )}

      <Button onClick={handleContinue} disabled={!isValidAmount || session.isPending}>
        {session.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );
}

// No-op wallet methods — the fiat flow doesn't need on-chain signing
async function noopSendTx(): Promise<{ hash: string }> {
  return { hash: "" };
}

async function noopSignMsg(): Promise<string> {
  return "";
}
