import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker runtime image copies only .next/standalone + .next/static + public
  // (see Dockerfile) - a pruned server bundle with its own minimal
  // node_modules, instead of shipping the full dev node_modules tree.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3000", pathname: "/uploads/**" },
    ],
    // Next's image optimizer refuses to fetch from private IPs as SSRF
    // protection - "localhost" resolves to 127.0.0.1, which trips it even
    // though the source (our own gateway) is trusted. Serve unresized for
    // now; revisit once product images are served from a real public domain
    // (S3/CloudFront) in production, where optimization can run normally.
    unoptimized: true,
  },
};

export default nextConfig;
