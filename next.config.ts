import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large file uploads (videos can be large)
  experimental: {
    proxyClientMaxBodySize: "500mb",
  },
};

export default nextConfig;
