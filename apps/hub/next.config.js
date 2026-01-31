const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Generate content hash from key source files for build verification
function generateBuildHash() {
  const filesToHash = [
    "src/app/page.tsx",
    "src/app/home/page.tsx",
    "src/app/layout.tsx",
    "package.json",
  ];

  const hashes = filesToHash
    .map((file) => {
      try {
        const fullPath = path.join(__dirname, file);
        const content = fs.readFileSync(fullPath, "utf8");
        return crypto
          .createHash("md5")
          .update(content)
          .digest("hex")
          .slice(0, 8);
      } catch {
        return "00000000";
      }
    })
    .join("");

  return crypto.createHash("md5").update(hashes).digest("hex").slice(0, 12);
}

const buildTime = new Date().toISOString();
const gitSha =
  process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "local";
const buildHash = generateBuildHash();
const packageVersion = require("./package.json").version;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_BUILD_TIME: buildTime,
    NEXT_PUBLIC_GIT_SHA: gitSha,
    NEXT_PUBLIC_BUILD_HASH: buildHash,
    NEXT_PUBLIC_VERSION: packageVersion,
  },

  // Enable standalone output for Docker deployment
  output: "standalone",

  // Transpile SDK packages for hot reload in development
  transpilePackages: [
    "@rockfridrich/villa-sdk",
    "@rockfridrich/villa-sdk-react",
    "@villa/ui",
  ],

  // Enable compression (gzip)
  compress: true,

  // Optimize builds
  swcMinify: true,

  // Generate ETags for caching
  generateEtags: true,

  // Powered by header (disable for security)
  poweredByHeader: false,

  // Security + caching headers
  async headers() {
    // For /auth route: Allow embedding from any HTTPS origin (SDK iframe)
    // This is safe because:
    // - User explicitly completes auth flow (consents)
    // - Only user's own identity is returned
    // - No secrets sent to external origin
    // - Similar to OAuth redirect_uri model
    const authFrameAncestors =
      "'self' https: http://localhost:* http://127.0.0.1:*";

    return [
      // Static assets - long cache (hashed filenames)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Public assets - moderate cache
      {
        source: "/public/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // API routes - no cache
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
      // /auth route - ALLOW iframe embedding for SDK
      {
        source: "/auth",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "publickey-credentials-get=*, publickey-credentials-create=*",
          },
          {
            // CSP for Porto SDK - allows iframe embedding from trusted origins
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://rpc.porto.sh https://*.porto.sh wss://*.porto.sh",
              "frame-src 'self' https://id.porto.sh",
              `frame-ancestors ${authFrameAncestors}`,
            ].join("; "),
          },
        ],
      },
      // /sdk-demo route - ALLOW iframe embedding for docs playground
      {
        source: "/sdk-demo",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "publickey-credentials-get=*, publickey-credentials-create=*",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://rpc.porto.sh https://*.porto.sh wss://*.porto.sh",
              "frame-src 'self' https://id.porto.sh",
              `frame-ancestors ${authFrameAncestors}`,
            ].join("; "),
          },
        ],
      },
      // HTML pages (excluding /auth, /sdk-demo) - CDN cache + security headers
      {
        source: "/:path((?!api|_next|auth|sdk-demo).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://rpc.porto.sh https://*.porto.sh wss://*.porto.sh",
              "frame-src 'self' https://id.porto.sh",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
