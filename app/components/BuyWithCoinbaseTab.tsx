"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCoinbaseSession } from "../hooks/useCoinbaseSession";
import { Loader2, CheckCircle2 } from "lucide-react";

const MIN_AMOUNT = 10;
const POPUP_WIDTH = 460;
const POPUP_HEIGHT = 720;

interface BuyWithCoinbaseTabProps {
  onClose: () => void;
}

export default function BuyWithCoinbaseTab({ onClose }: BuyWithCoinbaseTabProps) {
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const session = useCoinbaseSession();

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= MIN_AMOUNT;

  // When session token is ready, open the Coinbase popup
  useEffect(() => {
    if (!session.isSuccess || !session.data) return;

    const params = new URLSearchParams({
      sessionToken: session.data.sessionToken,
      presetFiatAmount: String(parsedAmount),
      fiatCurrency: "USD",
    });
    const url = `https://pay.coinbase.com/buy/select-asset?${params}`;

    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
    const popup = window.open(
      url,
      "coinbase-onramp",
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`,
    );

    if (!popup) return;

    // Poll for popup close — Coinbase doesn't post messages back
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        setSuccess(true);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [session.isSuccess, session.data, parsedAmount]);

  function handleContinue() {
    session.mutate();
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

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Buy USDC via Coinbase. Minimum ${MIN_AMOUNT}.
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
          "Buy with Coinbase"
        )}
      </Button>
    </div>
  );
}
