"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useAdminInviteCode } from "../../../hooks/admin/useAdminInviteCode";
import { API_BASE, SESSION_TOKEN_KEY } from "../../../lib/constants";
import { useCookieString } from "../../../hooks/useCookieString";
import { formatExactDate, formatFriendlyDate } from "../../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

function formatBonus(atomic: string | null): string {
  if (!atomic) return "—";
  return `$${(parseFloat(atomic) / 1e6).toFixed(2)}`;
}

export default function InviteCodeDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { code, loading, error, refresh } = useAdminInviteCode(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  async function handleArchive() {
    if (!code) return;
    setArchiving(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/invite-codes/${code.id}/archive`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }
      toast(code.archived ? "Invite code unarchived" : "Invite code archived");
      setConfirmOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setArchiving(false);
    }
  }

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

  if (!code) {
    return <p className="text-sm text-muted-foreground">Invite code not found.</p>;
  }

  const inviteLink = `https://omen.trading/invite?code=${code.code}`;
  const usesFull = code.uses_count >= code.max_uses;
  const referrerName = code.referrer_username
    ? `@${code.referrer_username}${code.referrer_display_name ? ` (${code.referrer_display_name})` : ""}`
    : code.referrer_display_name ?? null;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/invite-codes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to invite codes
        </Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-lg font-semibold">{code.code}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              toast("Invite link copied to clipboard");
            }}
            disabled={code.archived || usesFull}
          >
            Copy invite link
          </Button>
          <Button
            variant={code.archived ? "default" : "destructive"}
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            {code.archived ? "Unarchive" : "Archive"}
          </Button>
        </div>
      </div>
      <div className="flex flex-col">
        <Field label="ID">
          <CopyValue label={code.id} value={code.id} />
        </Field>
        <Field label="Code">
          <CopyValue label={code.code} value={code.code} />
        </Field>
        <Field label="Status">
          <span
            className={
              code.archived
                ? "text-muted-foreground"
                : "text-green-600 dark:text-green-400"
            }
          >
            {code.archived ? "archived" : usesFull ? "active (full)" : "active"}
          </span>
        </Field>
        <Field label="Uses">
          {code.uses_count}/{code.max_uses}
        </Field>
        <Field label="Invitee Bonus">{formatBonus(code.bonus_usdc_atomic)}</Field>
        <Field label="Referrer Bonus">
          {formatBonus(code.referrer_bonus_usdc_atomic)}
        </Field>
        <Field label="Referrer">
          {code.referrer_user_id ? (
            <Link
              href={`/admin/users/${code.referrer_user_id}`}
              className="hover:underline"
            >
              {referrerName ?? code.referrer_email ?? code.referrer_user_id}
            </Link>
          ) : (
            "—"
          )}
        </Field>
        <Field label="Referrer Email">{code.referrer_email ?? "—"}</Field>
        <Field label="Created">{formatExactDate(code.created_at)}</Field>
        <Field label="Updated">{formatExactDate(code.updated_at)}</Field>
      </div>
      <h3 className="mb-3 mt-8 text-base font-semibold">
        Redemptions ({code.redemptions.length})
      </h3>
      {code.redemptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No redemptions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-black/[.06] dark:border-white/[.08]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[.06] bg-black/[.02] text-left text-xs uppercase text-muted-foreground dark:border-white/[.08] dark:bg-white/[.03]">
                <th className="px-3 py-2 font-medium">Redeemed</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {code.redemptions.map((r) => {
                const userLabel = r.username
                  ? `@${r.username}${r.display_name ? ` (${r.display_name})` : ""}`
                  : r.display_name ?? r.user_id.slice(0, 8);
                return (
                  <tr
                    key={r.user_id}
                    className="border-b border-black/[.04] last:border-b-0 dark:border-white/[.06]"
                  >
                    <td
                      className="px-3 py-2 text-muted-foreground"
                      title={formatExactDate(r.redeemed_at)}
                    >
                      {formatFriendlyDate(r.redeemed_at)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/users/${r.user_id}`}
                        className="hover:underline"
                      >
                        {userLabel}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.email ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {code.archived ? "Unarchive" : "Archive"} invite code?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {code.archived ? (
              <>
                This will reactivate code{" "}
                <span className="font-mono font-medium text-foreground">
                  {code.code}
                </span>
                .
              </>
            ) : (
              <>
                This will deactivate code{" "}
                <span className="font-mono font-medium text-foreground">
                  {code.code}
                </span>
                . It can no longer be redeemed.
              </>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={code.archived ? "default" : "destructive"}
              onClick={handleArchive}
              disabled={archiving}
            >
              {archiving
                ? code.archived
                  ? "Unarchiving..."
                  : "Archiving..."
                : code.archived
                ? "Unarchive"
                : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
