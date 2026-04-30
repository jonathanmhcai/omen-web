"use client";

interface MetricTileProps {
  label: string;
  value: string;
  sublabel?: string;
  deltaPercent?: number | null;
  loading?: boolean;
}

function formatDelta(pct: number): string {
  const abs = Math.abs(pct);
  const formatted = abs >= 100 ? abs.toFixed(0) : abs.toFixed(1);
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${formatted}%`;
}

export default function MetricTile({
  label,
  value,
  sublabel,
  deltaPercent,
  loading,
}: MetricTileProps) {
  const deltaClass =
    deltaPercent == null || deltaPercent === 0
      ? "text-zinc-500 dark:text-zinc-400"
      : deltaPercent > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/[.08] p-6 dark:border-white/[.145]">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold tabular-nums">{value}</p>
          {deltaPercent != null && (
            <span className={`text-xs font-medium tabular-nums ${deltaClass}`}>
              {formatDelta(deltaPercent)}
            </span>
          )}
        </div>
      )}
      {sublabel && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{sublabel}</p>
      )}
    </div>
  );
}
