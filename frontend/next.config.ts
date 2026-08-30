import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    // Classic version — no restrictions (it's a full static HTML page)
    {
      source: "/classic/:path*",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    },
    // App routes — full security headers
    {
      source: "/((?!classic).*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.openstreetmap.org; connect-src 'self' http://localhost:8000 https://*.tile.openstreetmap.org; worker-src 'self' blob:; frame-ancestors 'none'" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
};

export default nextConfig;
