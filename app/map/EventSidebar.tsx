import { PolymarketEvent, PolymarketMarket } from "../lib/types";

function isMarketActionable(market: PolymarketMarket): boolean {
  if (market.closed) return false;
  if (!market.active) return false;
  if (market.archived) return false;
  return true;
}

interface EventSidebarProps {
  country: string;
  events: PolymarketEvent[];
  onClose: () => void;
  onTrade: (market: PolymarketMarket, outcomeIndex: number) => void;
}

function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str); } catch { return fallback; }
}

function getYesPrice(market: PolymarketMarket): number {
  const outcomes: string[] = parseJSON(market.outcomes, []);
  const prices: string[] = parseJSON(market.outcomePrices, []);
  const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  return yesIndex !== -1 ? parseFloat(prices[yesIndex] || "0") : 0;
}

function sortMarketsByYesPrice(markets: PolymarketMarket[]): PolymarketMarket[] {
  return [...markets].sort((a, b) => getYesPrice(b) - getYesPrice(a));
}

function MarketRow({ market, onTrade }: { market: PolymarketMarket; onTrade: (market: PolymarketMarket, outcomeIndex: number) => void }) {
  const outcomes: string[] = parseJSON(market.outcomes, []);
  const prices: string[] = parseJSON(market.outcomePrices, []);

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <p className="text-xs text-zinc-700 flex-1 min-w-0">{market.question}</p>
      <div className="flex shrink-0 gap-1.5">
        {outcomes.map((outcome, i) => {
          const price = parseFloat(prices[i] || "0");
          const pct = Math.round(price * 100);
          const isYes = outcome.toLowerCase() === "yes";
          return (
            <button
              key={i}
              onClick={() => onTrade(market, i)}
              className={`rounded px-2 py-1 text-xs font-medium ${
                isYes
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {outcome} {pct}¢
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EventSidebar({ country, events, onClose, onTrade }: EventSidebarProps) {
  const sorted = [...events].sort((a, b) => (b.volume24hr || 0) - (a.volume24hr || 0));
  return (
    <div className="absolute right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-black/10 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <h2 className="text-sm font-semibold capitalize text-zinc-900">{country}</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:text-zinc-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((e) => (
          <div
            key={e.id}
            className="border-b border-black/5 px-4 py-3"
          >
            <p className="text-sm font-medium text-zinc-900">{e.title}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
              <span>${Math.round(e.volume || 0).toLocaleString()} vol</span>
              <span>${Math.round(e.volume24hr || 0).toLocaleString()} 24h</span>
            </div>
            {e.markets && e.markets.length > 0 && (
              <div className="mt-2 flex flex-col gap-0.5">
                {sortMarketsByYesPrice(e.markets.filter(isMarketActionable)).map((m) => (
                  <MarketRow key={m.id} market={m} onTrade={onTrade} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-black/10 px-4 py-2 text-xs text-zinc-400">
        {events.length} events
      </div>
    </div>
  );
}
