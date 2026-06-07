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
  columnHelper.accessor("deposit_wallet_address", {
    header: "Deposit wallet",
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
            toast("Deposit wallet address copied to clipboard");
          }}
          title={addr}
        >
          {addr.slice(0, 6)}...{addr.slice(-4)}
        </button>
      );
    },
  }),
  columnHelper.display({
    id: "funding_wallets",
    header: "Funding wallet",
    size: 150,
    enableSorting: false,
    cell: (info) => {
      const accounts = info.row.original.accounts ?? [];
      const funders = accounts.filter((a) => a.funder_address);
      if (funders.length === 0) return "—";
      return (
        <div className="flex flex-col gap-0.5">
          {funders.map((a, i) => {
            const addr = a.funder_address as string;
            const imported = a.kind !== "managed";
            return (
              <button
                key={i}
                className="flex cursor-pointer items-center gap-1 hover:underline"
                onClick={() => {
                  navigator.clipboard.writeText(addr);
                  toast("Funding wallet address copied to clipboard");
                }}
                title={`${imported ? "Imported" : "Managed"} — ${addr}`}
              >
                <span
                  className={
                    imported ? "text-amber-500" : "text-muted-foreground"
                  }
                >
                  {imported ? "I" : "M"}
                </span>
                <span>
                  {addr.slice(0, 6)}...{addr.slice(-4)}
                </span>
              </button>
            );
          })}
        </div>
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
  columnHelper.display({
    id: "onboarding",
    header: "Onboarding",
    size: 80,
    enableSorting: false,
    cell: (info) => {
      const row = info.row.original;
      const steps = ["invite_code", "profile", "push_notifications"];
      const completed = row.completed_onboarding_steps ?? [];
      return (
        <span className="flex gap-1">
          {steps.map((step) => (
            <span
              key={step}
              className={completed.includes(step) ? "text-green-500" : "text-muted-foreground"}
            >
              {completed.includes(step) ? "✓" : "·"}
            </span>
          ))}
        </span>
      );
    },
  }),
];

const skeletonWidths: Record<string, string> = {
  id: "h-4 w-14",
  privy_user_id: "h-4 w-20",
  user: "h-4 w-24",
  email: "h-4 w-24",
  wallet_address: "h-4 w-24",
  deposit_wallet_address: "h-4 w-24",
  funding_wallets: "h-4 w-24",
  usdc_balance: "h-4 w-16",
  invite_code: "h-4 w-20",
  created_at: "h-4 w-20",
  last_seen_at: "h-4 w-20",
  notifications: "h-4 w-12",
  onboarding: "h-4 w-20",
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
  redeemedOnly: boolean;
  onRedeemedOnlyChange: (value: boolean) => void;
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
  redeemedOnly,
  onRedeemedOnlyChange,
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
      <label className="flex items-center gap-2 whitespace-nowrap text-sm">
        <input
          type="checkbox"
          checked={redeemedOnly}
          onChange={(e) => onRedeemedOnlyChange(e.target.checked)}
        />
        Redeemed invite
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
