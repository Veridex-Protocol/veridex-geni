import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: __dirname,
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@veridex/sdk", "@veridex/agentic-payments"],
};

export default nextConfig;
