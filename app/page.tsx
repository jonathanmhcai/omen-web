import type { Metadata } from "next";
import { Suspense } from "react";
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

type Props = { searchParams: Promise<{ user?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
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
    brief.payload.sections.flatMap((s) => s.stories).find((st) => st.imageUrl)?.imageUrl ?? "/og";
  return {
    title,
    description,
    robots,
    openGraph: { title, description, images: [{ url: image }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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
          <Suspense key={user} fallback={<BriefSkeleton user={user} />}>
            <BriefResult user={user} />
          </Suspense>
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
        <TrackOnMount event="brief_generated" properties={{ handle: user, found: false }} />
        <p className="mt-6 text-sm text-muted-foreground">
          Couldn&apos;t find a Polymarket profile for &ldquo;{user}&rdquo; — check the username, or
          paste a 0x wallet address.
        </p>
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
        <div className="daily-brief-doc" dangerouslySetInnerHTML={{ __html: brief.html }} />
      </div>
    </>
  );
}

function BriefSkeleton({ user }: { user: string }) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Building {user}&apos;s brief — this takes a few seconds…
      </p>
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
