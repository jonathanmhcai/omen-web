"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { capture, identify, initAnalytics, reset, trackPageview } from "../lib/analytics";
import { useAuthUser } from "../hooks/useAuthUser";

/**
 * Analytics side-effects: init + SPA pageviews + identify-on-login.
 * Renders nothing. Must sit inside PrivyProvider (for usePrivy) and be
 * wrapped in <Suspense> (useSearchParams requirement).
 */
export default function PostHogTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  // useAuthUser refetches every 10s, so `user` is a fresh object each poll.
  // Identify only when the values we actually send change.
  const lastIdentified = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    trackPageview(window.location.origin + pathname + (qs ? `?${qs}` : ""));
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!user?.id) {
      if (lastIdentified.current) {
        reset();
        lastIdentified.current = null;
      }
      return;
    }
    const props = {
      omen_user_id: user.id,
      privy_user_id: user.privy_user_id ?? null,
      // PostHog's internal/test-user filters match on this, so it also has to
      // stay spelled `email` rather than anything more descriptive.
      email: user.email ?? null,
      username: user.username ?? null,
      has_redeemed_invite: user.has_redeemed_invite_code,
      // Attribution. Lets every retention chart segment by campaign or by who
      // referred them, which the invite code records explicitly, so no
      // install-attribution tooling is needed to bridge the App Store gap.
      invite_code: user.invite_code ?? null,
      invited_by_user_id: user.invited_by_user_id ?? null,
      has_polymarket_credentials: user.has_polymarket_credentials,
      // Whether this person is reachable by push at all. Segments every
      // retention chart, since push is the main way anyone comes back.
      has_push_token: user.hasValidPushToken,
      is_admin: user.isAdmin,
      is_preview: user.isPreview,
    };
    const signature = JSON.stringify(props);
    if (lastIdentified.current === signature) return;
    // signup_date is set-once so a later identify (or the mobile client)
    // can't overwrite the true first-seen date and shift the user's cohort.
    identify(user.id, props, { signup_date: user.createdAt });
    lastIdentified.current = signature;
  }, [user]);

  return null;
}

/** Fire a single analytics event on mount — lets server components
 *  report render outcomes (e.g. brief generated / not found). */
export function TrackOnMount({
  event,
  properties,
}: {
  event: string;
  properties?: Record<string, unknown>;
}) {
  useEffect(() => {
    capture(event, properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
