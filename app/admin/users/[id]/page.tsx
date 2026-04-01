"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { type SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import Link from "next/link";
import { useAdminUser } from "../../../hooks/admin/useAdminUser";
import { useAdminPositions } from "../../../hooks/admin/useAdminPositions";
import PositionsTable from "../../../components/admin/positions-table/PositionsTable";
import { formatExactDate } from "../../../lib/utils";

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <button
      className="cursor-pointer text-left hover:underline"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast("Copied to clipboard");
      }}
      title="Click to copy"
    >
      {label}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2 border-b border-black/[.04] dark:border-white/[.06]">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading, error } = useAdminUser(id);
  const [positionsSorting, setPositionsSorting] = useState<SortingState>([
    { id: "status", desc: true },
    { id: "opened_at", desc: true },
  ]);
  const {
    positions,
    loading: positionsLoading,
    error: positionsError,
    page: positionsPage,
    hasMore: positionsHasMore,
    total: positionsTotal,
    nextPage: positionsNextPage,
    prevPage: positionsPrevPage,
    firstPage: positionsFirstPage,
  } = useAdminPositions({
    sorting: positionsSorting,
    filters: { user_id: id ?? "" },
    limit: 15,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin duration-1000" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">Error: {error}</p>;
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">User not found.</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to users
        </Link>
      </div>
      <h2 className="mb-4 text-lg font-semibold">
        {user.display_name ?? user.username ?? "Unnamed User"}
      </h2>
      <div className="flex flex-col">
        <Field label="ID">
          <CopyValue label={user.id} value={user.id} />
        </Field>
        <Field label="Privy ID">
          <CopyValue label={user.privy_user_id} value={user.privy_user_id} />
        </Field>
        <Field label="Username">{user.username ?? "\u2014"}</Field>
        <Field label="Display Name">{user.display_name ?? "\u2014"}</Field>
        <Field label="Email">{user.emails[0] ?? "\u2014"}</Field>
        <Field label="Wallet">
          {user.wallet_address ? (
            <CopyValue
              label={user.wallet_address}
              value={user.wallet_address}
            />
          ) : (
            "\u2014"
          )}
        </Field>
        <Field label="USDC Balance">
          {user.usdc_balance
            ? `$${parseFloat(user.usdc_balance).toFixed(2)}`
            : "\u2014"}
        </Field>
        <Field label="Created">{formatExactDate(user.created_at)}</Field>
        <Field label="Last Seen">
          {user.last_seen_at ? formatExactDate(user.last_seen_at) : "\u2014"}
        </Field>
        <Field label="Invite Code">{user.invite_code ?? "\u2014"}</Field>
        <Field label="Push Notifications">
          {user.has_push_token ? (
            <span className="flex gap-3">
              <span>
                Resolution:{" "}
                <span
                  className={
                    user.push_enabled ? "text-green-500" : "text-red-400"
                  }
                >
                  {user.push_enabled ? "on" : "off"}
                </span>
              </span>
              <span>
                Following:{" "}
                <span
                  className={
                    user.following_orders_enabled
                      ? "text-green-500"
                      : "text-red-400"
                  }
                >
                  {user.following_orders_enabled ? "on" : "off"}
                </span>
              </span>
            </span>
          ) : (
            "\u2014"
          )}
        </Field>
      </div>
      <h3 className="mb-3 mt-8 text-base font-semibold">Positions</h3>
      <PositionsTable
        positions={positions}
        loading={positionsLoading}
        error={positionsError}
        page={positionsPage}
        hasMore={positionsHasMore}
        total={positionsTotal}
        onNextPage={positionsNextPage}
        onPrevPage={positionsPrevPage}
        onFirstPage={positionsFirstPage}
        sorting={positionsSorting}
        onSortingChange={setPositionsSorting}
      />
    </div>
  );
}
