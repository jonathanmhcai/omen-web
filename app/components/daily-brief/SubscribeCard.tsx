"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Bell } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authenticateWithPrivy, useAuthUser } from "../../hooks/useAuthUser";
import { useCookieString } from "../../hooks/useCookieString";
import { API_BASE, SESSION_TOKEN_KEY } from "../../lib/constants";
import { User } from "../../lib/types";
import { capture } from "../../lib/analytics";
import SubscriptionStatus from "./SubscriptionStatus";

/**
 * Subscribe CTA shown with a generated brief — the conversion moment.
 * One target per user (MVP): subscribing while subscribed to another
 * trader retargets. State derives from /me (email_daily_brief +
 * daily_brief_target via useAuthUser).
 */
export default function SubscribeCard({ handle }: { handle: string }) {
  const { ready, authenticated, login, user: privyUser } = usePrivy();
  const { user } = useAuthUser();
  const queryClient = useQueryClient();
  const [sessionToken, setSessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const [error, setError] = useState<string | null>(null);
  // Set when an anonymous user clicks Subscribe: the Privy modal opens, and
  // once auth + session token land, the effect below fires the subscribe
  // automatically so there's no second click.
  const [pendingSubscribe, setPendingSubscribe] = useState(false);

  const subscribed = user?.notification_settings?.email_daily_brief === true;
  const target = user?.daily_brief_target ?? null;
  // The page canonicalizes ?user= to lowercase; target.handle carries
  // gamma's casing and target.wallet is lowercase 0x.
  const targetMatches =
    target != null &&
    (target.handle?.toLowerCase() === handle.toLowerCase() ||
      target.wallet === handle.toLowerCase());

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      // By the time this fires, /me has succeeded (see the auto-fire gate),
      // so the session cookie exists; the mint is only a fallback for a
      // signed-in click with a lost/expired cookie.
      const token =
        sessionToken ?? (await authenticateWithPrivy(setSessionToken));
      const res = await fetch(`${API_BASE}/me/daily-brief-target`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ handle }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Subscription failed");
      }
      return (await res.json()) as {
        daily_brief_target: { wallet: string; handle: string | null };
      };
    },
    onSuccess: (data) => {
      // Write the server-confirmed state straight into the /me cache so
      // this card, SubscriptionStatus, and the settings row all flip
      // instantly instead of waiting a refetch round-trip.
      queryClient.setQueryData<User>(["authUser"], (old) =>
        old
          ? {
              ...old,
              notification_settings: {
                push_enabled: true,
                ...old.notification_settings,
                email_daily_brief: true,
              },
              daily_brief_target: data.daily_brief_target,
            }
          : old,
      );
      capture("brief_subscribed", { handle });
      toast.success("Subscribed. First brief arrives tomorrow at 9am ET");
    },
    onError: (err: Error) => {
      setError(
        err.message === "No email on file"
          ? "Your account has no email. Add one in Settings first."
          : `${err.message}. Try again.`,
      );
    },
    // Reconcile with server truth in the background either way.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  function subscribe() {
    capture("brief_subscribe_clicked", { handle });
    if (!authenticated) {
      setPendingSubscribe(true);
      login();
      return;
    }
    setError(null);
    subscribeMutation.mutate();
  }

  // Post-login auto-fire. The ONE precondition is the omen user existing:
  // /me succeeding transitively guarantees Privy auth, the embedded wallet
  // (created async for new accounts, and only server-visible with a lag),
  // /auth/privy, the session cookie, and the user row. Abandoning the
  // login modal never fires (no auth → no /me).
  useEffect(() => {
    if (pendingSubscribe && user) {
      setPendingSubscribe(false);
      setError(null);
      subscribeMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSubscribe, user?.id]);

  // useAuthUser retries provisioning on a lazy 10s poll (retry: false +
  // refetchInterval). While a subscribe intent is waiting on a brand-new
  // account, nudge it every 2s so the wait is seconds, not poll cycles;
  // give up loudly after 45s.
  useEffect(() => {
    if (!pendingSubscribe || !authenticated || user) return;
    const startedAt = Date.now();
    const iv = setInterval(() => {
      if (Date.now() - startedAt > 45_000) {
        clearInterval(iv);
        setPendingSubscribe(false);
        setError(
          "Account setup is taking longer than expected. Hit Subscribe again in a moment.",
        );
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    }, 2_000);
    return () => clearInterval(iv);
  }, [pendingSubscribe, authenticated, user, queryClient]);

  // Subscribed to this exact trader: show the shared named-status card.
  if (subscribed && targetMatches) {
    return <SubscriptionStatus />;
  }

  // Post-login provisioning window: intent armed, auth done, /me not yet
  // succeeded (new accounts) — surface it as in-progress, not idle.
  const settingUp = pendingSubscribe && authenticated && !user;
  const switching = subscribed && target != null && !targetMatches;
  const currentLabel =
    target?.handle ??
    (target ? `${target.wallet.slice(0, 6)}…${target.wallet.slice(-4)}` : "");
  // The Privy account's address — where the brief WOULD go, shown so the
  // destination is visible before committing. Not delivery state: this card
  // only renders pre-subscribe. Signed-out visitors have no email yet, so
  // the line is simply absent until after login.
  const email =
    privyUser?.email?.address ??
    privyUser?.google?.email ??
    privyUser?.apple?.email ??
    null;

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* Stacked on mobile; one row from `sm+`, button hugging its label. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm font-semibold">
              Get this brief in your inbox every morning
            </p>
            <p className="text-xs text-muted-foreground">
              {switching
                ? `You currently receive the brief for ${currentLabel}. Subscribing switches it to ${handle}.`
                : "Delivered 9am ET daily. Unsubscribe anytime."}
            </p>
            {email && (
              <p className="truncate text-xs text-muted-foreground">
                We&apos;ll send it to{" "}
                <span className="text-foreground">{email}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={subscribe}
          disabled={subscribeMutation.isPending || settingUp || !ready}
          className="w-full shrink-0 rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          {subscribeMutation.isPending || settingUp
            ? "Subscribing…"
            : switching
              ? `Switch to ${handle}`
              : "Subscribe"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
