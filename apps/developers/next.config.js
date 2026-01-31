const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Required for monorepo: trace dependencies from workspace root
  outputFileTracingRoot: path.join(__dirname, "../../"),
  compress: true,
  swcMinify: true,
  generateEtags: true,
  poweredByHeader: false,

  // Transpile workspace SDK packages
  transpilePackages: [
    "@rockfridrich/villa-sdk",
    "@rockfridrich/villa-sdk-react",
  ],

  async headers() {
    return [
      // AI context files - aggressive caching
      {
        source: "/CLAUDE.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
        ],
      },
      {
        source: "/llms.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
        ],
      },
      // Static assets - immutable (hash in filename)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API routes - no caching (dynamic)
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      // HTML pages - edge cache 1 hour, stale-while-revalidate 24h
      // CloudFlare will cache at edge, browsers get fresh on each visit
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
