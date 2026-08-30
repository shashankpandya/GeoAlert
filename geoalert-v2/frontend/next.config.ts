import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirect /classic -> /classic/ so the static HTML is served correctly
  async redirects() {
    return [
      { source: "/classic", destination: "/classic/", permanent: true },
    ];
  },

  async headers() {
    return [
      // Classic version — no strict CSP (loads external CDN scripts + tiles)
      {
        source: "/classic/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      // App routes
      {
        source: "/((?!classic).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // img-src: allow OSM tiles from ALL valid origins MapLibre uses
              "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.openstreetmap.org",
              // connect-src: allow API + tile downloads
              "connect-src 'self' http://localhost:8000 https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.openstreetmap.org",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
