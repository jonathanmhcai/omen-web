"use client";

import { useEffect, useRef } from "react";
import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import Link from "next/link";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
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
  columnHelper.accessor("latest_media_at", {
    header: "Latest",
    size: 70,
    cell: (info) => dateCell(info.getValue()),
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
    size: 70,
    cell: (info) => dateCell(info.getValue()),
  }),
  columnHelper.display({
    id: "headline",
    header: "Headline",
    size: 520,
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
  columnHelper.accessor("status", {
    header: "Status",
    size: 90,
    cell: (info) => statusBadge(info.getValue()),
  }),
  columnHelper.accessor("promoted_at", {
    header: "Promoted",
    size: 90,
    cell: (info) => dateCell(info.getValue()),
  }),
  columnHelper.accessor("media_count", {
    header: "Tweets",
    size: 70,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("distinct_author_count", {
    header: "Authors",
    size: 70,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("linked_event_count", {
    header: "Events",
    size: 70,
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("linked_market_count", {
    header: "Markets",
    size: 70,
    cell: (info) => info.getValue(),
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
    size: 90,
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
    size: 90,
    cell: (info) => formatSim(info.getValue()),
  }),
];

const skeletonWidths: Record<string, string> = {
  status: "h-4 w-16",
  headline: "h-4 w-64",
  media_count: "h-4 w-8",
  distinct_author_count: "h-4 w-8",
  linked_event_count: "h-4 w-8",
  linked_market_count: "h-4 w-8",
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
    />
  );
}
