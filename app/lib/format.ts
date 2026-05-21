/** "$1.2M" / "$45K" / "$321" — short volume notation. */
export function formatShortDollars(n: number | string | undefined): string {
  const v = typeof n === "string" ? Number(n) : n ?? 0;
  if (!isFinite(v)) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
}

/** "$1,234,567" — full grouped USD with no cents. */
export function formatDollars(n: number): string {
  if (!isFinite(n)) return "$0";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** "Jan 5, 2026" — date-only (no time) for event metadata rows. Empty
 *  string when the input isn't parseable so callers can fall back. */
export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
