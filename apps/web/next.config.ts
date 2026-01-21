import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  eslint: {
    // Disable ESLint during builds due to eslint-config-next compatibility issue with ESLint 9
    // Run ESLint separately with `bun run lint`
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002",
      },
      {
        protocol: "https",
        hostname: "api.tatildesen.com",
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
