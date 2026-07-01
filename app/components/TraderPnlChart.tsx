"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_BASE } from "../lib/constants";
import { usd } from "../lib/trader";
import LoadingDots from "./LoadingDots";

/**
 * Realized+unrealized PnL chart for a trader, from the server's
 * /traders/:handle/pnl proxy of Polymarket's user-pnl series. Defaults to
 * the ALL range; the toggle re-fetches per range (each is a single request,
 * server-cached). Colored green/red by the latest value's sign.
 */

type PnlPoint = { t: number; p: number };

const RANGES: { key: string; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "all", label: "ALL" },
];

export default function TraderPnlChart({ handle }: { handle: string }) {
  const [range, setRange] = useState("all");
  const [points, setPoints] = useState<PnlPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/traders/${encodeURIComponent(handle)}/pnl?range=${range}`
        );
        const data = res.ok ? ((await res.json()) as { points?: PnlPoint[] }) : { points: [] };
        if (live) setPoints(data.points ?? []);
      } catch {
        if (live) setPoints([]);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [handle, range]);

  const last = points.length ? points[points.length - 1].p : 0;
  const up = last >= 0;
  const color = up ? "#16a34a" : "#dc2626";

  const fmtDate = useMemo(
    () => (t: number) =>
      new Date(t * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    []
  );

  return (
    <div className="w-full rounded-lg border p-4">
        <div className="mb-3 flex justify-end gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                range === r.key
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="h-48 w-full">
        {points.length >= 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={fmtDate}
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={usd}
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="2 2" />
              <Tooltip
                formatter={(v) => [usd(Number(v)), "PnL"]}
                labelFormatter={(t) => new Date(Number(t) * 1000).toLocaleDateString()}
                contentStyle={{ fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="p"
                stroke={color}
                strokeWidth={2}
                fill="url(#pnlFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            {loading ? (
              <LoadingDots />
            ) : (
              <span className="text-sm text-muted-foreground">No PnL data</span>
            )}
          </div>
        )}
        </div>
      </div>
  );
}
