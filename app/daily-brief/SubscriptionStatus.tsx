"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthUser } from "../hooks/useAuthUser";

/**
 * Current subscription state, named: "Subscribed to X" (or paused).
 * Renders nothing for anonymous users or users with no target. Used on
 * the /daily-brief landing and as SubscribeCard's already-subscribed
 * state, so the two can't drift.
 */
export default function SubscriptionStatus() {
  const { authenticated } = usePrivy();
  const { user } = useAuthUser();

  const target = user?.daily_brief_target ?? null;
  if (!authenticated || !target) return null;

  const enabled = user?.notification_settings?.email_daily_brief === true;
  const label = target.handle ?? `${target.wallet.slice(0, 6)}…${target.wallet.slice(-4)}`;
  const briefHref = `/daily-brief?user=${encodeURIComponent((target.handle ?? target.wallet).toLowerCase())}`;

  return (
    <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-sm">
        {enabled ? (
          <>
            Subscribed to{" "}
            <Link href={briefHref} className="font-semibold underline-offset-2 hover:underline">
              {label}
            </Link>{" "}
            ✓{" "}
            <span className="text-muted-foreground">
              This brief arrives in your inbox every morning.
            </span>
          </>
        ) : (
          <>
            Daily brief paused.{" "}
            <span className="text-muted-foreground">
              Subscribed to{" "}
              <Link href={briefHref} className="underline-offset-2 hover:underline">
                {label}
              </Link>
              . Resume in settings.
            </span>
          </>
        )}
      </p>
      <Link
        href="/settings"
        className="shrink-0 text-sm text-muted-foreground underline hover:text-foreground"
      >
        Manage
      </Link>
    </div>
  );
}
