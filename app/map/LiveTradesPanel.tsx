"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IDockviewPanelProps } from "dockview";
import { useMapPageContext } from "./MapPageContext";
import { useLiveTrades, type LiveTrade } from "../hooks/useLiveTrades";
import { matchTradeLocation } from "./geo";
import {
  createTradeFilter,
  DEFAULT_MIN_SIZE,
  MIN_SIZE_OPTIONS,
} from "../lib/tradeFilters";

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 5) return "now";
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h`;
}

function formatUsd(n: number): string {
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  return "$" + n.toFixed(2);
}

function TradeRow({ trade }: { trade: LiveTrade }) {
  const ctx = useMapPageContext();
  const isBuy = trade.side === "BUY";
  const isLarge = trade.usdValue >= 500;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "28px auto 1fr auto auto",
        alignItems: "center",
        gap: 6,
      }}
      className={`px-3 py-1.5 cursor-pointer hover:bg-muted/50 border-b border-border/50 ${
        isLarge ? "bg-muted/30" : ""
      }`}
      onClick={() => ctx.onMarket(trade.conditionId, { title: trade.title })}
    >
      <span className="text-[10px] text-muted-foreground tabular-nums truncate">
        {timeAgo(trade.timestamp)}
      </span>
      <span
        className={`text-[10px] font-medium whitespace-nowrap ${
          isBuy ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {trade.side}
      </span>
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="text-xs text-foreground">
        {trade.title}
      </span>
      <span
        className={`rounded px-1 py-0.5 text-[10px] font-medium whitespace-nowrap ${
          isBuy
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        }`}
      >
        {trade.outcome}
      </span>
      <span
        className={`text-xs font-medium tabular-nums whitespace-nowrap text-right ${
          isBuy ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        } ${isLarge ? "font-bold" : ""}`}
        style={{ minWidth: 50 }}
      >
        {formatUsd(trade.usdValue)}
      </span>
    </div>
  );
}

function formatMinSize(n: number): string {
  if (n === 0) return "All";
  if (n >= 1000) return "$" + (n / 1000) + "k";
  return "$" + n;
}

export default function LiveTradesPanel({}: IDockviewPanelProps) {
  const ctx = useMapPageContext();
  const [minSize, setMinSize] = useState(DEFAULT_MIN_SIZE);
  const filter = useCallback(createTradeFilter(minSize), [minSize]);
  const { trades, connected } = useLiveTrades(true, filter);
  const listRef = useRef<HTMLDivElement>(null);
  const isAtTopRef = useRef(true);
  const lastTradeCountRef = useRef(0);

  // Push map pings for new trades with matched locations
  useEffect(() => {
    const prev = lastTradeCountRef.current;
    if (trades.length <= prev) {
      lastTradeCountRef.current = trades.length;
      return;
    }
    const newCount = trades.length - prev;
    for (let i = 0; i < newCount; i++) {
      const trade = trades[i];
      const loc = matchTradeLocation(trade.title, trade.eventSlug);
      if (loc) {
        ctx.addTradePing(loc.lat, loc.lng, trade.usdValue);
      }
    }
    lastTradeCountRef.current = trades.length;
  }, [trades, ctx]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handler = () => {
      isAtTopRef.current = el.scrollTop < 10;
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (isAtTopRef.current && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [trades]);

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      {/* Connection status */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border text-[10px] text-muted-foreground">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            connected ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <span>{connected ? "Live" : "Connecting..."}</span>
        <span className="ml-auto flex items-center gap-2">
          <select
            value={minSize}
            onChange={(e) => setMinSize(Number(e.target.value))}
            className="bg-transparent text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5 cursor-pointer hover:text-foreground"
          >
            {MIN_SIZE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v === 0 ? "All sizes" : `≥ ${formatMinSize(v)}`}
              </option>
            ))}
          </select>
          {trades.length > 0 && (
            <span>{trades.length}</span>
          )}
        </span>
      </div>

      {/* Trade list */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {trades.length === 0 && connected && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          </div>
        )}

        {trades.length === 0 && !connected && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Connecting to trade feed...
          </p>
        )}

        {trades.map((trade, i) => (
          <TradeRow key={`${trade.id}-${i}`} trade={trade} />
        ))}
      </div>
    </div>
  );
}
