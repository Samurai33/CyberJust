---
description: Build, type-check & push workflow for CyberJust - pre-release checklist for the Next.js/Vercel deploy
allowed-tools: Read Bash Grep Glob
---

# Ship

Release checklist for this repo: Next.js 16 app, deployed to Vercel from `main` at [cyberjus.org](https://cyberjus.org). CI (`.github/workflows/ci.yml`) runs `pnpm lint` + `pnpm type-check` + `pnpm test` + `pnpm build` on every PR and push to `main` — this skill mirrors those checks locally before you push, plus a few things CI doesn't cover.

## When to Use

- Manual invocation before merging a feature branch into `main`
- Before triggering a Vercel deploy
- Before bumping `package.json` version

## Pre-Ship Checklist

### 1. Lint passes

```bash
pnpm lint
```

CI only fails on errors, not warnings — a few `react-hooks` warnings are expected (see CLAUDE.md). Check that your change didn't introduce a *new* one, not just that the count is nonzero.

### 2. Type-check passes

```bash
pnpm type-check
```

### 3. Tests pass

```bash
pnpm test
```

Coverage is still sparse (see `lib/utils.test.ts` and `app/actions/auth.test.ts` for the pattern) — this doesn't replace manually verifying the feature, but any test that does exist must pass.

### 4. Production build succeeds

```bash
pnpm build
```

Read the output route table — flag any route with an unexpectedly large "First Load JS" vs. the last build (see the `performance` skill for the deeper check). Also flag a route that flipped from `○` (static) to `ƒ` (dynamic) unexpectedly — a nonce-based CSP or a new per-request read (cookies/headers) in a previously-static page is a common cause.

### 5. No stray debug code

```bash
rg "console\.log|debugger;" app/ components/ lib/ hooks/ services/
```

### 6. Uncommitted/untracked check

```bash
git status
```

Confirm nothing unintended is about to be committed (stray `node_modules`, `.env`, build artifacts — all should already be gitignored, but verify).

### 7. Env vars

If the change added a new `process.env.X` read, confirm:
- It's documented somewhere (README, `.env.example`, or CLAUDE.md's Security posture) so whoever configures Vercel knows to set it
- It is **not** prefixed `NEXT_PUBLIC_` unless it's genuinely safe to ship to the browser
- If it's new and required (like `DASHBOARD_PASSWORD`/`DASHBOARD_SESSION_SECRET`), it needs setting in **every** Vercel environment that should work (Production and Preview, at minimum) — and any env var change needs a **redeploy** to take effect; saving it in the dashboard alone does nothing for the already-running deployment

### 8. New external resource → CSP check

If the change adds a new image host, font CDN, analytics/embed script, or audio/video source, it needs an explicit entry in the CSP (`next.config.mjs` `headers()`) or it will silently fail in the browser — a CSP violation, not a network error you'd catch by checking a status code. See the `security-guardian` skill, section 3b.

## Release Steps

1. Run the checklist above
2. Commit with a message following this repo's existing style (`fix:`, `feat:` prefixes — see `git log --oneline`)
3. Push the branch and open a PR (`gh pr create`) rather than pushing directly to `main`, unless the user has said otherwise for this change
4. Wait for CI (`lint` + `type-check` + `test` + `build`) to go green on the PR before merging
5. After merge, Vercel auto-deploys from `main` — confirm the deploy succeeds and actually check the live site (`cyberjus.org`), don't assume from a green CI check alone. Vercel's Git integration can silently break (point at a stale/renamed repo) without any error surfaced in this repo's CI — if a merged PR's fix doesn't appear live, check Vercel → Settings → Git before re-debugging the code.

## What This Skill Does Not Do

- Test coverage is real but still sparse (`pnpm test` — see `lib/utils.test.ts`, `app/actions/auth.test.ts`). Passing tests narrows risk, it doesn't replace manually exercising a UI change in the browser.
- This checklist doesn't catch CSP-blocked resources, stale Vercel env vars, or a disconnected Git integration — those need the specific checks called out above (items 7-8) and a live-site spot check after deploy, not just green CI.
