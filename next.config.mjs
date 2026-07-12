// Static (non-nonce) CSP: keeps /episodes and /episodes/[id] statically
// prerendered (a nonce-based policy per the official Next.js CSP guide
// forces dynamic rendering on every page). 'unsafe-inline' on script-src is
// the accepted tradeoff for Next.js's own inline streaming/hydration
// bootstrap scripts under this approach. img-src allows any https origin
// because expert.avatar (dashboard form) is a free-text URL - see
// next.config images.unoptimized below for the same constraint. media-src
// allows jsDelivr, which serves episode audio (contexts/AudioContext.tsx:
// `audio.src = ...`) committed under media/audio/ - GitHub Release assets
// were tried first, but GitHub forces Content-Type: application/octet-stream
// + Content-Disposition: attachment + X-Content-Type-Options: nosniff on
// every release asset, which browsers correctly refuse to play inline
// (NotSupportedError) no matter what the CSP allows. jsDelivr serves the
// same bytes with a real Content-Type: audio/mp4 and no attachment
// disposition. Don't move audio back to GitHub Releases for this reason.
const CSP = [
  "default-src 'self'",
  // vercel.live is Vercel's Preview Comments/feedback toolbar, injected on
  // preview (branch) deployments only - without it every preview logs a CSP
  // violation for feedback.js and the toolbar silently no-ops.
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "media-src 'self' https://cdn.jsdelivr.net",
  "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com",
  "frame-src 'self' https://vercel.live",
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
