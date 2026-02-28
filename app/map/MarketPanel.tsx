"use client";

import { useState } from "react";
import type { IDockviewPanelProps } from "dockview";
import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
import { PolymarketMarket } from "../lib/types";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { usePositions, PolymarketPosition } from "../hooks/usePositions";
import { useMarket } from "../hooks/useMarket";
import { useAuthUser } from "../hooks/useAuthUser";

function parseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

interface MarketPanelParams {
  conditionId: string;
  outcomeIndex?: number;
}

function OutcomeRow({
  outcome,
  tokenID,
  market,
  position,
  conditionId,
}: {
  outcome: string;
  tokenID: string;
  market: PolymarketMarket;
  position: PolymarketPosition | undefined;
  conditionId: string;
}) {
  const { login } = usePrivy();
  const { user: authUser } = useAuthUser();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellShares, setSellShares] = useState("");
  const { createOrder, loading, error } = useCreateOrder(conditionId);

  const parsedBuy = parseFloat(buyAmount);
  const isBuyValid = !isNaN(parsedBuy) && parsedBuy >= 1;

  const parsedSell = parseFloat(sellShares);
  const isSellValid = position && !isNaN(parsedSell) && parsedSell > 0 && parsedSell <= position.size;

  const handleBuy = async () => {
    if (!isBuyValid || !tokenID) return;
    try {
      await createOrder({
        tokenID,
        side: "BUY",
        amount: parsedBuy,
        price: 1 - market.orderPriceMinTickSize,
        options: {
          tickSize: market.orderPriceMinTickSize,
          negRisk: market.negRisk,
        },
        orderType: "FOK",
      });
      toast.success(`Bought $${parsedBuy.toFixed(2)} of ${outcome}`);
    } catch {
      // error state handled by hook
    }
  };

  const handleSell = async () => {
    if (!isSellValid || !tokenID) return;
    try {
      await createOrder({
        tokenID,
        side: "SELL",
        amount: parsedSell,
        price: market.orderPriceMinTickSize,
        options: {
          tickSize: market.orderPriceMinTickSize,
          negRisk: market.negRisk,
        },
        orderType: "FOK",
      });
      toast.success(`Sold ${parsedSell.toFixed(2)} shares of ${outcome}`);
    } catch {
      // error state handled by hook
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          Amount (USD)
        </label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={buyAmount}
          onChange={(e) => setBuyAmount(e.target.value)}
          placeholder="1.00"
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none mb-1"
          disabled={loading}
        />
        {buyAmount && !isBuyValid && (
          <p className="text-xs text-red-500 mb-1">Minimum amount is $1</p>
        )}
        <button
          onClick={authUser ? handleBuy : login}
          disabled={authUser ? (!isBuyValid || loading) : false}
          className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : authUser ? "Buy" : "Log in to Buy"}
        </button>
      </div>

      {position && (
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Position: {position.size.toFixed(2)} shares (${position.currentValue.toFixed(2)})
          </p>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-foreground">
              Shares to sell
            </label>
            <button
              onClick={() => setSellShares(position.size.toString())}
              className="text-xs text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              Max
            </button>
          </div>
          <input
            type="number"
            min="0"
            max={position.size}
            step="0.01"
            value={sellShares}
            onChange={(e) => setSellShares(e.target.value)}
            placeholder={position.size.toFixed(2)}
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none mb-1"
            disabled={loading}
          />
          {sellShares && !isSellValid && (
            <p className="text-xs text-red-500 mb-1">
              Enter between 0 and {position.size.toFixed(2)} shares
            </p>
          )}
          <button
            onClick={handleSell}
            disabled={!isSellValid || loading}
            className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Sell"}
          </button>
        </div>
      )}
    </div>
  );
}

function RulesSection({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-3">
      <p
        className={`text-[11px] text-muted-foreground whitespace-pre-line ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {description}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] text-muted-foreground hover:text-foreground mt-0.5"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

export default function MarketPanel({
  params,
}: IDockviewPanelProps<MarketPanelParams>) {
  const { conditionId, outcomeIndex } = params;
  const [selectedIndex, setSelectedIndex] = useState(outcomeIndex ?? 0);
  const { data: market, loading: marketLoading, error: marketError } = useMarket(conditionId);
  const { data: positionsData } = usePositions();
  const positions = positionsData?.positions ?? [];

  if (marketLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (marketError || !market) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-5">
        <p className="text-xs text-red-500">{marketError || "Market not found"}</p>
      </div>
    );
  }

  const outcomes: string[] = parseJSON(market.outcomes, []);
  const prices: string[] = parseJSON(market.outcomePrices, []);
  const tokenIds: string[] = parseJSON(market.clobTokenIds, []);

  return (
    <div className="flex h-full flex-col bg-background p-5 overflow-y-auto">
      <div className="flex items-start gap-3 mb-3">
        {market.image && (
          <img
            src={market.image}
            alt=""
            className="h-10 w-10 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{market.question}</p>
          {market.endDate && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Ends {new Date(market.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {market.description && <RulesSection description={market.description} />}

      <div className="flex rounded border border-border mb-4">
        {outcomes.map((outcome, i) => {
          const pct = Math.round(parseFloat(prices[i] || "0") * 100);
          const active = i === selectedIndex;
          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {outcome} {pct}¢
            </button>
          );
        })}
      </div>

      <OutcomeRow
        key={selectedIndex}
        outcome={outcomes[selectedIndex]}
        tokenID={tokenIds[selectedIndex]}
        market={market}
        position={positions.find((p) => p.asset === tokenIds[selectedIndex])}
        conditionId={conditionId}
      />
    </div>
  );
}
