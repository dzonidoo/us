import type { NextConfig } from "next";

// GitHub Pages serves the site under /<repo>; the deploy workflow sets this.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static HTML for GitHub Pages: no server, everything runs in the browser.
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
