"use client";

import { useEffect, useRef, useState } from "react";
import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { Loader } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
import StorySubtables from "../story-subtables/StorySubtables";
import { useAdminStory } from "../../../hooks/admin/useAdminStory";
import { AdminStory } from "../../../lib/types";
import { formatFriendlyDate, formatExactDate } from "../../../lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const columnHelper = createColumnHelper<AdminStory>();

function statusBadge(status: AdminStory["status"]) {
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

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    size: 60,
    enableSorting: false,
    cell: (info) => {
      const id = info.getValue();
      return (
        <button
          className="cursor-pointer font-mono hover:underline"
          onClick={() => {
            navigator.clipboard.writeText(id);
            toast("ID copied to clipboard");
          }}
          title={id}
        >
          {id.slice(0, 5)}
        </button>
      );
    },
  }),
  columnHelper.accessor("latest_media_at", {
    header: "Latest",
    size: 60,
    cell: (info) => dateCell(info.getValue()),
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
    size: 60,
    cell: (info) => dateCell(info.getValue()),
  }),
  columnHelper.accessor("promoted_at", {
    header: "Promoted",
    size: 75,
    cell: (info) => dateCell(info.getValue()),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 80,
    cell: (info) => statusBadge(info.getValue()),
  }),
  columnHelper.accessor("seed_author_handle", {
    header: "Seed author",
    size: 120,
    enableSorting: false,
    cell: (info) => {
      const handle = info.getValue();
      if (!handle) return "—";
      return (
        <a
          href={`https://x.com/${handle}`}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          @{handle}
        </a>
      );
    },
  }),
  columnHelper.display({
    id: "headline",
    header: "Headline",
    size: 720,
    enableSorting: false,
    cell: (info) => {
      const { id, headline } = info.row.original;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/admin/stories/${id}`}
              className="block w-full truncate hover:underline"
            >
              {headline}
            </Link>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">{headline}</TooltipContent>
        </Tooltip>
      );
    },
  }),
  columnHelper.display({
    id: "tweets",
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            Tweets
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Member tweets / distinct originating authors (RTs collapse to the
          original author).
        </TooltipContent>
      </Tooltip>
    ),
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const { media_count, distinct_author_count } = info.row.original;
      return `${media_count} / ${distinct_author_count}`;
    },
  }),
  columnHelper.display({
    id: "markets",
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            Markets
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Linked Polymarket markets / events.
        </TooltipContent>
      </Tooltip>
    ),
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const { linked_event_count, linked_market_count } = info.row.original;
      return `${linked_market_count} / ${linked_event_count}`;
    },
  }),
  columnHelper.accessor("top_event_similarity", {
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            Top match
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Cosine similarity of the highest-scoring linked Polymarket event.
          Higher = better topical match between the story and a real
          prediction market. Hover the cell for the matched event title.
        </TooltipContent>
      </Tooltip>
    ),
    size: 80,
    cell: (info) => {
      const sim = info.getValue();
      const title = info.row.original.top_event_title;
      const formatted = formatSim(sim);
      if (sim == null || !title) return formatted;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{formatted}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">{title}</TooltipContent>
        </Tooltip>
      );
    },
  }),
  columnHelper.accessor("avg_join_similarity", {
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted underline-offset-2">
            Cluster sim
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Average cosine similarity at which member tweets joined the cluster
          (excluding the seed). Higher = tighter cluster. Values near the
          0.78 floor indicate loosely-held clusters that may not be coherent.
        </TooltipContent>
      </Tooltip>
    ),
    size: 80,
    cell: (info) => formatSim(info.getValue()),
  }),
];

const skeletonWidths: Record<string, string> = {
  id: "h-4 w-10",
  status: "h-4 w-16",
  seed_author_handle: "h-4 w-20",
  headline: "h-4 w-64",
  tweets: "h-4 w-12",
  markets: "h-4 w-12",
  top_event_similarity: "h-4 w-12",
  avg_join_similarity: "h-4 w-12",
  latest_media_at: "h-4 w-20",
  promoted_at: "h-4 w-20",
  created_at: "h-4 w-20",
};

interface StoriesTableProps {
  stories: AdminStory[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total?: number | null;
  onNextPage: () => void;
  onPrevPage: () => void;
  onFirstPage: () => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeOnly: boolean;
  onActiveOnlyChange: (v: boolean) => void;
}

function StoryExpansion({ storyId }: { storyId: string }) {
  const { data, loading, error } = useAdminStory(storyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader className="h-5 w-5 animate-spin duration-1000" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">Error: {error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <StorySubtables
      tweets={data.tweets}
      events={data.events}
      markets={data.markets}
    />
  );
}

export default function StoriesTable({
  stories,
  loading,
  error,
  page,
  hasMore,
  total,
  onNextPage,
  onPrevPage,
  onFirstPage,
  sorting,
  onSortingChange,
  searchQuery,
  onSearchChange,
  activeOnly,
  onActiveOnlyChange,
}: StoriesTableProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toolbar = (
    <div className="flex items-center gap-3">
      <input
        ref={searchRef}
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search headlines... (/)"
        className="w-56 rounded-lg border border-black/[.08] px-3 py-1.5 text-sm placeholder:text-muted-foreground dark:border-white/[.145]"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={activeOnly}
          onChange={(e) => onActiveOnlyChange(e.target.checked)}
        />
        Active only
      </label>
      <Pagination
        page={page}
        hasMore={hasMore}
        total={total}
        onFirstPage={onFirstPage}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />
    </div>
  );

  return (
    <DataTable
      data={stories}
      columns={columns}
      loading={loading}
      error={error}
      sorting={sorting}
      onSortingChange={onSortingChange}
      manualSorting={true}
      skeletonWidths={skeletonWidths}
      toolbar={toolbar}
      getRowId={(s) => s.id}
      expandedRowId={expandedId}
      onRowClick={(s) =>
        setExpandedId((prev) => (prev === s.id ? null : s.id))
      }
      renderExpandedRow={(s) => <StoryExpansion storyId={s.id} />}
    />
  );
}
