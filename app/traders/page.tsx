import Link from "next/link";
import { API_BASE } from "../lib/constants";
import { traderLabel } from "../lib/trader";
import TraderSearch from "../components/TraderSearch";
import SiteChrome from "../components/SiteChrome";

/**
 * Trader directory — a search bar plus a 6-column grid of pfp + username,
 * fed by the server's enriched `/traders` endpoint. Each tile links to the
 * trader's profile at `/traders/<name>`.
 */

type Trader = {
  wallet: string;
  name: string | null;
  pseudonym: string | null;
  profileImage: string | null;
};

async function getTraders(): Promise<Trader[]> {
  try {
    // Cache the (currently uncached, 138-call) enrichment at the edge so
    // the page doesn't re-hit it on every navigation. Short revalidate
    // keeps profiles reasonably fresh until the server grows its own cache.
    const res = await fetch(`${API_BASE}/traders`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { traders?: Trader[] };
    return data.traders ?? [];
  } catch {
    return [];
  }
}


export default async function TradersPage() {
  const traders = await getTraders();

  return (
    <SiteChrome>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-6 pb-28 pt-4 text-center">
        <TraderSearch />

      <div className="grid w-full grid-cols-6 gap-4">
        {traders.map((t) => (
          <Link
            key={t.wallet}
            href={`/traders/${encodeURIComponent(t.name ?? t.wallet)}`}
            className="group relative z-0 flex flex-col items-center gap-1.5 hover:z-10"
          >
            {t.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.profileImage}
                alt={traderLabel(t)}
                className="h-14 w-14 rounded-full bg-muted object-cover transition-transform duration-200 ease-out group-hover:scale-110"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-muted transition-transform duration-200 ease-out group-hover:scale-110" />
            )}
            <span className="w-full truncate text-xs text-muted-foreground transition-colors group-hover:text-foreground">
              {traderLabel(t)}
            </span>
          </Link>
        ))}
        </div>
      </main>
    </SiteChrome>
  );
}
