"use client";

import { usePrivy } from "@privy-io/react-auth";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { capture, identify, initAnalytics, trackPageview } from "../lib/analytics";

/**
 * Analytics side-effects: init + SPA pageviews + identify-on-login.
 * Renders nothing. Must sit inside PrivyProvider (for usePrivy) and be
 * wrapped in <Suspense> (useSearchParams requirement).
 */
export default function PostHogTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticated, user } = usePrivy();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    trackPageview(window.location.origin + pathname + (qs ? `?${qs}` : ""));
  }, [pathname, searchParams]);

  useEffect(() => {
    if (authenticated && user?.id) {
      identify(user.id, { email: user.email?.address });
    }
  }, [authenticated, user?.id, user?.email?.address]);

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
