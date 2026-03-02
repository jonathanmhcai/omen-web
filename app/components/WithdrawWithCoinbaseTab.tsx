"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCoinbaseOfframpSession } from "../hooks/useCoinbaseOfframpSession";
import { Loader2 } from "lucide-react";

const MIN_AMOUNT = 10;
const POPUP_WIDTH = 460;
const POPUP_HEIGHT = 720;
const COINBASE_ORIGIN = "https://pay.coinbase.com";

interface WithdrawWithCoinbaseTabProps {
  balance: number | null;
  onAmountChange: (amount: number) => void;
  onPopupOpened: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

export default function WithdrawWithCoinbaseTab({
  balance,
  onAmountChange,
  onPopupOpened,
  onComplete,
  onCancel,
}: WithdrawWithCoinbaseTabProps) {
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const session = useCoinbaseOfframpSession();

  const parsedAmount = parseFloat(amount);
  const isValidAmount =
    !isNaN(parsedAmount) &&
    parsedAmount >= MIN_AMOUNT &&
    (balance === null || parsedAmount <= balance);

  // When session token is ready, open the Coinbase offramp popup
  useEffect(() => {
    if (!session.isSuccess || !session.data) return;

    const params = new URLSearchParams({
      sessionToken: session.data.sessionToken,
      partnerUserRef: session.data.partnerUserRef,
      defaultAsset: "USDC",
      defaultNetwork: "polygon",
      presetCryptoAmount: String(parsedAmount),
      disableEdit: "true",
      redirectUrl: window.location.origin,
    });
    const url = `https://pay.coinbase.com/v3/sell/input?${params}`;

    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
    const popup = window.open(
      url,
      "coinbase-offramp",
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`,
    );

    if (!popup) return;
    popupRef.current = popup;
    onPopupOpened();

    let completed = false;

    // Listen for Coinbase postMessage events
    function handleMessage(e: MessageEvent) {
      if (e.origin !== COINBASE_ORIGIN) return;
      try {
        const parsed = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        const innerEvent = parsed?.data?.eventName ?? parsed?.eventName;
        if (innerEvent === "success") {
          completed = true;
          popup!.close();
        }
      } catch {
        // Not JSON, ignore
      }
    }
    window.addEventListener("message", handleMessage);

    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        window.removeEventListener("message", handleMessage);
        popupRef.current = null;
        if (completed) {
          onComplete();
        } else {
          onCancel();
        }
        return;
      }
      // Fallback: detect when Coinbase redirects back to our origin
      try {
        if (popup.location?.origin === window.location.origin) {
          completed = true;
          popup.close();
        }
      } catch {
        // Cross-origin — popup is still on Coinbase, ignore
      }
    }, 500);

    return () => {
      clearInterval(interval);
      window.removeEventListener("message", handleMessage);
    };
  }, [session.isSuccess, session.data]);

  function handleWithdraw() {
    setSubmitted(true);
    if (!isValidAmount) return;
    onAmountChange(parsedAmount);
    session.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Cash out USDC via Coinbase. Minimum ${MIN_AMOUNT}.
      </p>

      {balance !== null && (
        <p className="text-sm text-muted-foreground">
          Available:{" "}
          <span className="font-medium text-foreground">
            ${balance.toFixed(2)}
          </span>
        </p>
      )}

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <input
          type="number"
          min={MIN_AMOUNT}
          max={balance ?? undefined}
          step="1"
          placeholder={`${MIN_AMOUNT}.00`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-7 pr-3 text-sm outline-none focus:border-ring"
        />
      </div>

      {submitted && amount && !isNaN(parsedAmount) && parsedAmount < MIN_AMOUNT && (
        <p className="text-sm text-destructive">
          Minimum amount is ${MIN_AMOUNT}
        </p>
      )}

      {submitted && amount && balance !== null && parsedAmount > balance && (
        <p className="text-sm text-destructive">Exceeds available balance</p>
      )}

      {session.isError && (
        <p className="text-sm text-destructive">
          {session.error?.message ||
            "Something went wrong. Please try again."}
        </p>
      )}

      <Button
        onClick={handleWithdraw}
        disabled={session.isPending}
      >
        {session.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "Withdraw with Coinbase"
        )}
      </Button>
    </div>
  );
}
