# CyberJust — CyberJustiça Brasil

Editorial site about Brazilian cybercrime cases: episode pages with audio, transcripts, timelines, resources and specialists. Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4, self-hosted on **Coolify** (VM 520, `n3xus-cloud`) as a Docker image built from `main`, served at [www.cyberjus.org](https://www.cyberjus.org) through the Cloudflare tunnel. The apex `cyberjus.org` 308-redirects to `www` (`next.config.mjs#redirects`). Vercel is no longer used.

## Stack

- **Framework**: Next.js 16 (App Router, `output: "standalone"`), React 19 with the React Compiler
- **Language**: TypeScript (`strict: true`), path alias `@/*` -> repo root
- **Styling**: Tailwind CSS 4 + shadcn/ui-style primitives in `components/ui/` (Radix UI, `class-variance-authority`, `tailwind-merge`)
- **Package manager**: pnpm 10 (`pnpm-lock.yaml` is the source of truth). `overrides` and `onlyBuiltDependencies` live in `pnpm-workspace.yaml`, **not** `package.json#pnpm` (pnpm 10 ignores that field).

## Commands

```bash
pnpm dev         # dev server
pnpm build       # production build - every route should be ○/● (static/SSG) in the route table
pnpm start       # run the production build
pnpm lint        # eslint . (flat config, extends eslint-config-next)
pnpm type-check  # tsc --noEmit
pnpm test        # vitest run
pnpm test:e2e    # playwright smoke suite (e2e/)
docker build -t cyberjust .   # the exact image Coolify builds
```

CI (`.github/workflows/ci.yml`, required check `build`) runs lint + type-check + test + build on PRs and pushes to `main`. `e2e.yml` runs the Playwright smoke suite (informational).

## Project layout

- `app/` — routes. `/` (home), `/episodes`, `/episodes/[id]` (prerendered via `generateStaticParams`, `dynamicParams = false`, so unknown ids are a static 404). `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx`, `error.tsx`, `not-found.tsx`.
- `app/layout.tsx` — the shell for every route: `AudioProvider` → `Navigation` (header) → `<main>` → `Footer` → `AudioPlayer`. Header, footer and player are global; don't re-mount them in a page.
- `components/sections/` — homepage sections (server components unless they need state). `components/episode/` — episode UI; `EpisodeListenButton` is **the** play/pause control for every surface, don't add another.
- `contexts/AudioContext.tsx` — the only global state: one reused `<audio>` element, split into `useAudio()` (controls) and `useAudioTime()` (currentTime/duration, re-renders on every tick — only the player bar and bookmarks use it).
- `hooks/useLocalStorage.ts` — `useSyncExternalStore`-based, hydration-safe. Used by episode bookmarks (per-browser, key `cyberjus-bookmarks`).
- `data/episodes.ts` — all episode content. `lib/constants.ts` — `SITE_URL`, nav items, experts, crime types, tips, stats.
- `public/audio/*.m4a` — episode audio, served from this origin.

## Conventions

- Server components by default; `"use client"` only at the interactive leaf.
- Navigation uses `<Link>`/`<a>` (never `onClick` + `window.location`/`window.open`). Header anchors are absolute (`/#casos`) so they work from any route; section ids are ASCII (`protecao`, `denuncias`).
- Content changes go through `data/episodes.ts` + a PR. There is no CMS/dashboard (a localStorage-only one was removed in 2026-10 — it only ever changed the editor's own browser).
- Commit style: `feat:`, `fix:`, `chore:`, `refactor:`.

## Audio

Files are AAC-LC in a **non-fragmented MP4 with `moov` first** (`ffmpeg -i in.m4a -map 0:a -c copy -movflags +faststart out.m4a`). That lets a plain `audio.src` stream over HTTP Range requests — playback starts after a few hundred KB and seeking is instant. The old files were fragmented MP4, which forced a MediaSource path that downloaded the whole file and blew Chrome's ~12 MB SourceBuffer quota on the larger episodes; that's the bug this replaced. To add an episode:

1. Remux (or encode) with `-movflags +faststart` and check the first atoms are `ftyp`, `moov`.
2. Put it in `public/audio/` under a **new filename** (responses are `Cache-Control: immutable`; never overwrite a published file).
3. Set `audioUrl: "/audio/<file>.m4a"` in `data/episodes.ts`.

## Security posture

No auth, no API routes, no server actions, no user data on the server. `next.config.mjs` sets a static CSP (`'self'` only, plus `'unsafe-inline'` for Next's hydration scripts — a nonce CSP would force dynamic rendering), HSTS, COOP, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and Permissions-Policy. If you add an external origin (images, audio, analytics), add it to the matching CSP directive or it silently fails.

`SITE_URL` (`lib/constants.ts`, override with build-time `NEXT_PUBLIC_SITE_URL`) must always point at a domain this project owns.

## Deploy

Coolify builds the `Dockerfile` (multi-stage, `node:22-alpine`, non-root, healthcheck on `/robots.txt`) on every push to `main`. After merging, check the deploy finished in Coolify and spot-check the live site — a green CI is not a deploy.
