"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import DataTable from "../data-table/DataTable";
import { PolymarketEvent } from "../../lib/types";
import { formatFriendlyDate, formatRelativeTime, formatNumber } from "../../lib/utils";

import { tagColor } from "../../lib/tags";

function EventImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return <div className="h-8 w-8 rounded-md bg-zinc-200 dark:bg-zinc-800" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={32}
      height={32}
      className="rounded-md object-cover"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
}

export interface ExcludedTag {
  id: string;
  label: string;
}

export interface EventFilters {
  active: boolean;
  archived: boolean;
  featured: boolean;
  endDateMin: Date | undefined;
  volumeMin: number | undefined;
  excludedTags: ExcludedTag[];
}

interface EventTableProps {
  events: PolymarketEvent[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onFirstPage: () => void;
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const columnHelper = createColumnHelper<PolymarketEvent>();

const columns = [
  columnHelper.display({
    id: "image",
    header: "",
    size: 36,
    cell: ({ row }) => (
      <div className="h-8 w-8">
        {row.original.image ? (
          <EventImage src={row.original.image.trimEnd()} alt={row.original.title} />
        ) : (
          <div className="h-8 w-8 rounded-md bg-zinc-200 dark:bg-zinc-800" />
        )}
      </div>
    ),
  }),
  columnHelper.accessor("title", {
    header: "Title",
    size: 260,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5">
        {row.original.featured && <span className="text-yellow-500" title="Featured">&#9733;</span>}
        <a
          href={`https://polymarket.com/event/${row.original.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {row.original.title}
        </a>
      </span>
    ),
  }),
  columnHelper.accessor("startDate", {
    header: "Start",
    size: 50,
    cell: (info) => formatRelativeTime(info.getValue()),
  }),
  columnHelper.accessor("endDate", {
    header: "End",
    size: 70,
    cell: (info) => formatFriendlyDate(info.getValue()),
  }),
  columnHelper.accessor("volume", {
    header: "Volume",
    size: 50,
    enableSorting: false,
    cell: (info) => formatNumber(info.getValue()),
  }),
  columnHelper.accessor("volume24hr", {
    header: "24h Vol",
    size: 50,
    enableSorting: false,
    cell: (info) => formatNumber(info.getValue()),
  }),
  columnHelper.accessor("liquidity", {
    header: "Liquidity",
    size: 50,
    enableSorting: false,
    cell: (info) => formatNumber(info.getValue()),
  }),
  columnHelper.accessor("tags", {
    header: "Tags",
    size: 160,
    enableSorting: false,
    cell: (info) => {
      const tags = info.getValue();
      if (!tags?.length) return "\u2014";
      const sorted = [...tags].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      return (
        <div className="flex gap-1 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {sorted.map((tag) => (
            <Tooltip key={tag.id}>
              <TooltipTrigger asChild>
                <span
                  className={`shrink-0 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(tag.id)}`}
                >
                  {tag.label}
                </span>
              </TooltipTrigger>
              <TooltipContent>{tag.id}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      );
    },
  }),
  columnHelper.accessor("seriesSlug", {
    header: "Series",
    size: 80,
    enableSorting: false,
    cell: (info) => {
      const slug = info.getValue();
      if (!slug) return "\u2014";
      return (
        <span className="shrink-0 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {slug}
        </span>
      );
    },
  }),
];

const skeletonWidths: Record<string, string> = {
  image: "h-8 w-8 rounded-md",
  title: "h-4 w-40",
  startDate: "h-4 w-20",
  endDate: "h-4 w-20",
  volume: "h-4 w-16",
  volume24hr: "h-4 w-16",
  liquidity: "h-4 w-16",
  tags: "h-4 w-24",
  series: "h-4 w-16",
};


export default function EventTable({ events, loading, error, page, hasMore, onNextPage, onPrevPage, onFirstPage, filters, onFiltersChange, sorting, onSortingChange, searchQuery, onSearchChange }: EventTableProps) {
  const [tagInput, setTagInput] = useState("");
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  function addExcludedTag() {
    const id = tagInput.trim();
    if (!id || filters.excludedTags.some((t) => t.id === id)) return;
    onFiltersChange({ ...filters, excludedTags: [...filters.excludedTags, { id, label: id }] });
    setTagInput("");
  }

  function removeExcludedTag(id: string) {
    onFiltersChange({ ...filters, excludedTags: filters.excludedTags.filter((t) => t.id !== id) });
  }

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={filters.active}
            onChange={(e) => onFiltersChange({ ...filters, active: e.target.checked })}
            className="rounded"
          />
          Active
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={filters.archived}
            onChange={(e) => onFiltersChange({ ...filters, archived: e.target.checked })}
            className="rounded"
          />
          Hide archived
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={filters.featured}
            onChange={(e) => onFiltersChange({ ...filters, featured: e.target.checked })}
            className="rounded"
          />
          Featured
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">Ends after</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-md border border-input px-2 py-1 text-left text-sm hover:bg-accent">
                {filters.endDateMin
                  ? filters.endDateMin.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Any"}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDateMin}
                onSelect={(date) => onFiltersChange({ ...filters, endDateMin: date })}
              />
            </PopoverContent>
          </Popover>
          {filters.endDateMin && (
            <button
              onClick={() => onFiltersChange({ ...filters, endDateMin: undefined })}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">Min vol</span>
          <input
            type="number"
            value={filters.volumeMin ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, volumeMin: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Any"
            className="w-24 rounded-md border border-input px-2 py-1 text-sm"
          />
          {filters.volumeMin != null && (
            <button
              onClick={() => onFiltersChange({ ...filters, volumeMin: undefined })}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={onFirstPage}
            disabled={page === 0}
            className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm disabled:opacity-30 dark:border-white/[.145]"
          >
            First
          </button>
          <button
            onClick={onPrevPage}
            disabled={page === 0}
            className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm disabled:opacity-30 dark:border-white/[.145]"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Page {page + 1}
          </span>
          <button
            onClick={onNextPage}
            disabled={!hasMore}
            className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm disabled:opacity-30 dark:border-white/[.145]"
          >
            Next
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">Search</span>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search events by title..."
          className="w-64 rounded-md border border-input px-2 py-1 text-sm"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch("")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm text-muted-foreground">Exclude tags</span>
        {filters.excludedTags.map((tag) => (
          <span
            key={tag.id}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(tag.id)}`}
          >
            {tag.label}
            <button
              onClick={() => removeExcludedTag(tag.id)}
              className="opacity-60 hover:opacity-100"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExcludedTag(); } }}
          placeholder="Add tag ID"
          className="w-24 rounded-md border border-input px-2 py-0.5 text-xs"
        />
      </div>
    </div>
  );

  return (
    <DataTable
      data={events}
      columns={columns}
      loading={loading}
      error={error}
      sorting={sorting}
      onSortingChange={onSortingChange}
      manualSorting
      skeletonWidths={skeletonWidths}
      toolbar={toolbar}
    />
  );
}
