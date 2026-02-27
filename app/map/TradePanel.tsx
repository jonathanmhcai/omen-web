"use client";

import { useState } from "react";
import type { IDockviewPanelProps } from "dockview";
import { useMapPageContext } from "./MapPageContext";
import { PolymarketMarket } from "../lib/types";
import { useCreateOrder } from "../hooks/useCreateOrder";

function parseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

interface TradePanelParams {
  market: PolymarketMarket;
  outcomeIndex: number;
}

export default function TradePanel({
  params,
}: IDockviewPanelProps<TradePanelParams>) {
  const ctx = useMapPageContext();
  const { market, outcomeIndex } = params;

  const outcomes: string[] = parseJSON(market.outcomes, []);
  const prices: string[] = parseJSON(market.outcomePrices, []);
  const tokenIds: string[] = parseJSON(market.clobTokenIds, []);

  const outcome = outcomes[outcomeIndex] ?? "Unknown";
  const price = parseFloat(prices[outcomeIndex] || "0");
  const pct = Math.round(price * 100);
  const tokenID = tokenIds[outcomeIndex];

  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const { createOrder, loading, error } = useCreateOrder();

  const parsedAmount = parseFloat(amount);
  const isValid = !isNaN(parsedAmount) && parsedAmount >= 1;

  const handleSubmit = async () => {
    if (!isValid || !tokenID) return;

    try {
      await createOrder({
        tokenID,
        side: "BUY",
        amount: parsedAmount,
        price: 1 - market.orderPriceMinTickSize,
        options: {
          tickSize: market.orderPriceMinTickSize,
          negRisk: market.negRisk,
        },
        orderType: "FOK",
      });
      setSuccess(true);
      setTimeout(() => ctx.onTradeClose(), 1500);
    } catch {
      // error state handled by hook
    }
  };

  return (
    <div className="flex h-full flex-col bg-background p-5">
      <p className="text-xs text-muted-foreground mb-3">{market.question}</p>

      <div className="flex items-center gap-2 mb-4">
        <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {outcome}
        </span>
        <span className="text-xs text-muted-foreground">{pct}¢</span>
      </div>

      {success ? (
        <div className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Order placed successfully!
        </div>
      ) : (
        <>
          <label className="block text-xs font-medium text-foreground mb-1">
            Amount (USD)
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.00"
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none mb-1"
            disabled={loading}
          />
          {amount && !isValid && (
            <p className="text-xs text-red-500 mb-2">Minimum amount is $1</p>
          )}

          {error && (
            <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300 mb-3">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="mt-3 w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Placing order..." : `Buy ${outcome}`}
          </button>
        </>
      )}
    </div>
  );
}
