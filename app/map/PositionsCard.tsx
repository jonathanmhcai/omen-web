"use client";

import { PolymarketPosition, PositionsResponse } from "../hooks/usePositions";

function formatDollars(n: number): string {
  return "$" + n.toFixed(2);
}

function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(1) + "%";
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function PositionRow({ position }: { position: PolymarketPosition }) {
  const pnlColor =
    position.cashPnl > 0
      ? "text-emerald-600"
      : position.cashPnl < 0
        ? "text-red-600"
        : "text-zinc-500";

  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      {position.icon && (
        <img
          src={position.icon}
          alt=""
          className="mt-0.5 h-6 w-6 shrink-0 rounded"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-zinc-900">
          {position.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
              position.outcome.toLowerCase() === "yes"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {position.outcome}
          </span>
          <span className="text-[11px] text-zinc-500">
            {formatDollars(position.initialValue)} cost
          </span>
          {position.endDate && (
            <span className="text-[11px] text-zinc-400">
              {formatDate(position.endDate)}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-medium text-zinc-900">
          {formatDollars(position.currentValue)}
        </p>
        <p className={`text-[11px] font-medium ${pnlColor}`}>
          {formatPercent(position.percentPnl)}
        </p>
      </div>
    </div>
  );
}

interface PositionsCardProps {
  data: PositionsResponse | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export default function PositionsCard({ data, loading, error, onClose }: PositionsCardProps) {
  const positions = data?.positions ?? [];
  const totalValue = data?.totalValue ?? 0;

  return (
    <div className="w-80 rounded-lg bg-white/90 backdrop-blur-sm shadow-lg border border-black/5 overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-zinc-900">Positions</h3>
          {!loading && positions.length > 0 && (
            <span className="text-xs font-medium text-emerald-600">
              {formatDollars(totalValue)}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-zinc-400 hover:text-zinc-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
          </div>
        )}

        {!loading && error && (
          <p className="px-3 py-6 text-center text-xs text-red-500">{error}</p>
        )}

        {!loading && !error && positions.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-zinc-400">
            No open positions
          </p>
        )}

        {!loading &&
          !error &&
          positions.map((p) => (
            <PositionRow key={p.asset} position={p} />
          ))}
      </div>
    </div>
  );
}
