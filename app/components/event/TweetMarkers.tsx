"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimeseriesInterval } from "../../hooks/useTimeseries";
import { EventTweet } from "../../hooks/useEventTweets";
import type { TweetAuthorVerifiedType } from "../../hooks/useStories";

// Mirrors the verified-badge palette in `StoryCard.tsx` so tweet rows
// inside marker tooltips render the same blue/business/government tick
// as the homepage feed.
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

const MARKER_SIZE = 22;
const MARKER_R = MARKER_SIZE / 2;
// Two markers whose centers fall within this many px collapse into one
// cluster so the time axis stays readable on dense events.
const CLUSTER_GAP_PX = 20;
// Vertical band the markers sit in. The chart reserves a ~30px strip
// below its data area (via PADDING_BOTTOM in EventChart) so markers
// don't overlap the lines; this value places them inside that strip,
// just above the x-axis label row.
const MARKER_BOTTOM = 22;
// How close (px) the chart cursor must come to a cluster's x to open
// its popover during a scrub/hover. Matches mobile's SCRUB_HIT_PX so
// the feel is identical across platforms.
const SCRUB_HIT_PX = 18;

interface Cluster {
  id: string;
  xPx: number;
  /** Newest-first within the cluster. */
  tweets: EventTweet[];
}

interface TweetMarkersProps {
  tweets: EventTweet[];
  /** Pixel-space x of the left edge of the chart's data area. */
  innerLeft: number;
  /** Pixel-space width of the chart's data area. */
  innerW: number;
  /** Domain min (unix seconds). */
  tMin: number;
  /** Domain max (unix seconds). */
  tMax: number;
  /**
   * Current cursor x (pixel-space, same origin as `innerLeft`). When
   * non-null and within `SCRUB_HIT_PX` of a cluster's x, that cluster's
   * popover opens — drives the hover-on-laptop / scrub-on-mobile peek
   * to match the mobile app. `null` when the pointer is outside the
   * chart bounds or (on touch) released.
   */
  cursorX: number | null;
  /** Currently selected interval — needed for the off-window badge. */
  interval: TimeseriesInterval;
  /** Interval options in widening order. */
  intervalOptions: readonly TimeseriesInterval[];
  /** Bump the chart to a wider interval (reveals off-window tweets). */
  onIntervalChange: (interval: TimeseriesInterval) => void;
}

/**
 * Author-avatar markers on the chart's time axis at each tweet's
 * post time. Rendered as an HTML overlay (absolute-positioned inside
 * the chart container) on top of the SVG.
 *
 * Open/close of a cluster's popover is driven by the chart's
 * `cursorX` — hover on desktop, touch-drag on mobile — exactly like
 * the mobile app's scrub-peek. Whichever cluster is within
 * `SCRUB_HIT_PX` of the cursor (closest wins on ties) gets its
 * popover opened. Move cursor away → popover closes. This way the
 * pop-up "lines up vertically" with the chart cursor.
 *
 * Per-marker hover is also preserved as a hover-bridge on the popover
 * content itself, so mouse users can slide off the chart onto the
 * popover (to click through to a tweet) without it auto-closing.
 *
 * Tweets older than the visible domain collapse into a single
 * left-edge badge whose count + chevron mirrors the mobile UI;
 * clicking it bumps to the next-wider interval.
 */
export function TweetMarkers({
  tweets,
  innerLeft,
  innerW,
  tMin,
  tMax,
  cursorX,
  interval,
  intervalOptions,
  onIntervalChange,
}: TweetMarkersProps) {
  const { clusters, offWindow } = useMemo(() => {
    if (innerW <= 0 || tMax <= tMin) {
      return {
        clusters: [] as Cluster[],
        offWindow: [] as EventTweet[],
      };
    }
    const xFor = (t: number) =>
      innerLeft + ((Math.min(t, tMax) - tMin) / (tMax - tMin)) * innerW;

    const off: EventTweet[] = [];
    const inWin: { xPx: number; tweet: EventTweet }[] = [];
    for (const t of tweets) {
      if (t.tSeconds < tMin) {
        off.push(t);
        continue;
      }
      const xPx = xFor(t.tSeconds);
      if (Number.isFinite(xPx)) inWin.push({ xPx, tweet: t });
    }
    inWin.sort((a, b) => a.xPx - b.xPx);

    const out: Cluster[] = [];
    for (const { xPx, tweet } of inWin) {
      const last = out[out.length - 1];
      if (last && xPx - last.xPx <= CLUSTER_GAP_PX) {
        last.tweets.push(tweet);
        continue;
      }
      out.push({ id: tweet.tweet_id, xPx, tweets: [tweet] });
    }
    // `inWin` is sorted by x (≈ time ascending), so each cluster's
    // tweets are oldest-first. Re-sort newest-first so the marker
    // face (tweets[0]) is the freshest tweet. `off` is already
    // newest-first from the server.
    for (const c of out) c.tweets.sort((a, b) => b.tSeconds - a.tSeconds);
    return { clusters: out, offWindow: off };
  }, [tweets, innerLeft, innerW, tMin, tMax]);

  const curIdx = intervalOptions.indexOf(interval);
  const nextWider =
    curIdx >= 0 && curIdx < intervalOptions.length - 1
      ? intervalOptions[curIdx + 1]
      : undefined;

  // Nearest cluster within SCRUB_HIT_PX of the cursor, by absolute
  // x-distance. Closest wins on ties — same semantics as mobile's
  // useAnimatedReaction. Returns null when the cursor is too far from
  // every cluster, off the chart, or (on touch) released.
  const scrubActiveId = useMemo(() => {
    if (cursorX == null) return null;
    let bestId: string | null = null;
    let bestDist = SCRUB_HIT_PX + 1;
    for (const c of clusters) {
      const d = Math.abs(c.xPx - cursorX);
      if (d < bestDist) {
        bestDist = d;
        bestId = c.id;
      }
    }
    return bestId;
  }, [cursorX, clusters]);

  // Pin = explicit "keep this cluster's popover open" intent (set by
  // tapping/clicking a marker directly). Scrub is suppressed while a
  // cluster is pinned so the popover stays anchored to the user's
  // choice; this gives mobile users a path to tap a tweet inside the
  // popover that would otherwise close the instant their finger lifts.
  const [pinnedClusterId, setPinnedClusterId] = useState<string | null>(null);
  const effectiveScrubActiveId = pinnedClusterId ? null : scrubActiveId;

  if (tweets.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {clusters.map((cluster) => (
        <ClusterMarker
          key={cluster.id}
          cluster={cluster}
          scrubActive={cluster.id === effectiveScrubActiveId}
          pinned={cluster.id === pinnedClusterId}
          onPinChange={setPinnedClusterId}
        />
      ))}

      {offWindow.length > 0 ? (
        <button
          type="button"
          onClick={() => nextWider && onIntervalChange(nextWider)}
          disabled={!nextWider}
          className={cn(
            "pointer-events-auto absolute flex items-center gap-0.5 rounded-full border border-border bg-card px-1.5 text-xs font-bold text-muted-foreground transition-colors",
            nextWider
              ? "cursor-pointer hover:text-foreground"
              : "cursor-default opacity-60"
          )}
          style={{
            left: 2,
            bottom: MARKER_BOTTOM,
            height: MARKER_SIZE,
          }}
          title={
            nextWider
              ? `${offWindow.length} earlier tweet${
                  offWindow.length === 1 ? "" : "s"
                } — widen interval`
              : `${offWindow.length} earlier tweet${
                  offWindow.length === 1 ? "" : "s"
                }`
          }
        >
          <span className="-mt-px text-sm leading-none">‹</span>
          <span>{offWindow.length}</span>
        </button>
      ) : null}
    </div>
  );
}

function ClusterMarker({
  cluster,
  scrubActive,
  pinned,
  onPinChange,
}: {
  cluster: Cluster;
  scrubActive: boolean;
  pinned: boolean;
  onPinChange: (id: string | null) => void;
}) {
  // Hover-bridge lock: when the mouse moves off the chart and onto the
  // popover content, `scrubActive` flips to false but we keep the
  // popover open so the user can click through to a tweet. Only mouse
  // users get this — touch already had the cursor cleared on release,
  // so we don't accidentally pin the peek open after a finger lift.
  const [hoverLocked, setHoverLocked] = useState(false);
  const open = scrubActive || pinned || hoverLocked;
  const repr = cluster.tweets[0];
  const count = cluster.tweets.length;

  return (
    // Open is derived from three sources (scrub / pin / hover-lock).
    // Radix's onOpenChange only fires for its OWN close paths — Escape
    // key or pointerdown outside content — which we honor by clearing
    // pin + hover-lock; scrub clears itself when the cursor moves.
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          if (pinned) onPinChange(null);
          setHoverLocked(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="pointer-events-auto absolute block focus:outline-none"
          style={{
            left: cluster.xPx - MARKER_R,
            bottom: MARKER_BOTTOM,
            width: MARKER_SIZE,
            height: MARKER_SIZE,
          }}
          // Tap-to-pin: clicking a marker locks its popover open so the
          // user can tap a tweet inside without it auto-closing on
          // pointer release. Tapping the same marker again unpins; the
          // pin transfers naturally when a different marker is tapped
          // (Radix fires the previous popover's onOpenChange when its
          // outside-click detector sees the new tap on a different
          // trigger, clearing the old pin before this onClick sets the
          // new one).
          onClick={() => onPinChange(pinned ? null : cluster.id)}
          aria-label={
            count === 1
              ? `Tweet from @${repr.author_handle}`
              : `${count} tweets including @${repr.author_handle}`
          }
        >
          {/* Inner wrapper owns the rounded clip so the count badge can
           *  stick out past the avatar without being clipped. */}
          <span className="block h-full w-full overflow-hidden rounded-full border-[1.5px] border-background bg-muted ring-0 focus-visible:ring-2 focus-visible:ring-ring">
            <AvatarImage tweet={repr} size={MARKER_SIZE} />
          </span>
          {count > 1 ? (
            <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-background bg-foreground px-1 text-[9px] font-bold leading-none text-background">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={6}
        // Mirror tooltip styling — borderless container, content owns
        // its own row separators. Override Popover's default w-72.
        className="w-auto max-w-sm border border-border p-0 text-left"
        // Mouse users should be able to slide from the chart onto the
        // popover without it closing — pin it open while the pointer is
        // over the content. Touch is excluded so a tap-then-lift on a
        // marker doesn't accidentally lock it open.
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") setHoverLocked(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") setHoverLocked(false);
        }}
      >
        <div className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
          {cluster.tweets.map((t) => (
            <TweetCardRow key={t.tweet_id} tweet={t} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AvatarImage({ tweet, size }: { tweet: EventTweet; size: number }) {
  const initial = (tweet.author_display_name || tweet.author_handle || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  if (!tweet.author_avatar_url) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-bold text-muted-foreground"
        style={{ width: size, height: size }}
      >
        {initial}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tweet.author_avatar_url}
      alt=""
      width={size}
      height={size}
      className="block h-full w-full object-cover"
    />
  );
}

function TweetCardRow({ tweet }: { tweet: EventTweet }) {
  const time = useMemo(() => formatRelative(tweet.posted_at), [tweet.posted_at]);
  return (
    <a
      href={tweet.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-2 px-3 py-2.5 transition-colors hover:bg-muted/60"
    >
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: 28, height: 28 }}>
        <AvatarImage tweet={tweet} size={28} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1 text-xs">
          <span className="truncate font-semibold">
            {tweet.author_display_name}
          </span>
          {tweet.author_verified_type && (
            <VerifiedBadge
              color={VERIFIED_COLORS[tweet.author_verified_type]}
              size={12}
            />
          )}
          <span className="truncate text-muted-foreground">
            @{tweet.author_handle}
          </span>
          <span className="ml-auto shrink-0 text-muted-foreground">{time}</span>
        </div>
        <p className="text-xs leading-snug whitespace-pre-wrap line-clamp-4">
          {tweet.body}
        </p>
      </div>
    </a>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d`;
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
