import { PolymarketMarket } from "./types";

export function parseJSONStringArray(s: string | undefined | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function parseJSONNumberArray(s: string | undefined | null): number[] {
  return parseJSONStringArray(s).map(Number);
}

export interface MarketWithYes {
  market: PolymarketMarket;
  outcomes: string[];
  prices: number[];
  tokenIds: string[];
  yesIndex: number;
  yesPrice: number;
}

export function withYesProbability(market: PolymarketMarket): MarketWithYes | null {
  const outcomes = parseJSONStringArray(market.outcomes);
  const prices = parseJSONNumberArray(market.outcomePrices);
  const tokenIds = parseJSONStringArray(market.clobTokenIds);
  if (outcomes.length === 0 || prices.length !== outcomes.length) return null;

  const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  const yesIndex = yesIdx >= 0 ? yesIdx : 0;
  const yesPrice = prices[yesIndex] ?? 0;
  return { market, outcomes, prices, tokenIds, yesIndex, yesPrice };
}

export function isMarketActionable(m: PolymarketMarket): boolean {
  return !!m.active && !m.closed && !m.archived;
}

export function getMarketsSortedByYesProbability(
  markets: PolymarketMarket[]
): MarketWithYes[] {
  return markets
    .map(withYesProbability)
    .filter((x): x is MarketWithYes => x !== null)
    .sort((a, b) => b.yesPrice - a.yesPrice);
}

export function getMarketDisplayLabel(market: PolymarketMarket): string {
  return market.groupItemTitle || market.question || `Market ${market.id}`;
}
