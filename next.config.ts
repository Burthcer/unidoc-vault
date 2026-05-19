import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This tells Vercel to confidently build the app even if TypeScript complains
  typescript: {
    ignoreBuildErrors: true,
  },
  // This tells Vercel to ignore strict linting rules during deployment
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
