# CyberJust — CyberJustice Brasil

Cybercrime investigation platform: forensic analysis tools, expert directory, episode/case audio player with transcripts, analytics dashboard. Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS, deployed on Vercel from `main` at [cyberjus.org](https://cyberjus.org) (DNS on Cloudflare, DNS-only/unproxied — see Security posture).

## Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript (`strict: true`), path alias `@/*` -> repo root
- **Styling**: TailwindCSS + shadcn/ui-style components (`components/ui/`, Radix UI primitives, `class-variance-authority`, `tailwind-merge`)
- **Forms**: `react-hook-form` + `zod` (`@hookform/resolvers`)
- **Package manager**: pnpm 10 (`pnpm-lock.yaml` is the source of truth — don't introduce `package-lock.json` changes as the primary lockfile). `package.json` already declares `pnpm.onlyBuiltDependencies: ["sharp"]` so native postinstall scripts aren't withheld.

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
- No `media-src` beyond `cdn.jsdelivr.net` — episode `audioUrl` is committed under `media/audio/` and served through jsDelivr's GitHub CDN (free, no bandwidth cap, correct `Content-Type: audio/mp4`). **Do not switch this to GitHub Release assets or Git LFS** — both were tried and rejected: Release assets force `Content-Type: application/octet-stream` + `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` on every download, which browsers correctly refuse to play inline (`NotSupportedError`) regardless of CSP; LFS has a 10GB/month free bandwidth cap that real traffic streaming full episodes would blow through fast. If a new episode's audio 404s or silently refuses to play, check the CSP `media-src` allowlist and the jsDelivr URL (`@main` branch refs are cached ~12h at the CDN edge — a same-second replace of an existing file's content, not just adding a new one, may need a version-suffixed filename to bust the cache) before anything else.

`SITE_URL` in `lib/constants.ts` (used by `metadataBase`, OpenGraph, `robots.ts`, `sitemap.ts`) must always point at a domain this project actually owns — it pointed at a fabricated `.gov.br` address for a while, which is the kind of mistake that looks fine until someone shares a link.

## Available skills

This repo's `.claude/skills/` contains three groups, curated for this stack:

**Project-specific (adapted for this repo's actual stack — Next.js/TS/pnpm, not generic)**
`code-simplifier`, `design-patterns`, `performance`, `security-guardian`, `ship`, `pr-review`, `issue-triage`, `repo-recap`, `token-economy` (apply by default — fewer redundant reads/commands, judicious subagent use)

**Design intelligence** (from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), Apache-2.0)
`design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides`, `ui-ux-pro-max` — UI styles, color palettes, font pairings, and UX guidelines; useful for any new section/dashboard/marketing surface.

**Development methodology** (from [obra/superpowers](https://github.com/obra/superpowers), MIT)
`systematic-debugging`, `test-driven-development`, `brainstorming`, `writing-plans`, `executing-plans`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch`, `using-git-worktrees`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-superpowers`, `writing-skills` — general engineering discipline, not tied to any one stack.

The global `engineering:*` plugin skills (code-review, debug, testing-strategy, architecture, deploy-checklist, etc.) and `security-review` are also available in this environment and don't need to be duplicated here.
