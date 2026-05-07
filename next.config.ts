import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // <--- THIS LINE MUST BE HERE
  },
};

export default nextConfig;
