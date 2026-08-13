"use client";

import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import Link from "next/link";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
import { AdminDailyBrief } from "../../../lib/types";
import { formatFriendlyDate, formatExactDate } from "../../../lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const columnHelper = createColumnHelper<AdminDailyBrief>();

const shortWallet = (w: string) => `${w.slice(0, 6)}…${w.slice(-4)}`;

/**
 * A ledger row means the send loop reached a decision for that user that day.
 * "No news" is the one that reads wrong at a glance: it isn't a failure, it
 * means the brief was built and had no stories or movers, so nothing was
 * sent rather than spending inbox trust on an empty email.
 */
const RESULT_LABELS: Record<string, { label: string; tone: string }> = {
  sent: { label: "Sent", tone: "text-green-600 dark:text-green-400" },
  skipped_empty: { label: "No news", tone: "text-muted-foreground" },
  no_email: { label: "No email", tone: "text-red-500" },
  sending: { label: "Stuck", tone: "text-amber-600 dark:text-amber-400" },
};

const columns = [
  columnHelper.accessor("email", {
    header: "User",
    size: 220,
    cell: (info) => {
      const email = info.getValue();
      return (
        <Link
          href={`/admin/users/${info.row.original.user_id}`}
          className="hover:underline"
          title={email ?? undefined}
        >
          {email ?? "—"}
        </Link>
      );
    },
  }),
  columnHelper.accessor("target_handle", {
    header: "Target",
    size: 150,
    cell: (info) => {
      const { target_handle, target_wallet } = info.row.original;
      const label = target_handle ?? shortWallet(target_wallet);
      return (
        <a
          href={`/?user=${encodeURIComponent((target_handle ?? target_wallet).toLowerCase())}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          title={target_wallet}
        >
          {label}
        </a>
      );
    },
  }),
  columnHelper.accessor("active", {
    header: "Status",
    size: 90,
    cell: (info) =>
      info.getValue() ? (
        <span className="text-green-600 dark:text-green-400">Active</span>
      ) : (
        // Paused keeps its target, so these rows are the churn signal: they
        // signed up, received briefs, and turned it off.
        <span className="text-amber-600 dark:text-amber-400">Paused</span>
      ),
  }),
  columnHelper.accessor("last_brief_date", {
    header: "Last brief",
    size: 100,
    enableSorting: false,
    cell: (info) => {
      const value = info.getValue();
      if (!value) return <span className="text-muted-foreground">Never</span>;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{formatFriendlyDate(value)}</span>
          </TooltipTrigger>
          <TooltipContent>{formatExactDate(value)}</TooltipContent>
        </Tooltip>
      );
    },
  }),
  columnHelper.accessor("last_status", {
    header: "Result",
    size: 90,
    enableSorting: false,
    cell: (info) => {
      const status = info.getValue();
      if (!status) return <span className="text-muted-foreground">{"—"}</span>;
      const meta = RESULT_LABELS[status] ?? {
        label: status,
        tone: "text-muted-foreground",
      };
      return <span className={meta.tone}>{meta.label}</span>;
    },
  }),
  columnHelper.accessor("last_story_count", {
    header: "Stories",
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const n = info.getValue();
      return n == null ? (
        <span className="text-muted-foreground">{"—"}</span>
      ) : (
        <span className="tabular-nums">{n}</span>
      );
    },
  }),
  columnHelper.accessor("send_count", {
    header: "Sends",
    size: 70,
    enableSorting: false,
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  columnHelper.accessor("updated_at", {
    header: "Signed up",
    size: 100,
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "—";
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{formatFriendlyDate(value)}</span>
          </TooltipTrigger>
          <TooltipContent>{formatExactDate(value)}</TooltipContent>
        </Tooltip>
      );
    },
  }),
];

const skeletonWidths: Record<string, string> = {
  email: "h-4 w-40",
  target_handle: "h-4 w-24",
  active: "h-4 w-12",
  last_brief_date: "h-4 w-16",
  last_status: "h-4 w-12",
  last_story_count: "h-4 w-6",
  send_count: "h-4 w-6",
  updated_at: "h-4 w-16",
};

export default function DailyBriefsTable({
  briefs,
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
}: {
  briefs: AdminDailyBrief[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number | null;
  onNextPage: () => void;
  onPrevPage: () => void;
  onFirstPage: () => void;
  sorting: SortingState;
  onSortingChange: (s: SortingState) => void;
}) {
  const toolbar = (
    <div className="flex items-center gap-3">
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
      data={briefs}
      columns={columns}
      loading={loading}
      error={error}
      sorting={sorting}
      onSortingChange={onSortingChange}
      // The server sorts; without this TanStack would re-sort the page's
      // rows on top of it and disagree with the pagination.
      manualSorting={true}
      skeletonWidths={skeletonWidths}
      toolbar={toolbar}
    />
  );
}
