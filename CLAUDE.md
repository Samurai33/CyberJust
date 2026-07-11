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
pnpm type-check  # tsc --noEmit — there is no `lint` script; ESLint isn't configured (see #11)
```

There is no test script yet. CI (`.github/workflows/ci.yml`) runs `pnpm type-check` + `pnpm build` on PRs/pushes to `main` — it does not lint or run tests, say so explicitly if a task implies coverage beyond that.

## Project layout

- `app/` — routes (App Router). `app/episodes/[id]/` is the episode/case detail route.
- `components/` — `ui/` (shadcn/Radix primitives), `audio/`, `dashboard/`, `episode/`, `modals/`, `sections/`, plus `ErrorBoundary.tsx`, `theme-provider.tsx`
- `contexts/` — cross-cutting React context (theme, auth session) — keep this for genuinely global state only
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

This is a cybercrime-investigation platform — even while mostly frontend-only today, treat auth (`DashboardAuthModal`), any future API routes/server actions, and any future case/PII data with the higher bar described in the `security-guardian` skill: no secrets in `NEXT_PUBLIC_*`, no `dangerouslySetInnerHTML` on untrusted content, no client-only auth gating.

## Available skills

This repo's `.claude/skills/` contains three groups, curated for this stack:

**Project-specific (adapted for this repo's actual stack — Next.js/TS/pnpm, not generic)**
`code-simplifier`, `design-patterns`, `performance`, `security-guardian`, `ship`, `pr-review`, `issue-triage`, `repo-recap`

**Design intelligence** (from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), Apache-2.0)
`design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides`, `ui-ux-pro-max` — UI styles, color palettes, font pairings, and UX guidelines; useful for any new section/dashboard/marketing surface.

**Development methodology** (from [obra/superpowers](https://github.com/obra/superpowers), MIT)
`systematic-debugging`, `test-driven-development`, `brainstorming`, `writing-plans`, `executing-plans`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch`, `using-git-worktrees`, `dispatching-parallel-agents`, `subagent-driven-development`, `using-superpowers`, `writing-skills` — general engineering discipline, not tied to any one stack.

The global `engineering:*` plugin skills (code-review, debug, testing-strategy, architecture, deploy-checklist, etc.) and `security-review` are also available in this environment and don't need to be duplicated here.
