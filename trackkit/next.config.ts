import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent browsers from MIME-sniffing a response away from the declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking protection
  { key: "X-Frame-Options", value: "DENY" },
  // Only send referrer for same origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unnecessary browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Force HTTPS for 1 year (including subdomains)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Content Security Policy — allow Supabase and Google Fonts
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Supabase API calls
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      // Next.js dev hot reload + local SQL.js worker
      "worker-src 'self' blob:",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Style — allow inline (Next.js injects critical CSS)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Scripts — allow inline eval for sql.js WASM bootstrap
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      // WASM (sql.js)
      "script-src-elem 'self' 'unsafe-inline'",
      // Images (data URIs for icons)
      "img-src 'self' data: blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
