import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
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
