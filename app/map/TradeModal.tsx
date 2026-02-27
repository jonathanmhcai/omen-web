"use client";

import { useState } from "react";
import { PolymarketMarket } from "../lib/types";
import { useCreateOrder } from "../hooks/useCreateOrder";

interface TradeModalProps {
  market: PolymarketMarket;
  outcomeIndex: number;
  onClose: () => void;
}

function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str); } catch { return fallback; }
}

export default function TradeModal({ market, outcomeIndex, onClose }: TradeModalProps) {
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
      setTimeout(onClose, 1500);
    } catch {
      // error state handled by hook
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">Place Trade</h3>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:text-zinc-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-zinc-600 mb-3">{market.question}</p>

        <div className="flex items-center gap-2 mb-4">
          <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            {outcome}
          </span>
          <span className="text-xs text-zinc-500">{pct}¢</span>
        </div>

        {success ? (
          <div className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Order placed successfully!
          </div>
        ) : (
          <>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Amount (USD)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.00"
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none mb-1"
              disabled={loading}
            />
            {amount && !isValid && (
              <p className="text-xs text-red-500 mb-2">Minimum amount is $1</p>
            )}

            {error && (
              <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-700 mb-3">
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
    </div>
  );
}
