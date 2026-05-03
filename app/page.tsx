"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "./hooks/useAuthUser";
import {
  Story,
  StoryMarket,
  StoryMarketOutcome,
  StoryTweet,
  TweetAuthorVerifiedType,
  useStories,
} from "./hooks/useStories";
import {
  TimeseriesInterval,
  TimeseriesPoint,
  TimeseriesResponse,
  timeseriesQueryOptions,
} from "./hooks/useTimeseries";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MarketSparkline } from "./components/MarketSparkline";
import AppShell from "./components/AppShell";
import RightSidebar from "./components/RightSidebar";
import { formatShortDollars } from "./lib/format";

export default function Page() {
  const { ready, authenticated } = usePrivy();
  const { user: authUser, loading: authLoading } = useAuthUser();
  const {
    stories,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStories();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const showSkeletons =
    !ready ||
    (authenticated && (authLoading || !authUser)) ||
    (isLoading && stories.length === 0);

  return (
    <AppShell rightSidebar={<RightSidebar />}>
      {showSkeletons ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StorySkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {stories.map((story) => (
            <StoryItem key={story.id} story={story} />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-8" />
      {isFetchingNextPage && <div className="py-4">Loading more…</div>}
      <ScrollToTopButton />
    </AppShell>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 left-[calc(50%+17rem)] z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-opacity hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}

function StorySkeleton() {
  return (
    <article className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-[16/9] w-full bg-muted" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <div className="h-5 w-11/12 rounded bg-muted" />
          <div className="h-5 w-2/3 rounded bg-muted" />
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-4 w-3/4 rounded bg-muted" />
          ))}
        </div>
      </div>
    </article>
  );
}

const VERIFIED_COLORS: Record<NonNullable<TweetAuthorVerifiedType>, string> = {
  blue: "#1DA1F2",
  business: "#E0A526",
  government: "#829AAF",
};

const VERIFIED_BADGE_PATH =
  "M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z";
const VERIFIED_CHECK_PATH =
  "M10.54 16.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z";

function VerifiedBadge({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d={VERIFIED_BADGE_PATH} fill={color} />
      <path d={VERIFIED_CHECK_PATH} fill="#fff" />
    </svg>
  );
}

const FALLBACK_AVATAR_COLORS = [
  "#E57373",
  "#4DB6AC",
  "#9575CD",
  "#FFB74D",
  "#4FC3F7",
  "#F06292",
  "#66BB6A",
  "#5C6BC0",
  "#FF8A65",
  "#26C6DA",
  "#BA68C8",
  "#AED581",
  "#7986CB",
  "#4DD0E1",
  "#EF5350",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function ExternalAuthorAvatar({
  avatarUrl,
  handle,
  displayName,
  verifiedType,
  size = 36,
  className,
}: {
  avatarUrl: string | null;
  handle: string;
  displayName: string | null;
  verifiedType: TweetAuthorVerifiedType;
  size?: number;
  className?: string;
}) {
  const isSquare = verifiedType === "business" || verifiedType === "government";
  const radius = isSquare ? size * 0.2 : size / 2;

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        style={{ width: size, height: size, borderRadius: radius }}
        className={cn("shrink-0", className)}
      />
    );
  }

  const seed = handle || displayName || "?";
  const bgColor =
    FALLBACK_AVATAR_COLORS[hashString(seed) % FALLBACK_AVATAR_COLORS.length];
  const initials = (displayName || handle || "?")
    .trim()
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bgColor,
      }}
    >
      <span style={{ fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}

function formatTimeAgoShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function formatRelativeAgo(iso: string): string {
  const short = formatTimeAgoShort(iso);
  return short === "now" ? "just now" : `${short} ago`;
}

const SPARKLINE_WIDTH = 80;
const SPARKLINE_HEIGHT = 24;

// A sparkline window sized so `matched_at` always falls inside it.
// The same window drives the spark, the % change baseline (option (b):
// first point of the timeseries), and the volume bucket — so all three
// numbers describe the same span.
type SparkWindow = {
  interval: TimeseriesInterval;
  fidelity: number;
  /** Short label suffixed to the % and volume display. */
  label: string;
  getVolume: (m: StoryMarket) => number | null;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

function pickSparkWindow(matchedAt: string): SparkWindow {
  const age = Date.now() - new Date(matchedAt).getTime();
  if (age < DAY_MS) {
    return { interval: "1d", fidelity: 60, label: "24h", getVolume: (m) => m.volume_24hr };
  }
  if (age < WEEK_MS) {
    return { interval: "1w", fidelity: 360, label: "1w", getVolume: (m) => m.volume_1wk };
  }
  if (age < MONTH_MS) {
    return { interval: "1m", fidelity: 1440, label: "1mo", getVolume: (m) => m.volume_1mo };
  }
  return { interval: "max", fidelity: 1440, label: "all", getVolume: (m) => m.volume_total };
}
const SUCCESS_COLOR = "#22c55e";
const ERROR_COLOR = "#ef4444";
const MUTED_COLOR = "#94a3b8";

function pickSparklineOutcome(
  outcomes: StoryMarketOutcome[]
): StoryMarketOutcome | undefined {
  const yes = outcomes.find((o) => o.outcome?.toLowerCase() === "yes");
  return yes ?? outcomes[0];
}

function formatPricePercent(p: number | null): string {
  if (p == null) return "—";
  return `${Math.round(p * 100)}%`;
}

function formatPercentSigned(num: number): string {
  if (isNaN(num)) return "0%";
  if (num > 0 && num < 1) return "+<1%";
  if (num > -1 && num < 0) return "-<1%";
  return `${num >= 0 ? "+" : ""}${num.toFixed()}%`;
}

function formatPointsMagnitude(num: number): string {
  const rounded = Math.round(Math.abs(num));
  if (rounded === 0 && num !== 0) return "<1%";
  return `${rounded}%`;
}

function MarketRow({ market, title }: { market: StoryMarket; title: string }) {
  const outcome = pickSparklineOutcome(market.outcomes);
  const tokenId = outcome?.token_id ?? "";
  const isYes = outcome?.outcome?.toLowerCase() === "yes";
  const outcomeLabel = !isYes && outcome?.outcome ? outcome.outcome : null;

  const window = pickSparkWindow(market.matched_at);

  const { data, isLoading } = useQuery<TimeseriesResponse>({
    ...timeseriesQueryOptions(tokenId, {
      interval: window.interval,
      fidelity: window.fidelity,
    }),
    enabled: !!tokenId,
  });
  const points: TimeseriesPoint[] = data?.history ?? [];

  const priceLabel = formatPricePercent(outcome?.price ?? null);

  // Diff is computed over the displayed window — first point of the
  // timeseries → current — so spark, diff and volume describe the same
  // span. (The `matched_at` marker is still drawn within that window.)
  const baseline = points[0]?.p ?? null;
  const change =
    outcome?.price != null && baseline != null
      ? (outcome.price - baseline) * 100
      : null;
  const changeLabel = change != null ? formatPointsMagnitude(change) : null;
  const ChangeArrow =
    change == null || change === 0
      ? ArrowRight
      : change > 0
        ? ArrowUpRight
        : ArrowDownRight;
  const changeColorClass =
    change == null
      ? "text-muted-foreground"
      : change > 0
        ? "text-green-500"
        : change < 0
          ? "text-red-500"
          : "text-muted-foreground";

  const markerTimestamp = Math.floor(
    new Date(market.matched_at).getTime() / 1000
  );

  return (
    <Link
      href={`/event/${market.event_polymarket_id}`}
      className="-mx-2 flex flex-col gap-1.5 rounded-md px-2 py-2 transition-colors hover:bg-muted"
    >
      <p className="text-sm font-medium">{title}</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold leading-none">{priceLabel}</span>
            {changeLabel && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-sm font-semibold",
                  changeColorClass
                )}
              >
                <ChangeArrow className="size-3.5" />
                {changeLabel}
              </span>
            )}
            {outcomeLabel && (
              <span className="ml-0.5 text-xs text-muted-foreground">
                {outcomeLabel}
              </span>
            )}
          </div>
          {(() => {
            const vol = window.getVolume(market);
            if (vol == null || vol <= 0) return null;
            return (
              <span className="text-xs text-muted-foreground">
                {formatShortDollars(vol)} {window.label} vol
              </span>
            );
          })()}
        </div>
        <MarketSparkline
          points={points}
          loading={isLoading || !tokenId}
          width={SPARKLINE_WIDTH}
          height={SPARKLINE_HEIGHT}
          upColor={SUCCESS_COLOR}
          downColor={ERROR_COLOR}
          flatColor={MUTED_COLOR}
          markerTimestamp={markerTimestamp}
          markerColor={MUTED_COLOR}
        />
      </div>
    </Link>
  );
}

function CollapsibleSources({
  tweets,
  distinctAuthorCount,
}: {
  tweets: StoryTweet[];
  distinctAuthorCount: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleAuthors = useMemo(() => {
    const seen = new Set<string>();
    const out: StoryTweet[] = [];
    for (const t of tweets) {
      if (seen.has(t.author_handle)) continue;
      seen.add(t.author_handle);
      out.push(t);
    }
    return out;
  }, [tweets]);

  const overflow = Math.max(0, distinctAuthorCount - visibleAuthors.length);
  const namesText = visibleAuthors
    .map((t) => t.author_display_name || t.author_handle)
    .join(", ");

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 py-1 text-left transition-opacity hover:opacity-80"
        aria-expanded={expanded}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sources
        </span>
        <span className="flex h-[18px] min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
          {distinctAuthorCount}
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-[18px] w-[18px] text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded ? (
        <div className="flex flex-col gap-3">
          {tweets.map((t) => (
            <TweetRow key={t.tweet_id} tweet={t} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex">
            {visibleAuthors.slice(0, 4).map((t, i) => (
              <ExternalAuthorAvatar
                key={t.author_handle}
                avatarUrl={t.author_avatar_url}
                handle={t.author_handle}
                displayName={t.author_display_name}
                verifiedType={t.author_verified_type}
                size={24}
                className={cn("ring-2 ring-card", i > 0 && "-ml-2")}
              />
            ))}
          </div>
          <p className="flex-1 truncate text-sm italic text-muted-foreground">
            {namesText}
          </p>
          {overflow > 0 && (
            <span className="shrink-0 text-sm italic text-muted-foreground">
              +{overflow} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function TweetRow({ tweet }: { tweet: StoryTweet }) {
  return (
    <a
      href={tweet.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-2.5 rounded-lg bg-muted p-3 transition-opacity hover:opacity-80"
    >
      <ExternalAuthorAvatar
        avatarUrl={tweet.author_avatar_url}
        handle={tweet.author_handle}
        displayName={tweet.author_display_name}
        verifiedType={tweet.author_verified_type}
        size={36}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-sm font-semibold">
            {tweet.author_display_name}
          </span>
          {tweet.author_verified_type && (
            <VerifiedBadge
              color={VERIFIED_COLORS[tweet.author_verified_type]}
              size={14}
            />
          )}
          <span className="truncate text-sm text-muted-foreground">
            @{tweet.author_handle}
          </span>
          <span className="ml-auto shrink-0 text-sm text-muted-foreground">
            {formatTimeAgoShort(tweet.posted_at)}
          </span>
        </div>
        <p className="text-sm leading-snug whitespace-pre-wrap">{tweet.body}</p>
      </div>
    </a>
  );
}

function StoryItem({ story }: { story: Story }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {story.hero_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.hero_image.url}
          alt=""
          className="block aspect-video w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{story.headline}</h2>
          <p className="text-xs text-muted-foreground">
            Created {formatRelativeAgo(story.created_at)} · Updated{" "}
            {formatRelativeAgo(story.latest_media_at)}
          </p>
        </div>

        {story.tweets.length > 0 && (
          <CollapsibleSources
            tweets={story.tweets}
            distinctAuthorCount={story.distinct_author_count}
          />
        )}

        {story.markets.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 py-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Related markets
              </span>
              <span className="flex h-[18px] min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                {story.markets.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {story.markets.map((m) => (
                <MarketRow key={m.id} market={m} title={m.question} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
