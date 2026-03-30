import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@veridex/sdk", "@veridex/agentic-payments"],
};

export default nextConfig;
