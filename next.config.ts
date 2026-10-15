import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML for GitHub Pages: no server, everything runs in the browser.
  output: "export",
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
