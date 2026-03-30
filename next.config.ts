import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: repoRoot,
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: repoRoot,
  },
  transpilePackages: ["@veridex/sdk", "@veridex/agentic-payments"],
};

export default nextConfig;
