import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows build to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
  // Other config options
};

export default nextConfig;