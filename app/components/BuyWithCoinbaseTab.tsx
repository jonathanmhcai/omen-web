"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initOnRamp, type CBPayInstanceType } from "@coinbase/cbpay-js";
import { Button } from "@/components/ui/button";
import { useCoinbaseSession } from "../hooks/useCoinbaseSession";
import { Loader2, CheckCircle2 } from "lucide-react";

const MIN_AMOUNT = 10;

interface BuyWithCoinbaseTabProps {
  onClose: () => void;
}

export default function BuyWithCoinbaseTab({ onClose }: BuyWithCoinbaseTabProps) {
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const session = useCoinbaseSession();
  const onrampInstance = useRef<CBPayInstanceType | null>(null);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= MIN_AMOUNT;

  const initWidget = useCallback(
    (sessionToken: string) => {
      // Destroy previous instance if any
      onrampInstance.current?.destroy();

      initOnRamp(
        {
          appId: "", // Not needed when using sessionToken
          widgetParameters: {
            sessionToken,
            presetFiatAmount: parsedAmount,
          } as any,
          experienceLoggedIn: "popup",
          experienceLoggedOut: "popup",
          closeOnSuccess: true,
          closeOnExit: true,
          onSuccess: () => setSuccess(true),
          onExit: () => {
            // User closed the popup — no action needed
          },
        },
        (error, instance) => {
          if (instance) {
            onrampInstance.current = instance;
            instance.open();
          }
        },
      );
    },
    [parsedAmount],
  );

  // When session is fetched, init + open the widget
  useEffect(() => {
    if (session.isSuccess && session.data) {
      initWidget(session.data.sessionToken);
    }
  }, [session.isSuccess, session.data, initWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onrampInstance.current?.destroy();
    };
  }, []);

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
