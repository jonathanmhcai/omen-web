import { Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_BASE } from "../../lib/constants";
import { traderLabel } from "../../lib/trader";
import TraderPnlChart from "../../components/TraderPnlChart";
import TraderStats from "../../components/TraderStats";
import TraderHighlights from "../../components/TraderHighlights";
import SiteChrome from "../../components/SiteChrome";
import SocialPill from "../../components/SocialPill";

/**
 * Single trader profile. `name` is a Polymarket username (or an address) —
 * the server's /traders/:handle resolves either. Minimal for now: pfp,
 * username, and an outbound link to the Polymarket profile. Stats land
 * here later.
 */

type Trader = {
  wallet: string;
  name: string | null;
  pseudonym: string | null;
  profileImage: string | null;
  xUsername: string | null;
  substack: string | null;
  youtube: string | null;
  description: string | null;
  categories: string[];
  xVerifiedType: "blue" | "business" | "government" | null;
};

async function getTrader(handle: string): Promise<Trader | null> {
  try {
    const res = await fetch(`${API_BASE}/traders/${encodeURIComponent(handle)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { trader?: Trader };
    return data.trader ?? null;
  } catch {
    return null;
  }
}

/** Clean hostname for display — strips protocol, www, and trailing slash
 *  (https://www.prophetnotes.com/ → prophetnotes.com). */
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

/** YouTube channel label — the @handle when present, else the clean host. */
function youtubeLabel(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/^\/|\/$/g, "");
    return path.startsWith("@") ? path : hostLabel(url);
  } catch {
    return hostLabel(url);
  }
}

export default async function TraderPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const trader = await getTrader(name);
  if (!trader) notFound();

  return (
    <SiteChrome>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-6 px-6 pb-28 pt-4 text-left">
        <Link href="/traders" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to directory
        </Link>

      {trader.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trader.profileImage}
          alt={traderLabel(trader)}
          className="h-24 w-24 rounded-full bg-muted object-cover"
        />
      ) : (
        <div className="h-24 w-24 rounded-full bg-muted" />
      )}

      <h1 className="text-2xl font-semibold leading-none">{traderLabel(trader)}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <SocialPill
          href={`https://polymarket.com/profile/${trader.wallet}`}
          label={trader.name || "Polymarket"}
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/polymarket-icon.png"
              alt="Polymarket"
              width={16}
              height={16}
              className="h-3.5 w-3.5 rounded-[3px]"
            />
          }
        />

        {trader.xUsername && (
          <SocialPill
            href={`https://x.com/${trader.xUsername}`}
            label={`@${trader.xUsername}`}
            icon={
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-label="X logo">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            }
          />
        )}

        {trader.substack && (
          <SocialPill
            href={trader.substack}
            label={hostLabel(trader.substack)}
            icon={
              <svg viewBox="0 0 24 24" className="h-3 w-3" aria-label="Substack logo">
                <path
                  fill="#FF6719"
                  d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"
                />
              </svg>
            }
          />
        )}

        {trader.youtube && (
          <SocialPill
            href={trader.youtube}
            label={youtubeLabel(trader.youtube)}
            icon={
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-label="YouTube logo">
                <path
                  fill="#FF0000"
                  d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                />
                <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            }
          />
        )}
      </div>

      <TraderStats handle={trader.wallet} categories={trader.categories} />

      {trader.description && (
        <div className="w-full rounded-lg border bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI-generated
          </div>
          <p className="text-sm leading-relaxed text-foreground">{trader.description}</p>
        </div>
      )}

      <section className="w-full pt-2">
        <h2 className="mb-1 text-sm text-muted-foreground">Profit / Loss</h2>
        <TraderPnlChart handle={trader.wallet} />
      </section>

      <TraderHighlights
        handle={trader.wallet}
        trader={{
          name: trader.name,
          profileImage: trader.profileImage,
          xUsername: trader.xUsername,
          verifiedType: trader.xVerifiedType,
        }}
      />
      </main>
    </SiteChrome>
  );
}
