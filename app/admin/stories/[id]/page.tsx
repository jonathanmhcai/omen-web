"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "../../../components/admin/data-table/DataTable";
import { useAdminStory } from "../../../hooks/admin/useAdminStory";
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

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <button
      className="cursor-pointer text-left hover:underline"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast("Copied to clipboard");
      }}
      title="Click to copy"
    >
      {label}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2 border-b border-black/[.04] dark:border-white/[.06]">
      <span className="w-44 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "candidate" | "active" }) {
  const className =
    status === "active"
      ? "rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
      : "rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400";
  return <span className={className}>{status}</span>;
}

function formatSim(sim: number | null): string {
  if (sim == null) return "—";
  return sim.toFixed(3);
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
  endDate,
}: {
  closed: boolean | null;
  archived: boolean | null;
  endDate: string | null;
}) {
  if (closed) return <span className="text-zinc-500">closed</span>;
  if (archived) return <span className="text-zinc-500">archived</span>;
  if (endDate && new Date(endDate) < new Date()) {
    return <span className="text-zinc-500">expired</span>;
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

// ---------------------------------------------------------------------------
// Tweets sub-table
// ---------------------------------------------------------------------------
const tweetColumnHelper = createColumnHelper<AdminStoryTweet>();
const tweetColumns = [
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
  tweetColumnHelper.accessor("similarity", {
    header: "Sim",
    size: 60,
    cell: (info) => formatSim(info.getValue()),
  }),
  tweetColumnHelper.accessor("body", {
    header: "Body",
    size: 700,
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
};

// ---------------------------------------------------------------------------
// Events sub-table
// ---------------------------------------------------------------------------
const eventColumnHelper = createColumnHelper<AdminStoryEvent>();
const eventColumns = [
  eventColumnHelper.accessor("similarity", {
    header: "Sim",
    size: 70,
    cell: (info) => formatSim(info.getValue()),
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
  title: "h-4 w-72",
  status: "h-4 w-12",
  end_date: "h-4 w-20",
  volume_24hr: "h-4 w-14",
};

// ---------------------------------------------------------------------------
// Markets sub-table
// ---------------------------------------------------------------------------
const marketColumnHelper = createColumnHelper<AdminStoryMarket>();
const marketColumns = [
  marketColumnHelper.accessor("similarity", {
    header: "Sim",
    size: 70,
    cell: (info) => formatSim(info.getValue()),
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
        endDate={info.row.original.end_date}
      />
    ),
  }),
  marketColumnHelper.accessor("end_date", {
    header: "Ends",
    size: 110,
    cell: (info) => dateCell(info.getValue()),
  }),
  marketColumnHelper.accessor("volume_num", {
    header: "Volume",
    size: 90,
    cell: (info) => formatVolume(info.getValue()),
  }),
];
const marketSkeleton: Record<string, string> = {
  similarity: "h-4 w-10",
  question: "h-4 w-64",
  parent_event_title: "h-4 w-40",
  status: "h-4 w-12",
  end_date: "h-4 w-20",
  volume_num: "h-4 w-14",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAdminStory(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin duration-1000" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">Error: {error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Story not found.</p>;
  }

  const { story, tweets, events, markets } = data;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/stories"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to stories
        </Link>
      </div>

      <div className="mb-4 flex items-start gap-3">
        <h2 className="text-lg font-semibold">{story.headline}</h2>
        <div className="mt-1.5">
          <StatusBadge status={story.status} />
        </div>
      </div>

      <div className="flex flex-col">
        <Field label="ID">
          <CopyValue label={story.id} value={story.id} />
        </Field>
        <Field label="Status">
          <StatusBadge status={story.status} />
        </Field>
        <Field label="Tweets / Authors">
          {story.media_count} tweets, {story.distinct_author_count} distinct authors
        </Field>
        <Field label="Linked">
          {events.length} events, {markets.length} markets
        </Field>
        <Field label="Created">{formatExactDate(story.created_at)}</Field>
        <Field label="Latest media">{formatExactDate(story.latest_media_at)}</Field>
        <Field label="Promoted">
          {story.promoted_at ? formatExactDate(story.promoted_at) : "—"}
        </Field>
        <Field label="Centroid model">{story.centroid_model ?? "—"}</Field>
        <Field label="Centroid embedded">
          {story.centroid_embedded_at
            ? formatExactDate(story.centroid_embedded_at)
            : "—"}
        </Field>
      </div>

      <h3 className="mb-3 mt-8 text-base font-semibold">
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

      <h3 className="mb-3 mt-8 text-base font-semibold">
        Polymarket events ({events.length})
      </h3>
      <DataTable
        data={events}
        columns={eventColumns}
        loading={false}
        error={null}
        defaultSorting={[{ id: "similarity", desc: true }]}
        skeletonWidths={eventSkeleton}
      />

      <h3 className="mb-3 mt-8 text-base font-semibold">
        Polymarket markets ({markets.length})
      </h3>
      <DataTable
        data={markets}
        columns={marketColumns}
        loading={false}
        error={null}
        defaultSorting={[{ id: "similarity", desc: true }]}
        skeletonWidths={marketSkeleton}
      />
    </div>
  );
}
