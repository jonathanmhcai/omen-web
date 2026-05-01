import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/map",
        destination: "/",
        permanent: true,
      },
      {
        source: "/",
        destination: "https://omen.trading",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
