"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface WithdrawCryptoTabProps {
  balance: number | null;
  onWithdraw: (recipient: string, amount: number) => void;
  isPending: boolean;
}

export default function WithdrawCryptoTab({
  balance,
  onWithdraw,
  isPending,
}: WithdrawCryptoTabProps) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const parsedAmount = parseFloat(amount);
  const isValidAmount =
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    (balance === null || parsedAmount <= balance);
  const isValidAddress = isAddress(address);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Withdraw USDC.e to an external wallet on Polygon.
      </p>

      {balance !== null && (
        <p className="text-sm text-muted-foreground">
          Available:{" "}
          <span className="font-medium text-foreground">
            ${balance.toFixed(2)}
          </span>
        </p>
      )}

      <input
        type="text"
        placeholder="0x..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full rounded-xl border border-border bg-muted/50 py-2.5 px-3 text-sm outline-none focus:border-ring"
      />

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <input
          type="number"
          min={0}
          max={balance ?? undefined}
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-7 pr-3 text-sm outline-none focus:border-ring"
        />
      </div>

      {submitted && address && !isValidAddress && (
        <p className="text-sm text-destructive">
          Enter a valid Polygon address
        </p>
      )}

      {submitted && amount && !isNaN(parsedAmount) && parsedAmount <= 0 && (
        <p className="text-sm text-destructive">Amount must be greater than 0</p>
      )}

      {submitted && amount && balance !== null && parsedAmount > balance && (
        <p className="text-sm text-destructive">Exceeds available balance</p>
      )}

      {submitted && !confirmed && (
        <p className="text-sm text-destructive">Please confirm the wallet supports Polygon</p>
      )}

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked === true)}
          className="mt-0.5"
        />
        I confirm this wallet can receive funds on Polygon
      </label>

      <Button
        onClick={() => {
          setSubmitted(true);
          if (!isValidAmount || !isValidAddress || !confirmed) return;
          onWithdraw(address, parsedAmount);
        }}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Withdrawing...
          </>
        ) : (
          "Withdraw"
        )}
      </Button>
    </div>
  );
}
