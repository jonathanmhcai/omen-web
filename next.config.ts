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
      // The daily brief was `/` from 2026-08-11 to 2026-08-20, so sent
      // emails link to `/?user=<handle>`. Only that shape forwards — a bare
      // `/` is the about page. Next carries the query over for free.
      {
        source: "/",
        has: [{ type: "query", key: "user" }],
        destination: "/daily-brief",
        permanent: false,
      },
      // Former public index route, deprecated 2026-08-11 (bookmarks and
      // inbound links still point at it). Exact-path source only —
      // /stories/[id] stays live.
      {
        source: "/stories",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
