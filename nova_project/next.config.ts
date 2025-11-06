import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.nilesbio.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
    // or: domains: ["www.nilesbio.com"],
  },
};

export default nextConfig;
