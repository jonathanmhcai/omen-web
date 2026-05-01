"use client";

import Link from "next/link";
import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
import {
  AdminTransfer,
  AdminTransferClassification,
} from "../../../lib/types";
import { formatFriendlyDate, formatExactDate } from "../../../lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const columnHelper = createColumnHelper<AdminTransfer>();

function shortAddr(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatClassification(c: AdminTransferClassification): string {
  if (c.kind === "deposit") return `deposit · ${c.source}`;
  return c.kind.replace(/_/g, " ");
}

const classificationColors: Record<string, string> = {
  deposit: "text-emerald-600 dark:text-emerald-400",
  bonus: "text-emerald-600 dark:text-emerald-400",
  withdrawal: "text-red-600 dark:text-red-400",
  collateral_swap: "text-zinc-500 dark:text-zinc-400",
  polymarket_buy: "text-sky-600 dark:text-sky-400",
  polymarket_sell: "text-amber-600 dark:text-amber-400",
  polymarket_redeem: "text-violet-600 dark:text-violet-400",
};

const directionColors: Record<string, string> = {
  in: "text-emerald-600 dark:text-emerald-400",
  out: "text-red-600 dark:text-red-400",
};

const columns = [
  columnHelper.accessor("block_timestamp", {
    header: "Block time",
    size: 80,
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
    size: 150,
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
  columnHelper.accessor("direction", {
    header: "Direction",
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const dir = info.getValue();
      return <span className={directionColors[dir]}>{dir}</span>;
    },
  }),
  columnHelper.display({
    id: "classification",
    header: "Classification",
    size: 130,
    enableSorting: false,
    cell: (info) => {
      const c = info.row.original.classification;
      const className =
        classificationColors[c.kind] ?? "text-zinc-500 dark:text-zinc-400";
      return <span className={className}>{formatClassification(c)}</span>;
    },
  }),
  columnHelper.accessor("from_address", {
    header: "From",
    size: 110,
    enableSorting: false,
    cell: (info) => {
      const value = info.getValue();
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-mono text-xs">{shortAddr(value)}</span>
          </TooltipTrigger>
          <TooltipContent className="font-mono text-xs">{value}</TooltipContent>
        </Tooltip>
      );
    },
  }),
  columnHelper.accessor("to_address", {
    header: "To",
    size: 110,
    enableSorting: false,
    cell: (info) => {
      const value = info.getValue();
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-mono text-xs">{shortAddr(value)}</span>
          </TooltipTrigger>
          <TooltipContent className="font-mono text-xs">{value}</TooltipContent>
        </Tooltip>
      );
    },
  }),
  columnHelper.accessor("amount_usd", {
    header: "Amount",
    size: 100,
    cell: (info) => {
      const amount = Number(info.getValue());
      const symbol = info.row.original.asset_symbol ?? "";
      const formatted = amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return symbol ? `${formatted} ${symbol}` : formatted;
    },
  }),
  columnHelper.accessor("tx_hash", {
    header: "Tx",
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "—";
      return (
        <a
          href={`https://polygonscan.com/tx/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs hover:underline"
          title={value}
        >
          {value.slice(0, 8)}
        </a>
      );
    },
  }),
];

const skeletonWidths: Record<string, string> = {
  block_timestamp: "h-4 w-16",
  user: "h-4 w-28",
  direction: "h-4 w-6",
  classification: "h-4 w-20",
  from_address: "h-4 w-20",
  to_address: "h-4 w-20",
  amount_usd: "h-4 w-16",
  tx_hash: "h-4 w-14",
};

interface TransfersTableProps {
  transfers: AdminTransfer[];
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

export default function TransfersTable({
  transfers,
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
}: TransfersTableProps) {
  const toolbar = (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        On-chain transfers
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
      data={transfers}
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
