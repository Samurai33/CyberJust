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

This repo already carries Radix UI, `recharts`, `embla-carousel-react` — all reasonable, but adding another chart/carousel/animation library duplicates weight. Check `package.json` before adding a new one for something an existing dependency already covers.

### 4. Images and audio

- Use `next/image` for any content image (automatic sizing, lazy loading, format negotiation) — never a raw `<img>` for episode art, avatars, or backgrounds.
- Audio files in `public/audio/` should stream, not be eagerly loaded — verify the `AudioPlayer`/`EpisodeAnalytics` components don't fetch the full file before playback starts.

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
