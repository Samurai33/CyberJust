---
description: Build, lint & push workflow for CyberJust - pre-release checklist and version bump for the Next.js/Vercel deploy
allowed-tools: Read Bash Grep Glob
---

# Ship

Release checklist for this repo: Next.js 15 app, deployed to Vercel from `main`, no CI workflow configured yet (no `.github/workflows`), no test script in `package.json`.

## When to Use

- Manual invocation before merging a feature branch into `main`
- Before triggering a Vercel deploy
- Before bumping `package.json` version

## Pre-Ship Checklist

### 1. Lint passes

```bash
pnpm lint
```

### 2. Production build succeeds

```bash
pnpm build
```

Read the output route table — flag any route with an unexpectedly large "First Load JS" vs. the last build (see the `performance` skill for the deeper check).

### 3. No stray debug code

```bash
rg "console\.log|debugger;" app/ components/ lib/ hooks/ services/
```

### 4. Uncommitted/untracked check

```bash
git status
```

Confirm nothing unintended is about to be committed (stray `node_modules`, `.env`, build artifacts — all should already be gitignored, but verify).

### 5. Env vars

If the change added a new `process.env.X` read, confirm:
- It's documented somewhere (README or a comment) so whoever configures Vercel knows to set it
- It is **not** prefixed `NEXT_PUBLIC_` unless it's genuinely safe to ship to the browser

## Release Steps

1. Run the checklist above
2. Commit with a message following this repo's existing style (`fix:`, `feat:` prefixes — see `git log --oneline`)
3. Push the branch and open a PR (`gh pr create`) rather than pushing directly to `main`, unless the user has said otherwise for this change
4. After merge, Vercel auto-deploys from `main` — confirm the deploy succeeds at the dashboard/`vercel.app` URL, don't assume

## What This Skill Does Not Do

- There is no test suite yet — this skill cannot verify behavior beyond build/lint. If you're shipping a risky change, say so explicitly rather than implying test coverage exists.
- There is no CI workflow yet — these checks are not automatically enforced by GitHub Actions. If the user wants that, that's a separate task (add `.github/workflows/ci.yml` running `pnpm lint` + `pnpm build` on PRs).
