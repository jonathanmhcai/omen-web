import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import SiteChrome from "./components/SiteChrome";
import { TrackOnMount } from "./components/PostHogTracking";
import BriefHero from "./components/daily-brief/BriefHero";
import BriefLookup from "./components/daily-brief/BriefLookup";
import SubscribeCard from "./components/daily-brief/SubscribeCard";
import SubscriptionStatus from "./components/daily-brief/SubscriptionStatus";
import { API_BASE } from "./lib/constants";

/**
 * Home — the daily brief. `?user=<handleOr0x>` renders that trader's brief:
 * the server returns the email body pre-rendered by the SAME react-email
 * component the daily email uses, so this page can never drift from the
 * email design; we just inject the fragment. No param renders the lookup
 * landing. Generation takes a few seconds cold, so the result streams in
 * behind a skeleton.
 *
 * `/daily-brief` redirects here (see next.config.ts) — that path is in the
 * wild in sent emails and the unsubscribe page, and query params ride along.
 */

/** Lean slice of the server's DailyBriefPayload — only what the page and
 *  metadata read; the design arrives as pre-rendered html. */
type BriefResponse = {
  payload: {
    subject: string;
    intro: string;
    sections: { stories: { imageUrl: string | null }[] }[];
    stats: {
      wallet: string;
      positionCount: number;
      distinctStoryCount: number;
      sectionCount: number;
    };
  };
  html: string;
};

async function getBrief(user: string): Promise<BriefResponse | null> {
  try {
    // no-store: the API owns caching (1h per handle + inflight dedupe);
    // stacking Next's data cache on top would double the staleness window.
    const res = await fetch(
      `${API_BASE}/daily-brief/preview?handle=${encodeURIComponent(user)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as BriefResponse;
  } catch {
    return null;
  }
}

/**
 * TEMP — flip to false when you're done looking. Freezes `?user=` on the
 * loading state so the skeleton can be inspected without racing a 3–5s
 * generation. Gated on NODE_ENV so leaving it true can't reach prod.
 */
const FORCE_SKELETON = false;
const forceSkeleton = FORCE_SKELETON && process.env.NODE_ENV !== "production";

type Props = { searchParams: Promise<{ user?: string }> };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { user } = await searchParams;
  // The bare landing is the site's front door: inherit the root layout's
  // title/OG and stay indexable. Per-trader briefs are shareable but not
  // indexable (link-unfurl bots still read the tags).
  if (!user) return {};

  const robots = { index: false, follow: false };
  const brief = await getBrief(user);
  if (!brief) return { title: "Daily brief", robots };

  const title = `Daily brief · ${user}`;
  const description = brief.payload.intro;
  // First story image anywhere in the brief; branded card as fallback.
  const image =
    brief.payload.sections.flatMap((s) => s.stories).find((st) => st.imageUrl)
      ?.imageUrl ?? "/og";
  return {
    title,
    description,
    robots,
    openGraph: { title, description, images: [{ url: image }] },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const { user } = await searchParams;
  return (
    <SiteChrome>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <BriefHero>
          {/* Keyed by user so soft navigation (e.g. the Try link) remounts the
              search, reseeding it with whichever brief is on screen. */}
          <BriefLookup key={user ?? ""} initial={user ?? ""} />
        </BriefHero>
        {user ? (
          forceSkeleton ? (
            <BriefSkeleton />
          ) : (
            <Suspense key={user} fallback={<BriefSkeleton />}>
              <BriefResult user={user} />
            </Suspense>
          )
        ) : (
          <SubscriptionStatus />
        )}
      </main>
    </SiteChrome>
  );
}

async function BriefResult({ user }: { user: string }) {
  const brief = await getBrief(user);
  if (!brief) {
    return (
      <>
        <TrackOnMount
          event="brief_generated"
          properties={{ handle: user, found: false }}
        />
        {/* Same card shape as the subscribe callout that would sit here on a
            hit, so a miss lands in the layout rather than replacing it with
            a loose sentence. */}
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
          <SearchX className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-sm font-semibold">
              No Polymarket profile for &ldquo;{user}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground">
              Check the username, or paste a 0x wallet address.
            </p>
          </div>
        </div>
      </>
    );
  }
  const { stats } = brief.payload;
  return (
    // White surface regardless of theme: the brief is a preview of the email,
    // which is a light-styled document. `daily-brief-doc` scopes the
    // preflight un-reset (see globals.css).
    <>
      <TrackOnMount
        event="brief_generated"
        properties={{
          handle: user,
          found: true,
          positions: stats.positionCount,
          stories: stats.distinctStoryCount,
          sections: stats.sectionCount,
        }}
      />
      <SubscribeCard handle={user} />
      <div className="mt-6 rounded-xl border bg-white p-4 sm:p-6">
        <div
          className="daily-brief-doc"
          dangerouslySetInnerHTML={{ __html: brief.html }}
        />
      </div>
    </>
  );
}

/**
 * Stands in for BriefResult at its exact position and shape: the subscribe
 * callout, then the white document with a date line, intro, and market
 * sections. No "building…" copy — a skeleton that matches what lands says
 * it better, and the wait then has no text to re-read.
 *
 * Two bar tones, because the two surfaces differ: `foreground/10` on the
 * theme-following card (visible on either ground, unlike `bg-muted`, which
 * is near-white on a white card), `black/10` inside the document, which is
 * white in both themes. Both land on the same grey in light mode, so the
 * two blocks read as one skeleton.
 */
function BriefSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 shrink-0 rounded-full bg-foreground/10" />
          <div className="flex w-full flex-col gap-2">
            <div className="h-3.5 w-[60%] rounded bg-foreground/10" />
            <div className="h-3 w-[42%] rounded bg-foreground/10" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4 sm:p-6">
        <div className="h-2.5 w-44 rounded bg-black/10" />
        <div className="mt-4 flex flex-col gap-2">
          <div className="h-3.5 w-full rounded bg-black/10" />
          <div className="h-3.5 w-[78%] rounded bg-black/10" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mt-4 rounded-lg bg-[#f7f7f8] p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-black/10" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-[70%] rounded bg-black/10" />
                <div className="h-3 w-[45%] rounded bg-black/10" />
              </div>
            </div>
            <div className="mt-2.5 rounded-lg border border-[#e2e8f0] bg-white p-3">
              <div className="h-3 w-[85%] rounded bg-black/10" />
              <div className="mt-2 h-3 w-[60%] rounded bg-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
