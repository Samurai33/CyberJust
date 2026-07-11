---
description: Web app security expert for CyberJust - XSS, secrets handling, auth, dependency vulnerabilities, PII/case-data handling
allowed-tools: Read Grep Glob Bash
---

# Security Guardian

Security analysis for CyberJust — a cybercrime investigation platform. Because the domain involves investigative/case data and expert/user accounts, treat security review as higher-stakes than a typical marketing site, even while the codebase is still frontend-only.

## When to Use

- **Automatically triggered**: After changes to `DashboardAuthModal`, any future API route or server action, form submission handlers, or anything reading `process.env`
- **Manual invocation**: Before release, after adding a new dependency, after adding any data-persistence or auth logic
- **Proactive**: Whenever user input (search, contact form, comments) reaches the DOM or a future backend

## Threat Categories for This Stack

| Threat | Severity | Where it shows up here |
|--------|----------|-------------------------|
| **XSS (stored/reflected)** | 🔴 Critical | Any `dangerouslySetInnerHTML`, unsanitized user-generated content (expert bios, comments) |
| **Secrets in client bundle** | 🔴 Critical | `NEXT_PUBLIC_*` env vars, API keys imported into client components |
| **Auth/session handling** | 🔴 Critical | `DashboardAuthModal` and any future login flow — token storage, session expiry |
| **Dependency vulnerabilities** | 🟡 High | `pnpm audit` against `package.json` |
| **PII / case-data exposure** | 🟡 High | Any future storage of investigation data, expert contact info, user reports |
| **Open redirect / SSRF** | 🟢 Medium | Any future server action or API route accepting a URL |

## Security Analysis Workflow

### 1. XSS

```tsx
// 🔴 CRITICAL: renders raw HTML from any source that isn't fully trusted
<div dangerouslySetInnerHTML={{ __html: episode.description }} />

// ✅ SAFE: render as text, or sanitize with a vetted library (e.g. DOMPurify)
// if actual rich HTML rendering is required
<div>{episode.description}</div>
```

```bash
rg "dangerouslySetInnerHTML" app/ components/
```

### 2. Secrets / environment variables

Next.js inlines any `NEXT_PUBLIC_*` variable into the client bundle — it is **not** a secret once used that way.

```bash
# Anything NEXT_PUBLIC_ that looks like it should be a secret (key, token, password)
rg "NEXT_PUBLIC_.*(KEY|SECRET|TOKEN|PASSWORD)" --type ts --type tsx -i

# process.env usage inside a "use client" file — server-only secrets leaking to client
rg -l '"use client"' components/ app/ | xargs grep -l "process\.env" 2>/dev/null
```

- [ ] No `.env` file is committed (`git status` / `.gitignore` should cover it — verify `.gitignore` still lists `.env*`)
- [ ] Server-only secrets never imported into a `"use client"` module

### 3. Auth (current + future)

`DashboardAuthModal` is the current auth surface. Before it starts talking to a real backend:

- [ ] Passwords never logged, never sent in a GET query string
- [ ] Session tokens stored in `httpOnly` cookies, not `localStorage`, if/when a real backend is added
- [ ] Rate limiting on login attempts once a real auth endpoint exists
- [ ] No auth check done client-side only — any protected data must be gated server-side too

### 4. Dependency vulnerabilities

```bash
pnpm audit
```

Run before release and after adding any new dependency. Fix or explicitly document why a finding is accepted (e.g. dev-only dependency, no reachable path).

### 5. PII / case-data handling (forward-looking)

This platform's subject matter means any future feature storing investigation details, victim/witness info, or expert contact data should default to:
- Minimum necessary data collected
- No PII in logs, error messages, or analytics events
- Explicit access control per record, not just per-route

## Detection Command Reference

```bash
# XSS surface
rg "dangerouslySetInnerHTML" app/ components/

# Secrets risk
rg "NEXT_PUBLIC_.*(KEY|SECRET|TOKEN|PASSWORD)" -i
rg -l '"use client"' components/ app/ | xargs grep -l "process\.env"

# Open redirects (once server actions/API routes exist)
rg "redirect\(.*req\.|redirect\(.*searchParams" --type ts

# Dependency vulnerabilities
pnpm audit
```

## Incident Response

1. **Assess severity** (CVSS-style: Critical/High/Medium/Low)
2. **Patch in an isolated branch**, don't fix directly on `main`
3. **Verify the fix** manually (reproduce the issue pre-fix, confirm it's gone post-fix)
4. **Document** in the PR description what the vulnerability was and how it's mitigated — don't put exploit details in public commit messages if the app is live
