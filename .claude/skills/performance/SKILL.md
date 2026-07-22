---
description: Next.js performance optimization for CyberJust - Core Web Vitals, bundle size, image/audio loading, hydration cost.
---

# Performance Optimization Skill

Systematic performance analysis for this Next.js 16 app, focusing on **Core Web Vitals** (LCP, INP, CLS), **JS bundle size**, and **hydration cost** — the README advertises "Loading times < 1s", treat that as the target.

## When to Use

- **Manual invocation**: When a page feels slow, before a release, after adding a heavy dependency
- **Proactive**: After adding client components, new npm packages, images, or the audio player features
- **Automatically relevant**: Any change touching `app/`, `components/`, or `public/`

## Performance Targets

| Metric | Target | How to check |
|--------|--------|---------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Lighthouse / Chrome DevTools Performance panel |
| **INP** (Interaction to Next Paint) | < 200ms | Lighthouse |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| **JS bundle (First Load)** | keep growth flagged | `pnpm build` output per-route table |
| **Images** | served via `next/image` | no raw `<img>` for content images |

## Analysis Workflow

### 1. Build output audit

```bash
pnpm build
# Read the route table: flag any route whose "First Load JS" jumped
# noticeably vs. the previous build after your change.
```

### 2. Client/server boundary check

Every `"use client"` component ships its JS to the browser. Before adding one, ask: does this need `useState`/`useEffect`/browser APIs, or can it stay a server component?

```bash
rg -l '"use client"' components/ app/
```

### 3. Heavy dependency check

This repo carries the Radix UI primitives actually used by `components/ui/` — a `components/ui/*.tsx` file that no other file imports is dead weight (never bundled, since Next only bundles what's imported, but still a maintenance/audit-surface cost and a red flag that its backing npm package is unused too). Before adding a chart/carousel/animation library, check whether one is already a dependency for something else and whether the file that used to justify it is still imported anywhere:

```bash
# Is this ui/ component (and its backing package) actually imported anywhere?
grep -rl "@/components/ui/<name>\"" app components contexts hooks lib services
```

### 4. Images and audio

- Use `next/image` for any content image (automatic sizing, lazy loading, format negotiation) — never a raw `<img>` for episode art, avatars, or backgrounds. Note `next.config.mjs` sets `images.unoptimized: true` (deliberately — `expert.avatar` is a free-text URL, incompatible with Next's `remotePatterns` allowlist), so `next/image` here still gets lazy-loading/sizing but not format conversion.
- Episode audio is committed under `media/audio/*.m4a` but served through jsDelivr's GitHub CDN (`cdn.jsdelivr.net/gh/.../media/audio/...`), not through Vercel — keeps large binaries out of the deployed function/build output while still getting free, unmetered bandwidth and a correct `Content-Type: audio/mp4`. Don't move this to GitHub Release assets (forces `Content-Type: application/octet-stream` + `Content-Disposition: attachment`, which browsers refuse to play inline) or Git LFS (10GB/month free bandwidth cap real traffic would exceed). `AudioPlayer.tsx` (`components/audio/`) is mounted once in `app/layout.tsx` so it's global across routes; it lazily creates a `new Audio()` and doesn't fetch anything until `playEpisode()` is called. If you add a new audio host, it also needs a `media-src` entry in the CSP (`next.config.mjs`) or playback silently fails with a CSP violation, not a network error.

### 5. Memoization — only where it earns its cost

```tsx
// ❌ Premature: memoizing a cheap computation adds overhead for nothing
const label = useMemo(() => `${count} items`, [count]);

// ✅ Justified: expensive filter/sort over a large array, or a value passed
// to a memoized child that would otherwise re-render every parent render
const sorted = useMemo(() => episodes.toSorted(byDate), [episodes]);
```

## Detection Commands

```bash
# Raw <img> instead of next/image
rg "<img " app/ components/

# Large client components (candidates to split or demote)
rg -l '"use client"' components/ app/ | xargs wc -l | sort -rn | head -10

# useEffect with no dependency array (runs every render)
rg "useEffect\(\(\) => \{[^}]*\}\)" --type tsx
```

## Regression Check Before Shipping

1. `pnpm build` — compare First Load JS per route against the last known-good build
2. Manually check the page(s) you touched in dev tools' Network tab (throttled to Fast 3G) for anything blocking first paint
3. If you added a client component, confirm it doesn't force everything above it in the tree to also become client-rendered
