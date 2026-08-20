"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Bell, BellOff } from "lucide-react";
import { useAuthUser } from "../../hooks/useAuthUser";

/**
 * Current subscription state, named: "Subscribed to X" (or paused).
 * Renders nothing for anonymous users or users with no target. Used on
 * the daily-brief landing (`/daily-brief`) and as SubscribeCard's
 * already-subscribed state, so the two can't drift.
 */
export default function SubscriptionStatus() {
  const { authenticated } = usePrivy();
  const { user } = useAuthUser();

  const target = user?.daily_brief_target ?? null;
  if (!authenticated || !target) return null;

  const enabled = user?.notification_settings?.email_daily_brief === true;
  const label = target.handle ?? `${target.wallet.slice(0, 6)}…${target.wallet.slice(-4)}`;
  const briefHref = `/daily-brief?user=${encodeURIComponent((target.handle ?? target.wallet).toLowerCase())}`;

  const Icon = enabled ? Bell : BellOff;

  // Same card shape as SubscribeCard — this is that callout's subscribed
  // state, so the two read as one component changing state.
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-semibold">
            {enabled ? (
              <>
                Subscribed to{" "}
                <Link href={briefHref} className="underline-offset-2 hover:underline">
                  {label}
                </Link>
              </>
            ) : (
              "Daily brief paused"
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {enabled ? (
              "Arrives in your inbox every morning at 9am ET."
            ) : (
              <>
                Subscribed to{" "}
                <Link href={briefHref} className="underline-offset-2 hover:underline">
                  {label}
                </Link>
                . Resume it in settings.
              </>
            )}
          </p>
        </div>
      </div>
      <Link
        href="/settings"
        className="flex w-full shrink-0 items-center justify-center rounded-md border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-accent sm:w-auto"
      >
        Manage in settings
      </Link>
    </div>
  );
}
