"use client";

import Link from "next/link";
import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
import { AdminDeposit } from "../../../lib/types";
import { formatFriendlyDate, formatExactDate } from "../../../lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const columnHelper = createColumnHelper<AdminDeposit>();

const statusColors: Record<string, string> = {
  settled: "text-emerald-600 dark:text-emerald-400",
  failed: "text-red-600 dark:text-red-400",
  initiated: "text-zinc-500 dark:text-zinc-400",
  pending: "text-amber-600 dark:text-amber-400",
  bridging: "text-amber-600 dark:text-amber-400",
};

const columns = [
  columnHelper.accessor("settled_at", {
    header: "Settled",
    size: 70,
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
  columnHelper.accessor("created_at", {
    header: "Created",
    size: 70,
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
  columnHelper.display({
    id: "user",
    header: "User",
    size: 160,
    enableSorting: false,
    cell: (info) => {
      const { username, display_name, user_id } = info.row.original;
      const parts = [
        username ? `@${username}` : null,
        display_name ? `(${display_name})` : null,
      ]
        .filter(Boolean)
        .join(" ");
      return (
        <Link href={`/admin/users/${user_id}`} className="hover:underline">
          {parts || user_id.slice(0, 8)}
        </Link>
      );
    },
  }),
  columnHelper.accessor("provider", {
    header: "Method",
    size: 90,
    cell: (info) => <span className="capitalize">{info.getValue()}</span>,
  }),
  columnHelper.accessor("amount_usd", {
    header: "Amount",
    size: 100,
    cell: (info) => {
      const amount = Number(info.getValue());
      const currency = info.row.original.currency;
      const formatted = amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return currency === "USD" ? `$${formatted}` : `${formatted} ${currency}`;
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 100,
    cell: (info) => {
      const status = info.getValue();
      const failureReason = info.row.original.failure_reason;
      const className =
        statusColors[status] ?? "text-zinc-500 dark:text-zinc-400";
      if (status === "failed" && failureReason) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={className}>{status}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {failureReason}
            </TooltipContent>
          </Tooltip>
        );
      }
      return <span className={className}>{status}</span>;
    },
  }),
];

const skeletonWidths: Record<string, string> = {
  settled_at: "h-4 w-16",
  created_at: "h-4 w-16",
  user: "h-4 w-28",
  provider: "h-4 w-16",
  amount_usd: "h-4 w-16",
  status: "h-4 w-14",
};

interface DepositsTableProps {
  deposits: AdminDeposit[];
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

export default function DepositsTable({
  deposits,
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
}: DepositsTableProps) {
  const toolbar = (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Fiat deposits
      </h2>
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
      data={deposits}
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
