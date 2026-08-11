import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PostHog ingest reverse proxy so ad-blockers don't eat events.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/map",
        destination: "/",
        permanent: true,
      },
      // The daily brief moved to `/`. Sent emails and the unsubscribe page
      // link to the old path; Next forwards the `?user=` query for free.
      {
        source: "/daily-brief",
        destination: "/",
        permanent: false,
      },
      // Former public index routes, deprecated 2026-08-11 (bookmarks and
      // inbound links still point at them). Exact-path sources only —
      // /stories/[id] and /traders/[name] stay live.
      {
        source: "/stories",
        destination: "/",
        permanent: false,
      },
      {
        source: "/traders",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
