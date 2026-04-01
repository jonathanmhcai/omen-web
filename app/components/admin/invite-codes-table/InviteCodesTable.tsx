"use client";

import { useMemo, useState } from "react";
import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import DataTable from "../data-table/DataTable";
import Pagination from "../data-table/Pagination";
import { AdminInviteCode } from "../../../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../../../lib/constants";
import { formatFriendlyDate, formatExactDate } from "../../../lib/utils";
import { useCookieString } from "../../../hooks/useCookieString";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<AdminInviteCode>();

const columns = [
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
  columnHelper.accessor("code", {
    header: "Code",
    size: 160,
    enableSorting: false,
    cell: (info) => {
      const code = info.getValue();
      return (
        <button
          className="cursor-pointer font-mono hover:underline"
          onClick={() => {
            navigator.clipboard.writeText(code);
            toast("Code copied to clipboard");
          }}
          title={code}
        >
          {code}
        </button>
      );
    },
  }),
  columnHelper.accessor("uses_count", {
    header: "Uses",
    size: 60,
    cell: (info) => {
      const row = info.row.original;
      return `${row.uses_count}/${row.max_uses}`;
    },
  }),
  columnHelper.accessor("bonus_usdc_atomic", {
    header: "Invitee Bonus",
    size: 80,
    enableSorting: false,
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "\u2014";
      const usdc = parseFloat(val) / 1e6;
      return `$${usdc.toFixed(2)}`;
    },
  }),
  columnHelper.accessor("referrer_bonus_usdc_atomic", {
    header: "Referrer Bonus",
    size: 80,
    enableSorting: false,
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "\u2014";
      const usdc = parseFloat(val) / 1e6;
      return `$${usdc.toFixed(2)}`;
    },
  }),
  columnHelper.accessor("referrer_email", {
    header: "Referrer",
    size: 200,
    enableSorting: false,
    cell: (info) => info.getValue() ?? "\u2014",
  }),
  columnHelper.accessor("archived", {
    header: "Status",
    size: 70,
    enableSorting: false,
    cell: (info) => {
      const archived = info.getValue();
      return (
        <span
          className={
            archived
              ? "text-muted-foreground"
              : "text-green-600 dark:text-green-400"
          }
        >
          {archived ? "archived" : "active"}
        </span>
      );
    },
  }),
];

function ActionsCell({
  row,
  onArchived,
}: {
  row: AdminInviteCode;
  onArchived?: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const canCopy = !row.archived && row.uses_count < row.max_uses;

  async function handleArchive() {
    setArchiving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/invite-codes/${row.id}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }
      toast(row.archived ? "Invite code unarchived" : "Invite code archived");
      setConfirmOpen(false);
      onArchived?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setArchiving(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded p-0.5 hover:bg-accent">
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!canCopy}
            onClick={() => {
              const link = `https://omen.trading/invite?code=${row.code}`;
              navigator.clipboard.writeText(link);
              toast("Invite link copied to clipboard");
            }}
          >
            Copy invite link
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className={row.archived ? "" : "text-red-600 dark:text-red-400"}
          >
            {row.archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{row.archived ? "Unarchive" : "Archive"} invite code?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {row.archived
              ? <>This will reactivate code <span className="font-mono font-medium text-foreground">{row.code}</span>.</>
              : <>This will deactivate code <span className="font-mono font-medium text-foreground">{row.code}</span>. It can no longer be redeemed.</>
            }
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={row.archived ? "default" : "destructive"}
              onClick={handleArchive}
              disabled={archiving}
            >
              {archiving ? (row.archived ? "Unarchiving..." : "Archiving...") : (row.archived ? "Unarchive" : "Archive")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const skeletonWidths: Record<string, string> = {
  code: "h-4 w-28",
  uses_count: "h-4 w-10",
  archived: "h-4 w-12",
  bonus_usdc_atomic: "h-4 w-12",
  referrer_bonus_usdc_atomic: "h-4 w-12",
  referrer_email: "h-4 w-32",
  created_at: "h-4 w-20",
  actions: "h-4 w-4",
};

interface InviteCodesTableProps {
  codes: AdminInviteCode[];
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
  onCreated?: () => void;
}

export default function InviteCodesTable({
  codes,
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
  onCreated,
}: InviteCodesTableProps) {
  const allColumns = useMemo(
    () => [
      ...columns,
      columnHelper.display({
        id: "actions",
        header: "",
        size: 40,
        cell: (info) => (
          <ActionsCell row={info.row.original} onArchived={onCreated} />
        ),
      }),
    ],
    [onCreated]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formCount, setFormCount] = useState("1");
  const [formMaxUses, setFormMaxUses] = useState("1");
  const [formInviteeBonus, setFormInviteeBonus] = useState("");
  const [formReferrerBonus, setFormReferrerBonus] = useState("");
  const [formReferrerEmail, setFormReferrerEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  function resetForm() {
    setFormCount("1");
    setFormMaxUses("1");
    setFormInviteeBonus("");
    setFormReferrerBonus("");
    setFormReferrerEmail("");
    setFormError(null);
  }

  async function handleCreate() {
    setCreating(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = {
        count: parseInt(formCount) || 0,
        max_uses: parseInt(formMaxUses) || 0,
      };
      if (formInviteeBonus) body.invitee_bonus = parseFloat(formInviteeBonus);
      if (formReferrerBonus) body.referrer_bonus = parseFloat(formReferrerBonus);
      if (formReferrerEmail.trim()) body.referrer_email = formReferrerEmail.trim();

      const res = await fetch(`${API_BASE}/admin/invite-codes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }

      toast(`Created ${formCount} invite code(s)`);
      setDialogOpen(false);
      resetForm();
      onCreated?.();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const toolbar = (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          resetForm();
          setDialogOpen(true);
        }}
      >
        <Plus className="h-4 w-4" />
        Create codes
      </Button>
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
    <>
      <DataTable
        data={codes}
        columns={allColumns}
        loading={loading}
        error={error}
        sorting={sorting}
        onSortingChange={onSortingChange}
        manualSorting={true}
        skeletonWidths={skeletonWidths}
        toolbar={toolbar}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invite Codes</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Number of codes</span>
              <input
                type="number"
                min={1}
                max={100}
                value={formCount}
                onChange={(e) => setFormCount(e.target.value)}
                className="rounded-md border border-input px-3 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Max uses per code</span>
              <input
                type="number"
                min={1}
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
                className="rounded-md border border-input px-3 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Invitee bonus (USD, optional)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formInviteeBonus}
                onChange={(e) => setFormInviteeBonus(e.target.value)}
                placeholder="0.00"
                className="rounded-md border border-input px-3 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Referrer bonus (USD, optional)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formReferrerBonus}
                onChange={(e) => setFormReferrerBonus(e.target.value)}
                placeholder="0.00"
                className="rounded-md border border-input px-3 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Referrer email (optional)</span>
              <input
                type="email"
                value={formReferrerEmail}
                onChange={(e) => setFormReferrerEmail(e.target.value)}
                placeholder="user@example.com"
                className="rounded-md border border-input px-3 py-1.5 text-sm"
              />
            </label>
            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
