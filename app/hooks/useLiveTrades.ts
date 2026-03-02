import { useEffect, useRef, useState } from "react";

export interface LiveTrade {
  id: string;
  title: string;
  outcome: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  usdValue: number;
  timestamp: number;
  traderName: string;
  conditionId: string;
  eventSlug: string;
}

const WS_URL = "wss://ws-live-data.polymarket.com";
const MAX_TRADES = 200;
const PING_INTERVAL = 5_000;
const STALE_TIMEOUT = 60_000;
const RECONNECT_BASE = 1_000;
const RECONNECT_MAX = 30_000;

/** Return false to exclude a trade. Checked at ingestion time. */
export type TradeFilter = (trade: LiveTrade) => boolean;

export function useLiveTrades(enabled: boolean, filter?: TradeFilter) {
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  const [connected, setConnected] = useState(false);
  const tradesRef = useRef<LiveTrade[]>([]);
  const filterRef = useRef<TradeFilter | undefined>(filter);
  filterRef.current = filter;

  useEffect(() => {
    if (!enabled) {
      tradesRef.current = [];
      setTrades([]);
      setConnected(false);
      return;
    }

    let active = true;
    let ws: WebSocket | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let staleTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let flushId: ReturnType<typeof requestAnimationFrame> | null = null;
    let attempt = 0;
    const pending: LiveTrade[] = [];

    function teardown() {
      if (pingInterval) clearInterval(pingInterval);
      if (staleTimeout) clearTimeout(staleTimeout);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (flushId) cancelAnimationFrame(flushId);
      pingInterval = null;
      staleTimeout = null;
      reconnectTimeout = null;
      flushId = null;

      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
        ws = null;
      }
    }

    function resetStale() {
      if (staleTimeout) clearTimeout(staleTimeout);
      staleTimeout = setTimeout(() => {
        if (!active) return;
        teardown();
        connect();
      }, STALE_TIMEOUT);
    }

    function connect() {
      if (!active) return;
      teardown();

      const socket = new WebSocket(WS_URL);
      ws = socket;

      socket.onopen = () => {
        if (!active) return;
        setConnected(true);
        attempt = 0;

        socket.send(JSON.stringify({
          action: "subscribe",
          subscriptions: [{ topic: "activity", type: "trades" }],
        }));

        pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, PING_INTERVAL);

        resetStale();
      };

      socket.onmessage = (event) => {
        if (!active) return;
        const raw = event.data;
        if (raw === "pong" || raw === "connected") return;

        resetStale();

        try {
          const msg = JSON.parse(raw);
          if (msg.type !== "trades" || !msg.payload) return;

          const p = msg.payload;
          const trade: LiveTrade = {
            id: p.transactionHash || `${p.conditionId}-${Date.now()}-${Math.random()}`,
            title: p.title || "",
            outcome: p.outcome || "",
            side: p.side === "SELL" ? "SELL" : "BUY",
            price: Number(p.price) || 0,
            size: Number(p.size) || 0,
            usdValue: (Number(p.price) || 0) * (Number(p.size) || 0),
            timestamp: typeof p.timestamp === "number"
              ? (p.timestamp < 1e12 ? p.timestamp * 1000 : p.timestamp)
              : Date.now(),
            traderName: p.name || p.pseudonym || "",
            conditionId: p.conditionId || "",
            eventSlug: p.eventSlug || p.slug || "",
          };

          if (filterRef.current && !filterRef.current(trade)) return;
          pending.push(trade);
        } catch {
          return;
        }

        if (!flushId) {
          flushId = requestAnimationFrame(() => {
            flushId = null;
            if (!active || pending.length === 0) return;

            const batch = pending.splice(0);
            const updated = [...batch.reverse(), ...tradesRef.current].slice(0, MAX_TRADES);
            tradesRef.current = updated;
            setTrades(updated);
          });
        }
      };

      socket.onclose = () => {
        if (!active) return;
        setConnected(false);
        const base = Math.min(RECONNECT_BASE * Math.pow(2, attempt), RECONNECT_MAX);
        const jitter = base * (0.5 + Math.random() * 0.5);
        attempt++;
        reconnectTimeout = setTimeout(connect, jitter);
      };

      socket.onerror = () => {
        // onclose fires after this
      };
    }

    connect();

    return () => {
      active = false;
      teardown();
      setConnected(false);
    };
  }, [enabled]);

  return { trades, connected };
}
