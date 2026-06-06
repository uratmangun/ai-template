import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        hostname: "models.dev",
        pathname: "/logos/**",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
