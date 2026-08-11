import posthog from "posthog-js";

/**
 * PostHog client analytics — same project as omen-server's feature
 * flags (and mobile later), so web/server/app share one user timeline.
 * phc_* project keys are public by design (they ship in every client
 * bundle); the env var exists to override for experiments.
 *
 * Disabled in development so local work doesn't pollute production
 * analytics — set NEXT_PUBLIC_POSTHOG_DEV=1 to test locally.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "phc_CmYsFJVnBodEnSQedEpWkNcFFwEwKkSvLT6EQATv8kxB";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_POSTHOG_DEV) return;
  posthog.init(KEY, {
    // Reverse-proxied through next.config rewrites so ad-blockers
    // don't eat events.
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    capture_pageview: false, // SPA navigations captured manually
    capture_pageleave: true,
  });
  initialized = true;
}

export function trackPageview(url: string) {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: url });
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identify(distinctId: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(distinctId, properties);
}
