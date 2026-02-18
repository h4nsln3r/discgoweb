import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // TODO: Ta bort när types är fixade
  },
  webpack: (config) => {
    // Tysta Supabase realtime-js "Critical dependency" (dynamisk require som webpack inte kan analysera)
    if (typeof config.module !== "undefined") {
      config.module.exprContextCritical = false;
    }
    return config;
  },
};

export default nextConfig;
