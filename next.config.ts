import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // TODO: Ta bort när types är fixade
  },
};

export default nextConfig;
