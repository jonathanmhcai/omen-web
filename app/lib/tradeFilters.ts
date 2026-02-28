import type { LiveTrade } from "../hooks/useLiveTrades";

/**
 * Slug keywords to exclude from the live trade feed.
 * Matched against eventSlug — add terms here to filter more categories.
 */
const EXCLUDED_SLUG_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "solana",
  "sol",
  "crypto",
  "xrp",
  "updown",
];

/** Pre-compiled regex for fast matching against slugs. */
const EXCLUDED_RE = new RegExp(EXCLUDED_SLUG_KEYWORDS.join("|"), "i");

/** Filters out trades whose eventSlug contains any excluded keyword. */
export function slugFilter(trade: LiveTrade): boolean {
  return !EXCLUDED_RE.test(trade.eventSlug);
}

/** Preset min-trade-size options (USD). */
export const MIN_SIZE_OPTIONS = [0, 100, 500, 1_000, 5_000, 10_000] as const;
export const DEFAULT_MIN_SIZE = 1_000;

/** Creates a combined filter: slug keywords + minimum USD size. */
export function createTradeFilter(minSize: number) {
  return (trade: LiveTrade): boolean => {
    if (!slugFilter(trade)) return false;
    if (trade.usdValue < minSize) return false;
    return true;
  };
}
