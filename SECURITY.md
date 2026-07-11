# Security Policy

## Reporting a vulnerability

**Please don't open a public GitHub issue for a security vulnerability.**

Use [GitHub's private vulnerability reporting](https://github.com/Samurai33/CyberJust/security/advisories/new) for this repository instead — it notifies the maintainer directly without exposing the report publicly until a fix is ready.

Include what you can:
- What the vulnerability is and where (file/line if you have it)
- Steps to reproduce
- What an attacker could actually achieve with it

There's no dedicated security team or SLA — this is a small project maintained by one person. Response time is best-effort, not guaranteed within a fixed window.

## Current state (honest as of this writing)

CyberJustiça Brasil is a Next.js app, currently frontend-only with no database. Be aware of what that does and doesn't mean:

- **Dashboard auth**: server-verified via a Server Action + HMAC-signed `httpOnly` session cookie (see `app/actions/auth.ts`). There is no per-request rate limiting on login attempts (no persistence layer exists to track them yet) — the client-side "3 attempts" lockout is a UX nicety, not a real control.
- **Dashboard data** (projects/experts created through the UI): stored in the browser's `localStorage`, not on a server. It's scoped to the authenticated dashboard route, but there's no server-side access control per record — that would require a real backend, which doesn't exist yet.
- **No PII/case data is collected or stored server-side today.** If that changes, it should be reviewed with a much higher bar than a typical marketing site — see the `security-guardian` skill in `.claude/skills/` for the checklist this project uses internally.
- **Dependencies**: scanned weekly by Dependabot (`.github/dependabot.yml`); CI runs `pnpm type-check` + `pnpm build` on every PR, no security-specific scanning yet.

This section will get out of date — if you're reading this and it no longer matches the code, that mismatch is itself worth reporting.

## Scope

In scope: this repository's application code (`app/`, `components/`, `contexts/`, `lib/`, `services/`, `hooks/`).

Out of scope: third-party services this project depends on (report those upstream), social engineering, physical access, and denial-of-service reports without a concrete exploitable flaw.
