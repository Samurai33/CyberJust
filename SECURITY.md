# Security Policy

## Reporting a vulnerability

**Please don't open a public GitHub issue for a security vulnerability.**

Use [GitHub's private vulnerability reporting](https://github.com/Samurai33/CyberJust/security/advisories/new) for this repository instead — it notifies the maintainer directly without exposing the report publicly until a fix is ready.

Include what you can:
- What the vulnerability is and where (file/line if you have it)
- Steps to reproduce
- What an attacker could actually achieve with it

There's no dedicated security team or SLA — this is a small project maintained by one person. Response time is best-effort, not guaranteed within a fixed window.

## Current state

CyberJustiça Brasil is a **fully static site** (Astro build served by `nginx-unprivileged`). There is no backend, no database, no login, no forms and no user data on the server.

- **Headers** (`docker/nginx.conf`, `docker/security-headers*.conf`): CSP with no `'unsafe-inline'` and only `'self'` sources, `frame-ancestors 'none'`, HSTS, COOP, CORP, `nosniff`, Referrer-Policy and Permissions-Policy. The e2e suite fails on any CSP violation.
- **Browser storage**: the audio player keeps playback position, speed and volume in `localStorage`. It never leaves the device.
- **Third parties**: none. Fonts, images and audio are all served from this origin. There is no analytics and there are no cookies.
- **Supply chain**: exact dependency versions and a frozen lockfile. pnpm `minimumReleaseAge` only installs releases that are 14+ days old, and only `esbuild`/`sharp` may run install scripts. Docker base images are pinned by digest and GitHub Actions by commit SHA. Dependabot runs with a 14-day cooldown.
- **CI**: `pnpm test` + `astro check` + build, and an e2e run against the production Docker image.

This section will get out of date. If it no longer matches the code, that mismatch is itself worth reporting.

## Scope

In scope: this repository's code (`src/`, `docker/`, `Dockerfile`, `.github/workflows/`).

Out of scope: third-party services this project depends on (report those upstream), social engineering, physical access, and denial-of-service reports without a concrete exploitable flaw.
