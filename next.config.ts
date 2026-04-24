import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No special config needed here anymore





typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. Fixes the Termux build crash.
    ignoreBuildErrors: true,
  },



};

export default nextConfig;
