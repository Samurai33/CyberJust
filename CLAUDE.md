# CyberJust — CyberJustice Brasil

Cybercrime investigation platform: forensic analysis tools, expert directory, episode/case audio player with transcripts, analytics dashboard. Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS, deployed on Vercel from `main`.

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

CI (`.github/workflows/ci.yml`) runs `pnpm lint` + `pnpm type-check` + `pnpm test` + `pnpm build` on PRs/pushes to `main`. Three React Compiler rules (`react-hooks/set-state-in-effect`, `react-hooks/purity`, `react-hooks/immutability`) are downgraded to `warn` in `eslint.config.mjs` — they flag pre-existing patterns in vendor/shadcn code (`carousel.tsx`, `sidebar.tsx`, `use-mobile.tsx`) and `AudioPlayer.tsx`, tracked in #61 rather than rewritten as part of adding lint.

## Project layout

- `app/` — routes (App Router). `app/episodes/[id]/` is the episode/case detail route.
- `components/` — `ui/` (shadcn/Radix primitives), `audio/`, `dashboard/`, `episode/`, `modals/`, `sections/`, plus `ErrorBoundary.tsx`, `HomeGate.tsx` (client/server auth boundary for the homepage)
- `app/actions/` — Server Actions (`auth.ts`: dashboard password check + session cookie, server-only)
- `contexts/` — cross-cutting React context (`AuthContext` for the dashboard session, `DashboardContext` for project/expert CRUD state, etc.) — keep this for genuinely global state only. The app has no light/dark toggle; it's permanently dark (see `app/globals.css`), so there's no theme context.
- `hooks/` — data/state hooks, convention: return `{ data, isLoading, error }`
- `lib/` — `constants.ts`, `projectUtils.ts`, `utils.ts` (shared helpers)
- `services/` — `analytics.ts`, `projectSync.ts`
- `data/` — static/seed data (e.g. `episodes.ts`)
- `types/` — shared TypeScript types

## Conventions

- Server components by default; `"use client"` only at the interactive leaf (see `design-patterns` skill)
- `next/image` for content images, never a raw `<img>` (see `performance` skill)
- New forms use `react-hook-form` + a `zod` schema, not manual `useState` validation
- Commit style follows existing history: `feat:`, `fix:` prefixes (`git log --oneline` to match tone)
- PRs target `main`; Vercel auto-deploys from `main` on merge

## Security posture

This is a cybercrime-investigation platform — even while mostly frontend-only today, treat auth, any future API routes/server actions, and any future case/PII data with the higher bar described in the `security-guardian` skill: no secrets in `NEXT_PUBLIC_*`, no `dangerouslySetInnerHTML` on untrusted content, no client-only auth gating.

Dashboard auth is server-verified: `app/actions/auth.ts` checks the password against `DASHBOARD_PASSWORD` server-side and issues an HMAC-signed `httpOnly` session cookie (secret: `DASHBOARD_SESSION_SECRET`). Both env vars must be set (see `.env.example`) — without them, auth fails closed (nobody can log in), it does not fall back to a default. There's no rate limiting on login attempts (no persistence layer exists yet to track them) — the client-side "3 attempts" lockout is UX only, not a real control.

## Available skills

This repo's `.claude/skills/` contains three groups, curated for this stack:

**Project-specific (adapted for this repo's actual stack — Next.js/TS/pnpm, not generic)**
`code-simplifier`, `design-patterns`, `performance`, `security-guardian`, `ship`, `pr-review`, `issue-triage`, `repo-recap`, `token-economy` (apply by default — fewer redundant reads/commands, judicious subagent use)

**Design intelligence** (from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), Apache-2.0)
`design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides`, `ui-ux-pro-max` — UI styles, color palettes, font pairings, and UX guidelines; useful for any new section/dashboard/marketing surface.

**Development methodology** (from [obra/superpowers](https://github.com/obra/superpowers), MIT)
`systematic-debugging`, `test-driven-development`, `brainstorming`, `writing-plans`, `executing-plans`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch`, `using-git-worktrees`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-superpowers`, `writing-skills` — general engineering discipline, not tied to any one stack.

The global `engineering:*` plugin skills (code-review, debug, testing-strategy, architecture, deploy-checklist, etc.) and `security-review` are also available in this environment and don't need to be duplicated here.
