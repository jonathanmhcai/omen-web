/** Shared trader display helpers — formatters + label. */

/** Display label: real name, else pseudonym, else a shortened wallet. */
export function traderLabel(t: {
  name: string | null;
  pseudonym?: string | null;
  wallet: string;
}): string {
  return t.name || t.pseudonym || `${t.wallet.slice(0, 6)}…${t.wallet.slice(-4)}`;
}

/** "34¢" — a 0–1 price as cents. */
export const cents = (p: number) => `${Math.round(p * 100)}¢`;

/** "$1,234" — whole USD; a minus for negatives, never a plus. */
export const usd = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;

/** "+$1,234" / "-$1,234" — always signed whole USD. */
export const signedUsd = (n: number) =>
  `${n < 0 ? "-" : "+"}$${Math.abs(Math.round(n)).toLocaleString()}`;

/** "+13%" / "-52%" — always signed whole percent. */
export const signedPct = (n: number) => `${n < 0 ? "-" : "+"}${Math.abs(Math.round(n))}%`;

/** "1,234 shares". */
export const shares = (n: number) => `${Math.round(n).toLocaleString()} shares`;
