// Static (non-nonce) CSP: keeps every route statically prerendered (a
// nonce-based policy forces dynamic rendering on every page). 'unsafe-inline'
// on script-src is the accepted tradeoff for Next.js's own inline
// hydration bootstrap scripts. Episode audio is served from this origin
// (public/audio), so media-src only needs 'self'.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  images: { unoptimized: true },
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Episode files are immutable once published - publish a new
        // filename instead of overwriting one.
        source: "/audio/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  },
  async redirects() {
    return [
      // Canonical host is www (see lib/constants.ts#SITE_URL).
      {
        source: "/:path*",
        has: [{ type: "host", value: "cyberjus.org" }],
        destination: "https://www.cyberjus.org/:path*",
        permanent: true,
      },
      // Portuguese aliases people actually type.
      { source: "/episodios", destination: "/episodes", permanent: true },
      { source: "/episodios/:id", destination: "/episodes/:id", permanent: true },
      { source: "/episodio/:id", destination: "/episodes/:id", permanent: true },
    ]
  },
}

export default nextConfig
