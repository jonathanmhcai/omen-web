"use client";

import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "../data-table/DataTable";
import { formatExactDate, formatFriendlyDate } from "../../../lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type {
  AdminStoryEvent,
  AdminStoryMarket,
  AdminStoryTweet,
} from "../../../lib/types";

function formatSim(sim: number | null): string {
  if (sim == null) return "—";
  return sim.toFixed(3);
}

function formatCents(value: string | null): string {
  if (value == null) return "—";
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return value;
  // Polymarket prices are in [0, 1] = probability. Display as cents
  // — "45¢" reads more naturally than "0.450" for traders.
  //
  // Sub-1-cent prices need decimal precision: long-tail prediction
  // markets (e.g. "DHS shutdown ends in July 2026" after the news
  // already broke that it's ending now) trade at 0.1¢–0.5¢ and
  // rounding them to "0¢" hides real signal.
  const cents = n * 100;
  if (Math.abs(cents) > 0 && Math.abs(cents) < 1) {
    return `${cents.toFixed(1)}¢`;
  }
  return `${Math.round(cents)}¢`;
}

function formatVolume(value: string | null): string {
  if (!value) return "—";
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return value;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function MarketStatus({
  closed,
  archived,
  active,
  endDate,
}: {
  closed: boolean | null;
  archived: boolean | null;
  // Polymarket's `active` flag. Distinct from our derived "active"
  // status — a row can be not-closed/archived/expired but still
  // active=false (placeholder/reserved-slot in templated negative-risk
  // events: "Player A-Z", "Candidate A-Z", etc.). Render those as
  // "dormant" so they're visually distinguishable from real markets.
  active: boolean | null;
  endDate: string | null;
}) {
  if (closed) return <span className="text-zinc-500">closed</span>;
  if (archived) return <span className="text-zinc-500">archived</span>;
  if (endDate && new Date(endDate) < new Date()) {
    return <span className="text-zinc-500">expired</span>;
  }
  if (active === false) {
    return <span className="text-amber-600 dark:text-amber-400">dormant</span>;
  }
  return <span className="text-green-600 dark:text-green-400">active</span>;
}

function dateCell(value: string | null) {
  if (!value) return "—";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{formatFriendlyDate(value)}</span>
      </TooltipTrigger>
      <TooltipContent>{formatExactDate(value)}</TooltipContent>
    </Tooltip>
  );
}

function entitiesCell(entities: string[]) {
  if (!entities || entities.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  const joined = entities.join(", ");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block w-full truncate">{joined}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-md">{joined}</TooltipContent>
    </Tooltip>
  );
}

const tweetColumnHelper = createColumnHelper<AdminStoryTweet>();
const tweetColumns = [
  tweetColumnHelper.accessor("similarity", {
    header: "Sim",
    size: 60,
    cell: (info) => formatSim(info.getValue()),
  }),
  tweetColumnHelper.display({
    id: "entities",
    header: "Entities",
    size: 200,
    enableSorting: false,
    cell: (info) => entitiesCell(info.row.original.entities),
  }),
  tweetColumnHelper.accessor("author_handle", {
    header: "Handle",
    size: 120,
    cell: (info) => {
      const handle = info.getValue();
      const tweetId = info.row.original.tweet_id;
      if (!handle) return "—";
      return (
        <a
          href={`https://x.com/${handle}/status/${tweetId}`}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          @{handle}
        </a>
      );
    },
  }),
  tweetColumnHelper.accessor("posted_at", {
    header: "Posted",
    size: 110,
    cell: (info) => dateCell(info.getValue()),
  }),
  tweetColumnHelper.accessor("body", {
    header: "Body",
    size: 540,
    enableSorting: false,
    cell: (info) => {
      const body = info.getValue();
      return <span className="whitespace-pre-wrap text-sm">{body}</span>;
    },
  }),
];
const tweetSkeleton: Record<string, string> = {
  author_handle: "h-4 w-20",
  posted_at: "h-4 w-20",
  similarity: "h-4 w-10",
  body: "h-4 w-96",
  entities: "h-4 w-32",
};

const eventColumnHelper = createColumnHelper<AdminStoryEvent>();
const eventColumns = [
  eventColumnHelper.accessor("similarity", {
    header: "Sim",
    size: 70,
    cell: (info) => formatSim(info.getValue()),
  }),
  eventColumnHelper.accessor("bm25_score", {
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            BM25
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Postgres FTS `ts_rank_cd` at last match. Empty when this row was
          admitted via ANN-only rescue (lexical query missed it).
        </TooltipContent>
      </Tooltip>
    ),
    size: 70,
    cell: (info) => formatSim(info.getValue()),
  }),
  eventColumnHelper.accessor("match_score", {
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            Match
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Writer&apos;s RRF-fused score over ANN + BM25 + entity-overlap
          (k=60). The within-story ordering key the public feed uses.
          Higher = more likely to surface.
        </TooltipContent>
      </Tooltip>
    ),
    size: 70,
    cell: (info) => formatSim(info.getValue()),
  }),
  eventColumnHelper.display({
    id: "entities",
    header: "Entities",
    size: 200,
    enableSorting: false,
    cell: (info) => entitiesCell(info.row.original.entities),
  }),
  eventColumnHelper.accessor("title", {
    header: "Title",
    size: 480,
    cell: (info) => {
      const title = info.getValue();
      const slug = info.row.original.slug;
      if (!title) return "—";
      return (
        <a
          href={`https://polymarket.com/event/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          {title}
        </a>
      );
    },
  }),
  eventColumnHelper.display({
    id: "status",
    header: "Status",
    size: 80,
    enableSorting: false,
    cell: (info) => (
      <MarketStatus
        closed={info.row.original.closed}
        archived={info.row.original.archived}
        active={info.row.original.active}
        endDate={info.row.original.end_date}
      />
    ),
  }),
  eventColumnHelper.accessor("end_date", {
    header: "Ends",
    size: 110,
    cell: (info) => dateCell(info.getValue()),
  }),
  eventColumnHelper.accessor("volume_24hr", {
    header: "Vol 24h",
    size: 90,
    cell: (info) => formatVolume(info.getValue()),
  }),
];
const eventSkeleton: Record<string, string> = {
  similarity: "h-4 w-10",
  bm25_score: "h-4 w-10",
  match_score: "h-4 w-10",
  entities: "h-4 w-32",
  title: "h-4 w-72",
  status: "h-4 w-12",
  end_date: "h-4 w-20",
  volume_24hr: "h-4 w-14",
};

const marketColumnHelper = createColumnHelper<AdminStoryMarket>();
const marketColumns = [
  marketColumnHelper.accessor("surfaced", {
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            Live
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Green = this market would appear on the public `/stories` feed
          for this story right now (parent story active, market + parent
          event live, within the top-N by match_score). Gray = filtered
          out by the same algo readers see.
        </TooltipContent>
      </Tooltip>
    ),
    size: 50,
    cell: (info) => {
      const surfaced = info.getValue();
      const cls = surfaced
        ? "bg-green-500"
        : "bg-zinc-300 dark:bg-zinc-700";
      return (
        <span
          aria-label={surfaced ? "surfaced" : "not surfaced"}
          className={`inline-block h-2 w-2 rounded-full ${cls}`}
        />
      );
    },
  }),
  marketColumnHelper.accessor("similarity", {
    header: "Sim",
    size: 70,
    cell: (info) => formatSim(info.getValue()),
  }),
  marketColumnHelper.accessor("bm25_score", {
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            BM25
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Postgres FTS `ts_rank_cd` at last match. Empty when this row was
          admitted via ANN-only rescue (lexical query missed it).
        </TooltipContent>
      </Tooltip>
    ),
    size: 70,
    cell: (info) => formatSim(info.getValue()),
  }),
  marketColumnHelper.accessor("match_score", {
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            Match
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Writer&apos;s RRF-fused score over ANN + BM25 + entity-overlap
          (k=60). The within-story ordering key the public feed uses to
          pick which markets surface. Higher = more likely to surface.
        </TooltipContent>
      </Tooltip>
    ),
    size: 70,
    cell: (info) => formatSim(info.getValue()),
  }),
  marketColumnHelper.display({
    id: "entities",
    header: "Entities",
    size: 200,
    enableSorting: false,
    cell: (info) => entitiesCell(info.row.original.entities),
  }),
  marketColumnHelper.accessor("question", {
    header: "Question",
    size: 380,
    cell: (info) => {
      const q = info.getValue();
      const slug = info.row.original.slug;
      if (!q) return "—";
      return (
        <a
          href={`https://polymarket.com/market/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          {q}
        </a>
      );
    },
  }),
  marketColumnHelper.accessor("parent_event_title", {
    header: "Parent event",
    size: 240,
    enableSorting: false,
    cell: (info) => {
      const title = info.getValue();
      const slug = info.row.original.parent_event_slug;
      if (!title) return "—";
      if (!slug) return title;
      return (
        <a
          href={`https://polymarket.com/event/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:underline"
        >
          {title}
        </a>
      );
    },
  }),
  marketColumnHelper.display({
    id: "status",
    header: "Status",
    size: 80,
    enableSorting: false,
    cell: (info) => (
      <MarketStatus
        closed={info.row.original.closed}
        archived={info.row.original.archived}
        active={info.row.original.active}
        endDate={info.row.original.end_date}
      />
    ),
  }),
  marketColumnHelper.accessor("end_date", {
    header: "Ends",
    size: 110,
    cell: (info) => dateCell(info.getValue()),
  }),
  marketColumnHelper.display({
    id: "move",
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            Move
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Price at first match → current last-trade price, with the cents
          delta colored. The headline backtest signal: did the market
          move after we linked it to this story? Hover the cell for
          match time + current-price staleness note.
        </TooltipContent>
      </Tooltip>
    ),
    size: 200,
    enableSorting: false,
    cell: (info) => {
      const m = info.row.original;
      const matchStr = formatCents(m.price_at_match);
      const currStr = formatCents(m.current_price);
      const matchN = m.price_at_match != null ? parseFloat(m.price_at_match) : null;
      const currN = m.current_price != null ? parseFloat(m.current_price) : null;

      let diffEl: React.ReactNode = null;
      if (
        matchN != null &&
        currN != null &&
        Number.isFinite(matchN) &&
        Number.isFinite(currN) &&
        matchN > 0 // percentage undefined at match=0
      ) {
        const diffPct = Math.round(((currN - matchN) / matchN) * 100);
        if (diffPct === 0) {
          diffEl = <span className="ml-1 text-muted-foreground">0%</span>;
        } else {
          const cls =
            diffPct > 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400";
          diffEl = (
            <span className={`ml-1 ${cls}`}>
              {diffPct > 0 ? "+" : ""}
              {diffPct}%
            </span>
          );
        }
      }

      const inner = (
        <span className="whitespace-nowrap">
          {matchStr}
          <span className="mx-1 text-muted-foreground">→</span>
          {currStr}
          {diffEl}
        </span>
      );

      // Hover for match time + staleness context.
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{inner}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            Matched: {formatExactDate(m.matched_at)}
            <br />
            Current price is up to ~10 min stale per indexer sync cadence.
          </TooltipContent>
        </Tooltip>
      );
    },
  }),
  marketColumnHelper.accessor("volume_num", {
    header: "Volume",
    size: 90,
    cell: (info) => formatVolume(info.getValue()),
  }),
];
const marketSkeleton: Record<string, string> = {
  surfaced: "h-2 w-2 rounded-full",
  similarity: "h-4 w-10",
  bm25_score: "h-4 w-10",
  match_score: "h-4 w-10",
  entities: "h-4 w-32",
  question: "h-4 w-64",
  parent_event_title: "h-4 w-40",
  status: "h-4 w-12",
  end_date: "h-4 w-20",
  move: "h-4 w-32",
  volume_num: "h-4 w-14",
};

interface StorySubtablesProps {
  tweets: AdminStoryTweet[];
  events: AdminStoryEvent[];
  markets: AdminStoryMarket[];
}

export default function StorySubtables({
  tweets,
  events,
  markets,
}: StorySubtablesProps) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-3 text-base font-semibold">
          Tweets ({tweets.length})
        </h3>
        <DataTable
          data={tweets}
          columns={tweetColumns}
          loading={false}
          error={null}
          defaultSorting={[{ id: "posted_at", desc: false }]}
          skeletonWidths={tweetSkeleton}
        />
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold">
          Polymarket events ({events.length})
        </h3>
        <DataTable
          data={events}
          columns={eventColumns}
          loading={false}
          error={null}
          defaultSorting={[{ id: "match_score", desc: true }]}
          skeletonWidths={eventSkeleton}
        />
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold">
          Polymarket markets ({markets.length})
        </h3>
        <DataTable
          data={markets}
          columns={marketColumns}
          loading={false}
          error={null}
          defaultSorting={[{ id: "match_score", desc: true }]}
          skeletonWidths={marketSkeleton}
        />
      </section>
    </div>
  );
}
