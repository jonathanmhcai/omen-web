import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import SiteChrome from "./components/SiteChrome";
import { TrackOnMount } from "./components/PostHogTracking";
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

// Known-good examples from the trader directory's seed list (Polymarket
// usernames, not X handles) — all verified to resolve and produce briefs
// with stories.
const EXAMPLE_TRADERS = ["prophet.notes", "MEPP", "ImJustKen", "mr.ozi"] as const;

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
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Daily brief</h1>
          <p className="text-muted-foreground">
            Daily news on your Polymarket positions.
          </p>
        </div>
        <div className="mt-6">
          {/* Keyed by user so soft navigation (e.g. the Try link) remounts the
              input with the new value instead of keeping stale state. */}
          <BriefLookup key={user ?? ""} initial={user ?? ""} />
        </div>
        {user ? (
          <Suspense key={user} fallback={<BriefSkeleton user={user} />}>
            <BriefResult user={user} />
          </Suspense>
        ) : (
          <>
            <SubscriptionStatus />
            <p className="mt-8 text-sm text-muted-foreground">
            <Sparkles className="mr-1.5 inline-block h-3.5 w-3.5 align-[-2px]" />
            Try{" "}
            {EXAMPLE_TRADERS.map((handle, i) => (
              <span key={handle}>
                {i > 0 && (i === EXAMPLE_TRADERS.length - 1 ? ", or " : ", ")}
                <Link
                  href={`/?user=${encodeURIComponent(handle)}`}
                  className="underline hover:text-foreground"
                >
                  {handle}
                </Link>
              </span>
            ))}
            </p>
          </>
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
        <p className="mt-8 text-sm text-muted-foreground">
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
    <div className="mt-8 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Building {user}&apos;s brief — this takes a few seconds…
      </p>
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
