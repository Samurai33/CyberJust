---
description: Test, build, e2e & push workflow for CyberJust - pre-release checklist for the Astro static site deployed by Coolify (Docker + nginx)
allowed-tools: Read Bash Grep Glob
---

# Ship

Release checklist for this repo: Astro 7 static site, built into a Docker image (`nginx-unprivileged`, port 8080) and deployed by Coolify (app `cyberjust-web`, VM 520) from `main`, behind Cloudflare Tunnel at [www.cyberjus.org](https://www.cyberjus.org). CI has two workflows on every PR and push to `main`: `ci.yml` (required check `build`: `pnpm test` + `pnpm build`, where build = `astro check` + `astro build`) and `e2e.yml` (builds the production image and runs Playwright in chromium/webkit/iphone/ipad/android). This skill mirrors those checks locally before you push, plus what CI can't see.

There are no `lint` or `type-check` scripts: type checking is `astro check`, which runs inside `pnpm build` (or alone via `pnpm check`).

## When to Use

- Manual invocation before merging a feature branch into `main`
- Before publishing a new episode
- Before bumping `package.json` version

## Pre-Ship Checklist

### 1. Unit tests pass

```bash
pnpm test
```

Vitest runs `src/**/*.test.ts` (today `src/lib/tempo.test.ts`). New pure logic in `src/lib/` should come with cases there.

### 2. Type check + production build

```bash
pnpm build
```

Fails on type errors (TypeScript 6, `astro/tsconfigs/strictest`) and on content schema errors in `src/content/episodios/*.md`. Glance at `dist/_astro/*.js` sizes: the site ships ~26 KB of JS in total (see the `performance` skill).

### 3. E2E against the production image

```bash
docker build -t cyberjust .
docker run --rm -d --name cyberjust-e2e -p 127.0.0.1:18080:8080 cyberjust
BASE_URL=http://127.0.0.1:18080 pnpm test:e2e
docker stop cyberjust-e2e
```

Always against the image, never `pnpm dev`: the suite checks the real nginx headers, CSP violations on every page, 301 redirects, audio Range/`ftyp`-`moov` order, no-JS behavior and the persistent player. CI runs it inside `mcr.microsoft.com/playwright:v1.63.0-noble`; locally the browsers must match `@playwright/test` 1.63.0.

### 4. No stray debug code

```bash
rg -n "console\.log|debugger;" src/ e2e/
```

### 5. Uncommitted/untracked check

```bash
git status
```

Confirm nothing unintended is about to be committed (`node_modules`, `dist`, `.astro`, `test-results`, `playwright-report`, `.env*` are gitignored, but verify).

### 6. CSP / headers

If the change adds an external resource, an inline style/script, or a new nginx `location`, it will break the CSP or drop headers. See the `security-guardian` skill, section 2. The e2e suite catches CSP violations only on the pages listed in `e2e/ajuda.ts` (`PAGINAS`); add new pages there.

### 7. Episodes, audio and URLs

- New audio: AAC in MP4 with `-movflags +faststart`, **new file name** in `public/audio/` (immutable cache), `audio.segundos`/`audio.bytes` from `ffprobe` and `ls -l` (README "Publicar um episódio").
- Changed or removed URL: add a 301 in `docker/nginx.conf` and a case in `e2e/servidor.spec.ts`.
- New preview art: new file name (`og-v2.jpg`) and update `Base.astro`.

## Release Steps

1. Run the checklist above
2. Commit with a message following this repo's existing style (`fix:`, `feat:` prefixes — see `git log --oneline`)
3. Push the branch and open a PR (`gh pr create`) rather than pushing directly to `main`, unless the user has said otherwise for this change
4. Wait for `CI` (`build`) and `E2E` to go green on the PR before merging
5. After merge, Coolify builds the `Dockerfile` from `main` and deploys `cyberjust-web` (healthcheck: `wget` on `/robots.txt` inside the container). Confirm the deploy finished in Coolify and check the live site — green CI is not a deploy:

```bash
curl -sI https://www.cyberjus.org/ | grep -iE "^HTTP|content-security-policy"
curl -sI https://cyberjus.org/ | grep -iE "^HTTP|location"   # 301 to www
```

## What This Skill Does Not Do

- Unit coverage is limited to pure helpers; the e2e suite is the main safety net. Passing it narrows risk, it doesn't replace opening the changed pages on a phone.
- It doesn't check Cloudflare caching: HTML is `no-cache`, but a reused file name for audio or the OG image will stay stale at the edge and in social previews.
