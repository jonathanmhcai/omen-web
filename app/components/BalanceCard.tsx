"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCashBalance } from "../hooks/useCashBalance";
import { useDepositAddresses } from "../hooks/useDepositAddresses";
import DepositModal from "./DepositModal";

/**
 * Cash balance + Deposit CTA card used by the desktop sidebar. The
 * mobile header inlines a compact balance + Deposit pair directly in
 * its top row (see `MobileNav#HeaderBalance`) — that surface needs
 * less chrome than the sidebar card. Skeleton appears after a 300ms
 * delay so a warm cache / fast network doesn't flash a loading state.
 */
export default function BalanceCard() {
  const { balance } = useCashBalance();
  const { data: depositData } = useDepositAddresses();
  const [showDeposit, setShowDeposit] = useState(false);

  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (balance != null) return;
    const t = setTimeout(() => setShowSkeleton(true), 300);
    return () => clearTimeout(t);
  }, [balance]);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            Cash balance
          </span>
          {balance != null ? (
            <span className="text-xl font-semibold">${balance.toFixed(2)}</span>
          ) : (
            <div
              className={cn(
                "h-7 w-24 rounded",
                showSkeleton && "animate-pulse bg-muted"
              )}
            />
          )}
        </div>
        <Button
          onClick={() => setShowDeposit(true)}
          disabled={!depositData?.addresses}
          className="w-full"
        >
          Deposit
        </Button>
      </div>

      {showDeposit && depositData?.addresses && (
        <DepositModal
          addresses={depositData.addresses}
          onClose={() => setShowDeposit(false)}
        />
      )}
    </>
  );
}
