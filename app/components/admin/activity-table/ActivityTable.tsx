"use client";

import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
import Link from "next/link";
import { AdminActivity } from "../../../lib/types";
import { formatFriendlyDate, formatExactDate } from "../../../lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const columnHelper = createColumnHelper<AdminActivity>();

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

const typeColors: Record<string, string> = {
  TRADE: "text-blue-600 dark:text-blue-400",
  REDEEM: "text-green-600 dark:text-green-400",
  REWARD: "text-amber-600 dark:text-amber-400",
  MAKER_REBATE: "text-amber-600 dark:text-amber-400",
  REFERRAL_REWARD: "text-amber-600 dark:text-amber-400",
};

const columns = [
  columnHelper.accessor("timestamp", {
    header: "Time",
    size: 90,
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
    size: 140,
    enableSorting: false,
    cell: (info) => {
      const { username, display_name, user_id } = info.row.original;
      if (!username && !display_name) return "\u2014";
      const parts = [
        username ? `@${username}` : null,
        display_name ? `(${display_name})` : null,
      ]
        .filter(Boolean)
        .join(" ");
      return (
        <Link href={`/admin/users/${user_id}`} className="hover:underline">
          {parts}
        </Link>
      );
    },
  }),
  columnHelper.accessor("type", {
    header: "Type",
    size: 100,
    cell: (info) => {
      const type = info.getValue();
      return (
        <span className={typeColors[type] ?? "text-muted-foreground"}>
          {type}
        </span>
      );
    },
  }),
  columnHelper.accessor("side", {
    header: "Side",
    size: 50,
    enableSorting: false,
    cell: (info) => {
      const side = info.getValue();
      if (!side) return "\u2014";
      return (
        <span
          className={
            side === "BUY"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          {side}
        </span>
      );
    },
  }),
  columnHelper.accessor("title", {
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
  columnHelper.accessor("usdc_size", {
    header: "USDC",
    size: 80,
    cell: (info) => {
      const val = info.getValue();
      if (val == null) return "\u2014";
      return `$${parseFloat(Number(val).toFixed(6))}`;
    },
  }),
  columnHelper.accessor("size", {
    header: "Shares",
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const val = info.getValue();
      if (val == null) return "\u2014";
      return Number(val).toFixed(2);
    },
  }),
  columnHelper.accessor("price", {
    header: "Price",
    size: 60,
    enableSorting: false,
    cell: (info) => {
      const val = info.getValue();
      if (val == null) return "\u2014";
      return `${Number(val).toFixed(2)}`;
    },
  }),
  columnHelper.accessor("transaction_hash", {
    header: "Tx",
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "\u2014";
      return (
        <a
          href={`https://polygonscan.com/tx/${val}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          title={val}
        >
          {val.slice(0, 8)}
        </a>
      );
    },
  }),
];

const skeletonWidths: Record<string, string> = {
  timestamp: "h-4 w-16",
  user: "h-4 w-24",
  type: "h-4 w-16",
  side: "h-4 w-10",
  title: "h-4 w-40",
  outcome: "h-4 w-14",
  usdc_size: "h-4 w-14",
  size: "h-4 w-14",
  price: "h-4 w-12",
  transaction_hash: "h-4 w-14",
};

interface ActivityTableProps {
  activity: AdminActivity[];
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

export default function ActivityTable({
  activity,
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
}: ActivityTableProps) {
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
      data={activity}
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
