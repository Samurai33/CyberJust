# CyberJust — CyberJustice Brasil

Cybercrime investigation platform: forensic analysis tools, expert directory, episode/case audio player with transcripts, analytics dashboard. Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS, deployed on Vercel from `main` at [cyberjus.org](https://cyberjus.org) (DNS on Cloudflare, DNS-only/unproxied — see Security posture).

## Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript (`strict: true`), path alias `@/*` -> repo root
- **Styling**: TailwindCSS + shadcn/ui-style components (`components/ui/`, Radix UI primitives, `class-variance-authority`, `tailwind-merge`)
- **Forms**: `react-hook-form` + `zod` (`@hookform/resolvers`)
- **Package manager**: pnpm 10 (`pnpm-lock.yaml` is the source of truth — don't introduce `package-lock.json` changes as the primary lockfile). `overrides` (`sharp`, `lodash`, `postcss`) and `onlyBuiltDependencies: ["sharp"]` live in `pnpm-workspace.yaml`, **not** `package.json#pnpm` — pnpm 10.12.4 (the exact version pinned in `packageManager`, and what Vercel resolves via corepack) silently ignores that field now. If `pnpm install` ever prints "The 'pnpm' field in package.json is no longer read", something reintroduced it there by mistake.

## Commands

```bash
pnpm dev         # dev server
pnpm build       # production build — check the route table for First Load JS regressions
pnpm start       # run the production build
pnpm lint        # eslint . — flat config in eslint.config.mjs, extends eslint-config-next
pnpm type-check  # tsc --noEmit
pnpm test        # vitest run — coverage is still sparse, see lib/utils.test.ts and app/actions/auth.test.ts for the pattern
```

CI (`.github/workflows/ci.yml`) runs `pnpm lint` + `pnpm type-check` + `pnpm test` + `pnpm build` on PRs/pushes to `main`. `eslint.config.mjs` just extends `eslint-config-next` with no rule overrides — CI only fails on errors, not warnings. A handful of `react-hooks` warnings are expected and not blocking: `ProjectModal.tsx` (`react-hooks/incompatible-library` — `react-hook-form`'s `watch()` can't be safely memoized by the React Compiler), and `exhaustive-deps` in `DashboardContext.tsx`/`useKeyboard.ts`. Run `pnpm lint` yourself if a change might have added a new one.

## Project layout

- `app/` — routes (App Router). `app/episodes/[id]/` is the episode/case detail route. `app/robots.ts` and `app/sitemap.ts` generate `/robots.txt`/`/sitemap.xml` from `data/episodes.ts` and `lib/constants.ts#SITE_URL`. `app/error.tsx`/`app/not-found.tsx` are the App Router error/404 conventions (separate from the client-side `ErrorBoundary` component below).
- `components/` — `ui/` (shadcn/Radix primitives — only the ones actually imported somewhere; unused scaffold components get deleted, not kept "just in case"), `audio/` (`AudioPlayer.tsx`, mounted once in `app/layout.tsx` so it's available on every route — don't re-mount it in a page, and don't move it back to a single page: playback is global state in `AudioContext`, so the control bar has to be too), `dashboard/`, `episode/`, `modals/`, `sections/`, plus `ErrorBoundary.tsx`, `HomeGate.tsx` (client/server auth boundary for the homepage)
- `app/actions/` — Server Actions (`auth.ts`: dashboard password check + session cookie + login rate limiting, server-only)
- `contexts/` — cross-cutting React context (`AuthContext` for the dashboard session, `AudioContext` for global playback state, `DashboardContext` for project/expert CRUD state, etc.) — keep this for genuinely global state only. The app has no light/dark toggle; it's permanently dark (see `app/globals.css`), so there's no theme context.
- `hooks/` — data/state hooks, convention: return `{ data, isLoading, error }`
- `lib/` — `constants.ts` (incl. `SITE_URL`, shared by metadata/robots/sitemap), `projectUtils.ts`, `utils.ts` (shared helpers)
- `services/` — `analytics.ts`, `projectSync.ts`
- `data/` — static/seed data (e.g. `episodes.ts` — `audioUrl` points at `media/audio/*.m4a`, served via jsDelivr's GitHub CDN rather than by Vercel, see Security posture)
- `media/audio/` — committed episode audio (`.m4a`), served through `cdn.jsdelivr.net/gh/Samurai33/CyberJust@main/media/audio/...` rather than through Next.js/Vercel — keeps these out of the deployed function/build output entirely
- `types/` — shared TypeScript types

## Conventions

- Server components by default; `"use client"` only at the interactive leaf (see `design-patterns` skill)
- `next/image` for content images, never a raw `<img>` (see `performance` skill)
- New forms use `react-hook-form` + a `zod` schema, not manual `useState` validation
- Commit style follows existing history: `feat:`, `fix:` prefixes (`git log --oneline` to match tone)
- PRs target `main`; Vercel auto-deploys from `main` on merge

## Security posture

This is a cybercrime-investigation platform — even while mostly frontend-only today, treat auth, any future API routes/server actions, and any future case/PII data with the higher bar described in the `security-guardian` skill: no secrets in `NEXT_PUBLIC_*`, no `dangerouslySetInnerHTML` on untrusted content, no client-only auth gating.

Dashboard auth is server-verified: `app/actions/auth.ts` checks the password against `DASHBOARD_PASSWORD` server-side and issues an HMAC-signed `httpOnly` session cookie (secret: `DASHBOARD_SESSION_SECRET`). Both env vars must be set (see `.env.example`) — without them, auth fails closed (nobody can log in), it does not fall back to a default. Login attempts are rate-limited server-side (5/60s per IP, in-memory in `app/actions/auth.ts`) on top of the client-side "3 attempts" UX lockout — the in-memory limiter is best-effort (resets on cold start, not shared across serverless instances); swap it for Vercel KV/Upstash if it ever needs to be watertight.

`next.config.mjs` sets a static (non-nonce) CSP plus `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` via `headers()`. Two things that look like bugs on this CSP but aren't — check before "fixing" either:
- `images.unoptimized: true` — `expert.avatar` (dashboard form) is a free-text URL, and Next's image optimizer requires a fixed `images.remotePatterns` allowlist, incompatible with arbitrary hosts.
- No `media-src` beyond `cdn.jsdelivr.net` (plus `blob:` for the MediaSource object URL) — episode `audioUrl` is committed under `media/audio/` and served through jsDelivr's GitHub CDN (free, no bandwidth cap, correct `Content-Type: audio/mp4`), fetched and fed through MediaSource Extensions in `contexts/AudioContext.tsx` rather than a plain `audio.src = url` (the files are fragmented MP4/AAC-LC, which some browsers' progressive-src demuxer rejects even though `MediaSource.isTypeSupported` returns true for the same codec — a demuxer gap, not a missing codec). **Do not switch this to GitHub Release assets or Git LFS** — both were tried and rejected: Release assets force `Content-Type: application/octet-stream` + `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` on every download, which browsers correctly refuse to play inline (`NotSupportedError`) regardless of CSP; LFS has a 10GB/month free bandwidth cap that real traffic streaming full episodes would blow through fast. If a new episode's audio 404s or silently refuses to play, check the CSP `media-src` allowlist and the jsDelivr URL (`@main` branch refs are cached ~12h at the CDN edge — a same-second replace of an existing file's content, not just adding a new one, may need a version-suffixed filename to bust the cache) before anything else.

Branch protection is enabled on `main` (required status check: `build`; force-push and deletion blocked). Secret scanning, secret scanning push protection, Dependabot security updates, and Dependabot vulnerability alerts are all enabled on the GitHub repo. Launch-readiness work is tracked via GitHub milestones (see "Production Launch Readiness" and any successor milestone) rather than ad hoc — check open milestones/issues before assuming something is still broken or still missing.

`SITE_URL` in `lib/constants.ts` (used by `metadataBase`, OpenGraph, `robots.ts`, `sitemap.ts`) must always point at a domain this project actually owns — it pointed at a fabricated `.gov.br` address for a while, which is the kind of mistake that looks fine until someone shares a link.

## Known issues (live UX/UI audit, 2026-07-22)

Reproduced live on cyberjus.org via real-browser walkthrough of the full visitor flow (home → episodes list → episode detail → rating/bookmarks) plus mobile viewport. Tracked as GitHub issues under the launch-readiness milestone — check there for current status before re-diagnosing any of these from scratch.

**Dead/non-functional UI** (button exists, does nothing — no `onClick`/`href` at all):
- Share ("Compartilhar") — present on the homepage cards (`components/sections/EpisodesSection.tsx`) and the episode detail page (`app/episodes/[id]/page.tsx`). No handler anywhere in the codebase; sharing is non-functional site-wide.
- Download ("Download"/"BAIXAR") — same story, same two locations. Non-functional site-wide.
- Expert "Contato" button (`app/episodes/[id]/page.tsx`, rendered whenever `expert.contact.email` is set) — no handler; looks actionable, isn't.

**Real bugs:**
- `components/sections/EpisodesSection.tsx` merges `DashboardContext` `projects` (persisted in the visitor's own `localStorage`) over the static `data/episodes.ts` by id (lines ~26-31). If a browser has a stale/pre-migration project entry (e.g. an old `/audio/*.mp3` path from before the jsDelivr move), it silently overrides an episode's real `audioUrl: null` with a broken one, showing a fully-enabled "REPRODUZIR" button that 404s on click. The `/episodes` list grid (`EpisodesFilterGrid.tsx`) doesn't do this merge and correctly hides the button — the two surfaces disagree.
- `contexts/AudioContext.tsx`'s `error` event listener inside `playEpisode()` (~line 152) is the only playback-lifecycle handler missing the `currentEpisodeIdRef.current === episode.id` staleness guard that every sibling handler has (`timeupdate`, `ended`, the play-promise `.catch()`, the load timeout). Switching tracks quickly can surface an error message citing the *previous* episode's number instead of the one that actually failed — reproduced by playing EP7 then EP3.
- `components/episode/EpisodePlayButton.tsx` (the big "Ouvir Episódio"/"Reproduzindo..." button on the episode detail page) always renders the `Play` icon, never `Pause`, even while `isCurrentlyPlaying` is true and the label says "Reproduzindo..." — icon contradicts label. `EpisodesSection.tsx`'s own button does this correctly (compare the two).

**Mobile (375px viewport):**
- The header's "OUÇA AGORA" CTA button isn't resized/hidden for mobile and overflows ~47px past the right edge of the viewport (measured: `right: 422` in a 375px-wide window) — visibly clipped.
- No hamburger/mobile nav trigger exists to reveal the 5 nav links (`#casos`, `#protocolos`, `#especialistas`, `#proteção`, `#denúncias`); they're anchor links so still reachable by scrolling, but there's no quick-jump on mobile.

**Performance:** three separate interactions on the episode detail page measured "poor" INP (Interaction to Next Paint, Core Web Vitals threshold >500ms) via Chrome's own INP overlay while audio was playing: the Avaliação tab trigger (1105ms), a star-rating click (1198ms), and the Compartilhar button (1102ms). All were on unrelated elements, suggesting a page-wide re-render on every interaction rather than one slow component — worth profiling with React DevTools before assuming it's isolated to the ratings dialog.

**Placeholder/mock content — flagged for removal before a real launch, not fixed:**
- `services/analytics.ts#getEpisodeAnalytics` returns `Math.random()`-generated views/completions/engagement numbers (explicitly commented "Mock data"), rendered live as "ANALYTICS DO EPISÓDIO" on every episode page. Fabricated stats shown to real visitors.
- Every expert in `data/episodes.ts` has no `avatar` set, so the expert directory (a headline feature per README) renders the generic `public/placeholder.svg` silhouette for 100% of specialists, zero real photos.
- Four unreferenced leftover v0.dev scaffold assets in `public/`: `placeholder-logo.png`, `placeholder-logo.svg`, `placeholder-user.jpg`, `placeholder.jpg` — grepped across `app/`, `components/`, `lib/`, `data/`, `services/`, `contexts/` with zero matches, safe to delete. (`placeholder.svg` itself is real and used — the expert-avatar fallback above — don't delete that one.)

## Available skills

This repo's `.claude/skills/` contains three groups, curated for this stack:

**Project-specific (adapted for this repo's actual stack — Next.js/TS/pnpm, not generic)**
`code-simplifier`, `design-patterns`, `performance`, `security-guardian`, `ship`, `pr-review`, `issue-triage`, `repo-recap`, `token-economy` (apply by default — fewer redundant reads/commands, judicious subagent use)

**Design intelligence** (from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), Apache-2.0)
`design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides`, `ui-ux-pro-max` — UI styles, color palettes, font pairings, and UX guidelines; useful for any new section/dashboard/marketing surface.

**Development methodology** (from [obra/superpowers](https://github.com/obra/superpowers), MIT)
`systematic-debugging`, `test-driven-development`, `brainstorming`, `writing-plans`, `executing-plans`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch`, `using-git-worktrees`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-superpowers`, `writing-skills` — general engineering discipline, not tied to any one stack.

The global `engineering:*` plugin skills (code-review, debug, testing-strategy, architecture, deploy-checklist, etc.) and `security-review` are also available in this environment and don't need to be duplicated here.
