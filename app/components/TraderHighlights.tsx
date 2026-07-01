"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { EventTweet } from "../hooks/useEventTweets";
import { API_BASE } from "../lib/constants";
import { cents, shares, signedPct, signedUsd, usd } from "../lib/trader";
import LoadingDots from "./LoadingDots";
import { ScrubChart, ScrubMarker, ScrubSeries } from "./ScrubChart";

/**
 * Biggest wins / losses for a trader. Each row expands to the market's price
 * chart (shared ScrubChart) with their buy/sell/redeem markers and the tweets
 * they posted about it — scrub the line to reveal date + price + tweets, just
 * like the event detail chart. Accordion: one row open at a time.
 */

export type TraderInfo = {
  name: string | null;
  profileImage: string | null;
  xUsername: string | null;
  verifiedType: "blue" | "business" | "government" | null;
};

type Trade = {
  title: string;
  icon: string | null;
  eventSlug: string | null;
  asset: string | null;
  conditionId: string | null;
  outcome: string | null;
  realizedPnl: number;
  percentPnl: number;
  avgPrice: number;
  curPrice: number;
  size: number;
};

type PricePoint = { t: number; p: number };
type Fill = { t: number; p: number | null; size: number; kind: "buy" | "sell" | "redeem" };
type TweetMediaJson = { url: string; width: number | null; height: number | null; kind: string };
type MarketTweet = { id: string; t: number; text: string; score: number; media?: TweetMediaJson[] };

const MARKER = { buy: "#16a34a", sell: "#dc2626", redeem: "#2563eb" } as const;

// Clip the price line to the trader's activity window — at most this many days
// of history before/after their activity, so we don't render long flat
// stretches where nothing happened. "Activity" = fills AND matched tweets, so
// the pre-entry thesis tweets (and the price as they were posted) stay on the
// chart instead of getting stranded off-window.
const CLIP_BEFORE_DAYS = 7;
const CLIP_AFTER_DAYS = 7;

/** Trim price points to a window around the trader's activity (fills + tweets).
 *  Falls back to the full series if there's no activity or too few points. */
function clipToActivity(
  points: PricePoint[],
  fills: Fill[],
  tweets: { t: number }[]
): PricePoint[] {
  if ((fills.length === 0 && tweets.length === 0) || points.length === 0) return points;
  let first = Infinity;
  let last = -Infinity;
  for (const f of fills) {
    if (f.t < first) first = f.t;
    if (f.t > last) last = f.t;
  }
  for (const tw of tweets) {
    if (tw.t < first) first = tw.t;
    if (tw.t > last) last = tw.t;
  }
  const start = first - CLIP_BEFORE_DAYS * 86400;
  const end = last + CLIP_AFTER_DAYS * 86400;
  const clipped = points.filter((p) => p.t >= start && p.t <= end);
  return clipped.length >= 2 ? clipped : points;
}

/** Adapt our lean market tweet into the EventTweet shape TweetMarkers wants.
 *  All tweets are from the same trader, so they share the author. */
function toEventTweet(tw: MarketTweet, trader: TraderInfo): EventTweet {
  return {
    tweet_id: tw.id,
    author_handle: trader.xUsername ?? trader.name ?? "",
    author_display_name: trader.name ?? trader.xUsername ?? "Trader",
    author_avatar_url: trader.profileImage ?? null,
    author_verified_type: trader.verifiedType,
    body: tw.text,
    posted_at: new Date(tw.t * 1000).toISOString(),
    similarity: tw.score ?? null,
    is_seed: false,
    permalink: trader.xUsername
      ? `https://x.com/${trader.xUsername}/status/${tw.id}`
      : `https://twitter.com/i/web/status/${tw.id}`,
    media: (tw.media ?? []).map((m) => ({
      url: m.url,
      width: m.width,
      height: m.height,
      kind: (m.kind === "video" || m.kind === "gif" ? m.kind : "photo") as "photo" | "video" | "gif",
    })),
    tSeconds: tw.t,
  };
}

/** Polymarket attribution wordmark linking to the market's event — mirrors
 *  the event detail chart. Two imgs with dark-mode toggles (no theme hook). */
function PolymarketWordmark({ eventSlug }: { eventSlug: string }) {
  return (
    <a
      href={`https://polymarket.com/event/${eventSlug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 transition-opacity hover:opacity-100"
      aria-label="View on Polymarket"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/providers/polymarket-black.png"
        alt="Polymarket"
        width={90}
        height={18}
        className="block h-[18px] w-[90px] object-contain opacity-40 dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/providers/polymarket-white.png"
        alt="Polymarket"
        width={90}
        height={18}
        className="hidden h-[18px] w-[90px] object-contain opacity-20 dark:block"
      />
    </a>
  );
}

function MarketChart({
  handle,
  token,
  conditionId,
  outcome,
  curPrice,
  eventSlug,
  trader,
}: {
  handle: string;
  token: string;
  conditionId: string | null;
  outcome: string | null;
  curPrice: number;
  eventSlug: string | null;
  trader: TraderInfo;
}) {
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [tweets, setTweets] = useState<MarketTweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const historyReq = fetch(
          `${API_BASE}/traders/market-history?token=${encodeURIComponent(token)}`
        );
        const fillsReq = conditionId
          ? fetch(
              `${API_BASE}/traders/${encodeURIComponent(handle)}/fills?market=${encodeURIComponent(
                conditionId
              )}&asset=${encodeURIComponent(token)}`
            )
          : null;
        const tweetsReq = conditionId
          ? fetch(
              `${API_BASE}/traders/${encodeURIComponent(
                handle
              )}/market-tweets?market=${encodeURIComponent(conditionId)}`
            )
          : null;
        const [hRes, fRes, twRes] = await Promise.all([historyReq, fillsReq, tweetsReq]);
        const hData = hRes.ok ? ((await hRes.json()) as { points?: PricePoint[] }) : { points: [] };
        const fData = fRes && fRes.ok ? ((await fRes.json()) as { fills?: Fill[] }) : { fills: [] };
        const twData =
          twRes && twRes.ok ? ((await twRes.json()) as { tweets?: MarketTweet[] }) : { tweets: [] };
        if (live) {
          setPoints(hData.points ?? []);
          setFills(fData.fills ?? []);
          setTweets(twData.tweets ?? []);
        }
      } catch {
        if (live) {
          setPoints([]);
          setFills([]);
          setTweets([]);
        }
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [handle, token, conditionId]);

  const series: ScrubSeries[] = [
    {
      key: "price",
      label: outcome ?? "Price",
      color: "#888",
      points: clipToActivity(points, fills, tweets),
    },
  ];
  const markers: ScrubMarker[] = fills.map((f) => {
    const price = f.kind === "redeem" ? curPrice : (f.p ?? 0);
    const notional = f.size * price;
    return {
      t: f.t,
      p: price,
      color: MARKER[f.kind],
      tooltip: (
        <>
          <div className="text-[10px] leading-tight text-muted-foreground">
            {new Date(f.t * 1000).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div>
            <span className="font-semibold uppercase" style={{ color: MARKER[f.kind] }}>
              {f.kind}
            </span>
            {` ${usd(notional)} at ${cents(price)}`}
          </div>
        </>
      ),
    };
  });
  const eventTweets = tweets.map((tw) => toEventTweet(tw, trader));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {(["buy", "sell", "redeem"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: MARKER[k] }} />
              <span className="capitalize">{k}</span>
            </span>
          ))}
        </div>
        {eventSlug && <PolymarketWordmark eventSlug={eventSlug} />}
      </div>
      {points.length < 2 ? (
        // Placeholder matches ScrubChart's height so the layout doesn't shift
        // when the chart loads in.
        <div className="flex h-56 items-center justify-center">
          {loading ? (
            <LoadingDots />
          ) : (
            <span className="text-sm text-muted-foreground">No price history</span>
          )}
        </div>
      ) : (
        <ScrubChart
          series={series}
          markers={markers}
          tweets={eventTweets}
          formatY={cents}
          formatValue={cents}
        />
      )}
    </div>
  );
}

function TradeRow({
  t,
  handle,
  trader,
  open,
  onToggle,
}: {
  t: Trade;
  handle: string;
  trader: TraderInfo;
  open: boolean;
  onToggle: () => void;
}) {
  const up = t.realizedPnl >= 0;
  // Latch: mount the chart on first open and keep it mounted so collapsing
  // animates smoothly (and reopening is instant). Set in the click handler
  // (idempotent — closing means it was already open), not an effect.
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <div className="border-b">
      <button
        onClick={() => {
          setHasOpened(true);
          onToggle();
        }}
        className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/40"
      >
        {t.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.icon} alt="" className="h-9 w-9 shrink-0 rounded bg-muted object-cover" />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">{t.title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {t.outcome} · {cents(t.avgPrice)} → {cents(t.curPrice)} · {shares(t.size)}
          </div>
        </div>
        <span className={`shrink-0 text-sm tabular-nums ${up ? "text-green-600" : "text-red-600"}`}>
          {signedUsd(t.realizedPnl)} ({signedPct(t.percentPnl)})
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-4 pt-3">
            {hasOpened &&
              (t.asset ? (
                <MarketChart
                  handle={handle}
                  token={t.asset}
                  conditionId={t.conditionId}
                  outcome={t.outcome}
                  curPrice={t.curPrice}
                  eventSlug={t.eventSlug}
                  trader={trader}
                />
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                  No price history
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  trades,
  handle,
  trader,
  idPrefix,
  openKey,
  onToggle,
}: {
  title: string;
  trades: Trade[];
  handle: string;
  trader: TraderInfo;
  idPrefix: string;
  openKey: string | null;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="w-full">
      <h3 className="mb-1 text-sm text-muted-foreground">{title}</h3>
      {trades.length === 0 ? (
        <div className="py-4 text-sm text-muted-foreground">—</div>
      ) : (
        trades.map((t, i) => {
          const key = `${idPrefix}-${i}`;
          return (
            <TradeRow
              key={key}
              t={t}
              handle={handle}
              trader={trader}
              open={openKey === key}
              onToggle={() => onToggle(key)}
            />
          );
        })
      )}
    </div>
  );
}

export default function TraderHighlights({
  handle,
  trader,
}: {
  handle: string;
  trader: TraderInfo;
}) {
  const [best, setBest] = useState<Trade[]>([]);
  const [worst, setWorst] = useState<Trade[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = (key: string) => setOpenKey((k) => (k === key ? null : key));

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/traders/${encodeURIComponent(handle)}/highlights`);
        if (res.ok && live) {
          const data = (await res.json()) as { best?: Trade[]; worst?: Trade[] };
          setBest(data.best ?? []);
          setWorst(data.worst ?? []);
        }
      } catch {
        // leave empty
      }
    })();
    return () => {
      live = false;
    };
  }, [handle]);

  return (
    <div className="flex w-full flex-col gap-6">
      <Section
        title="Biggest wins"
        trades={best}
        handle={handle}
        trader={trader}
        idPrefix="w"
        openKey={openKey}
        onToggle={toggle}
      />
      <Section
        title="Biggest losses"
        trades={worst}
        handle={handle}
        trader={trader}
        idPrefix="l"
        openKey={openKey}
        onToggle={toggle}
      />
    </div>
  );
}
