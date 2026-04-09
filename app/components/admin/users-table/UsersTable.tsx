"use client";

import { useEffect, useRef } from "react";
import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
import Link from "next/link";
import { AdminUser } from "../../../lib/types";
import { formatFriendlyDate, formatExactDate } from "../../../lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const columnHelper = createColumnHelper<AdminUser>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const id = info.getValue();
      return (
        <button
          className="cursor-pointer hover:underline"
          onClick={() => {
            navigator.clipboard.writeText(id);
            toast("ID copied to clipboard");
          }}
          title={id}
        >
          {id.slice(0, 8)}
        </button>
      );
    },
  }),
  columnHelper.accessor("privy_user_id", {
    header: "Privy ID",
    size: 100,
    enableSorting: false,
    cell: (info) => {
      const id = info.getValue();
      return (
        <button
          className="cursor-pointer hover:underline"
          onClick={() => {
            navigator.clipboard.writeText(id);
            toast("Privy ID copied to clipboard");
          }}
          title={id}
        >
          {id.slice(0, 12)}
        </button>
      );
    },
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
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
  columnHelper.accessor("last_seen_at", {
    header: "Last Seen",
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
    size: 200,
    enableSorting: false,
    cell: (info) => {
      const { username, display_name, id } = info.row.original;
      if (!username && !display_name) return "\u2014";
      const parts = [
        username ? `@${username}` : null,
        display_name ? `(${display_name})` : null,
      ].filter(Boolean).join(" ");
      return (
        <Link href={`/admin/users/${id}`} className="hover:underline">
          {parts}
        </Link>
      );
    },
  }),
  columnHelper.accessor((row) => row.emails[0] ?? "\u2014", {
    id: "email",
    header: "Email",
    size: 220,
    enableSorting: false,
  }),
  columnHelper.accessor("wallet_address", {
    header: "Wallet",
    size: 140,
    enableSorting: false,
    cell: (info) => {
      const addr = info.getValue();
      if (!addr) return "\u2014";
      return (
        <button
          className="cursor-pointer hover:underline"
          onClick={() => {
            navigator.clipboard.writeText(addr);
            toast("Wallet address copied to clipboard");
          }}
          title={addr}
        >
          {addr.slice(0, 6)}...{addr.slice(-4)}
        </button>
      );
    },
  }),
  columnHelper.accessor("usdc_balance", {
    header: "USDC",
    size: 90,
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "\u2014";
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      return `$${num.toFixed(2)}`;
    },
  }),
  columnHelper.accessor("invite_code", {
    header: "Invite Code",
    size: 110,
    enableSorting: false,
    cell: (info) => info.getValue() ?? "\u2014",
  }),
  columnHelper.display({
    id: "notifications",
    header: "Notifs",
    size: 60,
    enableSorting: false,
    cell: (info) => {
      const row = info.row.original;
      if (!row.has_push_token)
        return <span className="text-muted-foreground">{"\u2014"}</span>;
      return <span className="text-green-500">{"\u2713"}</span>;
    },
  }),
];

const skeletonWidths: Record<string, string> = {
  id: "h-4 w-14",
  privy_user_id: "h-4 w-20",
  user: "h-4 w-24",
  email: "h-4 w-24",
  wallet_address: "h-4 w-24",
  usdc_balance: "h-4 w-16",
  invite_code: "h-4 w-20",
  created_at: "h-4 w-20",
  last_seen_at: "h-4 w-20",
  notifications: "h-4 w-12",
};

interface UsersTableProps {
  users: AdminUser[];
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
}

export default function UsersTable({
  users,
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
}: UsersTableProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== "INPUT") {
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
        placeholder="Search users... (/)"
        className="w-56 rounded-lg border border-black/[.08] px-3 py-1.5 text-sm placeholder:text-muted-foreground dark:border-white/[.145]"
      />
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
      data={users}
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
