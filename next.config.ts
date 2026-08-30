// next.config.ts
import type { NextConfig } from "next";

/**
 * Minimal Next.js configuration for DSA Visualizer.
 * The project uses the default `src/pages` directory, so no custom
 * `turbopack.root` or `distDir` is required. Keeping the config lean
 * avoids Turbopack path‑resolution errors.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
