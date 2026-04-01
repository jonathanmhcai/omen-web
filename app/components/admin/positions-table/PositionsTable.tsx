"use client";

import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
import Link from "next/link";
import { AdminPosition } from "../../../lib/types";
import { formatFriendlyDate, formatExactDate } from "../../../lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const columnHelper = createColumnHelper<AdminPosition>();

function CopyCell({ value, truncate }: { value: string; truncate?: number }) {
  return (
    <button
      className="cursor-pointer hover:underline"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast("Copied to clipboard");
      }}
      title={value}
    >
      {truncate ? value.slice(0, truncate) : value}
    </button>
  );
}

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    size: 70,
    enableSorting: false,
    cell: (info) => <CopyCell value={info.getValue()} truncate={8} />,
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
    size: 70,
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "\u2014";
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
  columnHelper.accessor("opened_at", {
    header: "Opened",
    size: 70,
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "\u2014";
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
  columnHelper.accessor("closed_at", {
    header: "Closed",
    size: 70,
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "\u2014";
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
  columnHelper.display({
    id: "user",
    header: "User",
    size: 160,
    enableSorting: false,
    cell: (info) => {
      const { username, display_name, user_id } = info.row.original;
      if (!username && !display_name) return "\u2014";
      const parts = [
        username ? `@${username}` : null,
        display_name ? `(${display_name})` : null,
      ].filter(Boolean).join(" ");
      return (
        <Link href={`/admin/users/${user_id}`} className="hover:underline">
          {parts}
        </Link>
      );
    },
  }),
  columnHelper.accessor("market_title", {
    header: "Market",
    size: 260,
    enableSorting: false,
    cell: (info) => {
      const title = info.getValue();
      if (!title) return "\u2014";
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block truncate font-medium">{title}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{title}</TooltipContent>
        </Tooltip>
      );
    },
  }),
  columnHelper.accessor("outcome", {
    header: "Outcome",
    size: 80,
    enableSorting: false,
    cell: (info) => info.getValue() ?? "\u2014",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 55,
    cell: (info) => {
      const status = info.getValue();
      return (
        <span
          className={
            status === "open"
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground"
          }
        >
          {status}
        </span>
      );
    },
  }),
  columnHelper.accessor("market_end_date", {
    header: "End Date",
    size: 90,
    enableSorting: false,
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "\u2014";
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
  columnHelper.accessor("shares", {
    header: "Shares",
    size: 70,
    cell: (info) => {
      const val = info.getValue();
      if (val == null) return "\u2014";
      return Number(val).toFixed(2);
    },
  }),
  columnHelper.accessor("avg_entry_price", {
    header: "Avg Price",
    size: 65,
    cell: (info) => {
      const val = info.getValue();
      if (val == null) return "\u2014";
      return `$${Number(val).toFixed(2)}`;
    },
  }),
  columnHelper.display({
    id: "cost",
    header: "Cost",
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const { shares, avg_entry_price } = info.row.original;
      if (shares == null || avg_entry_price == null) return "\u2014";
      return `$${(Number(shares) * Number(avg_entry_price)).toFixed(2)}`;
    },
  }),
];

const skeletonWidths: Record<string, string> = {
  id: "h-4 w-14",
  user: "h-4 w-24",
  market_title: "h-4 w-8",
  market_end_date: "h-4 w-20",
  outcome: "h-4 w-14",
  status: "h-4 w-12",
  shares: "h-4 w-16",
  avg_entry_price: "h-4 w-16",
  cost: "h-4 w-16",
  opened_at: "h-4 w-20",
  closed_at: "h-4 w-20",
  created_at: "h-4 w-20",
};

interface PositionsTableProps {
  positions: AdminPosition[];
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
}

export default function PositionsTable({
  positions,
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
}: PositionsTableProps) {
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
      data={positions}
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
