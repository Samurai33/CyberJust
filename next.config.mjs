// Static (non-nonce) CSP: keeps /episodes and /episodes/[id] statically
// prerendered (a nonce-based policy per the official Next.js CSP guide
// forces dynamic rendering on every page). 'unsafe-inline' on script-src is
// the accepted tradeoff for Next.js's own inline streaming/hydration
// bootstrap scripts under this approach. img-src allows any https origin
// because expert.avatar (dashboard form) is a free-text URL - see
// next.config images.unoptimized below for the same constraint.
//
// Episode audio (contexts/AudioContext.tsx) is fetched from jsDelivr and fed
// through MediaSource Extensions rather than a plain `audio.src = url` - the
// files are fragmented MP4 (AAC-LC), which isn't reliably demuxed by every
// browser via plain progressive src loading even though the same browser's
// MediaSource.isTypeSupported for that exact codec returns true (a demuxer
// gap, not a missing codec). That's why connect-src needs cdn.jsdelivr.net
// (the fetch() that pulls the bytes) and media-src needs blob: (the
// MediaSource object URL assigned to the audio element) in addition to
// cdn.jsdelivr.net (kept as a fallback path for browsers without MSE
// support, which get a plain src assignment instead). GitHub Release assets
// were tried before jsDelivr, but GitHub forces Content-Type:
// application/octet-stream + Content-Disposition: attachment on every
// release asset, which browsers refuse to play inline no matter what the
// CSP allows - don't move audio back there.
const CSP = [
  "default-src 'self'",
  // vercel.live is Vercel's Preview Comments/feedback toolbar, injected on
  // preview (branch) deployments only - without it every preview logs a CSP
  // violation for feedback.js and the toolbar silently no-ops.
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https://cdn.jsdelivr.net",
  "connect-src 'self' https://cdn.jsdelivr.net https://vercel.live",
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
  poweredByHeader: false,
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
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
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
