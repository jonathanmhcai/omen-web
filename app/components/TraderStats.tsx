"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/constants";
import { signedUsd, usd } from "../lib/trader";

/**
 * Cheap headline stats for a trader — first active, last active, current
 * value — from the server's /traders/:handle/stats. Each field is nullable
 * and renders "—" on a miss. A row of label/value pairs.
 */

type Stats = {
  firstActive: number | null;
  lastActive: number | null;
  value: number | null;
  totalPnl: number | null;
};

/** "Feb 2023" — concise first-active date. */
function monthYear(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/** "3h ago" / "5d ago" / "2mo ago" — last-active recency. */
function relTime(ts: number): string {
  const s = Date.now() / 1000 - ts;
  if (s < 3600) return "just now";
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-20 flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base tabular-nums">{value}</span>
    </div>
  );
}

export default function TraderStats({
  handle,
  categories = [],
}: {
  handle: string;
  categories?: string[];
}) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/traders/${encodeURIComponent(handle)}/stats`);
        if (res.ok && live) setStats((await res.json()) as Stats);
      } catch {
        // leave null → renders "—"
      }
    })();
    return () => {
      live = false;
    };
  }, [handle]);

  return (
    <div className="flex flex-wrap gap-x-10 gap-y-4">
      <Stat
        label="Total P/L"
        value={stats?.totalPnl != null ? signedUsd(stats.totalPnl) : "—"}
      />
      <Stat label="Portfolio value" value={stats?.value != null ? usd(stats.value) : "—"} />
      <Stat label="First active" value={stats?.firstActive ? monthYear(stats.firstActive) : "—"} />
      <Stat label="Last active" value={stats?.lastActive ? relTime(stats.lastActive) : "—"} />
      <Stat label="Categories" value={categories.length ? categories.join(", ") : "—"} />
    </div>
  );
}
