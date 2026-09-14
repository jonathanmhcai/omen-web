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
      // News pipeline removed 2026-09-14. Sent brief emails link to
      // `/?user=<handle>` and `/daily-brief`; story links point at
      // `/stories/:id`. All of it now lands on the about page rather than
      // 404ing, since those links live in inboxes we can't edit.
      {
        source: "/daily-brief",
        destination: "/",
        permanent: false,
      },
      {
        source: "/stories",
        destination: "/",
        permanent: false,
      },
      {
        source: "/stories/:id",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
