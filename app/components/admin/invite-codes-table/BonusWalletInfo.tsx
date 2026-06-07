"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { API_BASE, SESSION_TOKEN_KEY } from "../../../lib/constants";
import { useCookieString } from "../../../hooks/useCookieString";

interface WalletBalances {
  address: string;
  usdce: string;
  pusd: string;
}

interface BonusWalletResponse {
  serverWallet: WalletBalances;
  depositAddress: { evm: string; svm: string; btc: string };
  depositNote: string;
}

function shortAddr(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtAmount(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function AddressRow({ label, addr }: { label: string; addr: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <Link
          href={`https://polygonscan.com/address/${addr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm hover:underline"
          title={addr}
        >
          {shortAddr(addr)}
        </Link>
        <button
          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => {
            navigator.clipboard.writeText(addr);
            toast("Address copied to clipboard");
          }}
          title="Copy address"
          aria-label="Copy address"
        >
          <Copy className="h-3 w-3" />
        </button>
      </span>
    </div>
  );
}

/**
 * Compact toolbar affordance surfacing the invite-bonus server wallet — its
 * address, pUSD balance (bonuses are paid in pUSD), and the Polymarket deposit
 * address you can fund with any asset to top it up. Funding ops live here so
 * an admin can check the balance without shelling into the server.
 */
export default function BonusWalletInfo() {
  const [data, setData] = useState<BonusWalletResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;

    fetch(`${API_BASE}/admin/invite-codes/bonus-wallet`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((body: BonusWalletResponse) => {
        if (!cancelled) {
          setData(body);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  const pusd = data ? fmtAmount(data.serverWallet.pusd) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/[.08] px-3 py-1.5 text-sm text-zinc-600 hover:bg-accent dark:border-white/[.145] dark:text-zinc-300"
          title="Invite-bonus server wallet"
        >
          <Wallet className="h-4 w-4" />
          <span className="tabular-nums">
            {error ? "—" : pusd != null ? `${pusd} pUSD` : "…"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">Invite-bonus server wallet</p>
            <p className="text-xs text-muted-foreground">
              Bonuses are paid in pUSD from this wallet.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : !data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-2">
                <AddressRow label="Server wallet" addr={data.serverWallet.address} />
                <span className="tabular-nums text-sm">
                  {fmtAmount(data.serverWallet.pusd)} pUSD
                  <span className="ml-2 text-xs text-muted-foreground">
                    {fmtAmount(data.serverWallet.usdce)} USDC.e
                  </span>
                </span>
              </div>

              <div className="border-t border-black/[.06] pt-2 dark:border-white/[.08]">
                <AddressRow
                  label="Polymarket deposit address (EVM)"
                  addr={data.depositAddress.evm}
                />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
