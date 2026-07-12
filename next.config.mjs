// Static (non-nonce) CSP: keeps /episodes and /episodes/[id] statically
// prerendered (a nonce-based policy per the official Next.js CSP guide
// forces dynamic rendering on every page). 'unsafe-inline' on script-src is
// the accepted tradeoff for Next.js's own inline streaming/hydration
// bootstrap scripts under this approach. img-src allows any https origin
// because expert.avatar (dashboard form) is a free-text URL - see
// next.config images.unoptimized below for the same constraint. media-src
// allows GitHub Releases + its githubusercontent.com CDN redirect target,
// since episode audioUrl (contexts/AudioContext.tsx: `audio.src = ...`)
// points at github.com/.../releases/download/... - without this it silently
// falls back to default-src 'self' and every episode's audio 404s in the
// browser console with a CSP violation, not a network error.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "media-src 'self' https://github.com https://*.githubusercontent.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ")

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Left unoptimized: expert.avatar (dashboard form) accepts an arbitrary
    // URL, and Next's image optimizer requires a fixed images.remotePatterns
    // allowlist - incompatible with arbitrary user-supplied hosts.
    unoptimized: true,
  },
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ]
  },
}

export default nextConfig
