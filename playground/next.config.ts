import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app: a stray package-lock.json elsewhere on
  // this machine otherwise makes Next.js guess the wrong tracing root.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
