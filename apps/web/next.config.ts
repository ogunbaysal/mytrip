import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
   async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3002/api/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
