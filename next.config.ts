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
    ];
  },
};

export default nextConfig;
