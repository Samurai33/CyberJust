---
description: Security expert for CyberJust (static Astro site behind nginx) - CSP and security headers, XSS in build-time HTML, supply chain, container hardening, browser storage
allowed-tools: Read Grep Glob Bash
---

# Security Guardian

Security analysis for CyberJust — the CyberJustiça Brasil podcast site. It is a **fully static site**: `astro build` output served by `nginxinc/nginx-unprivileged` in Docker (Coolify, behind Cloudflare Tunnel). There is no backend, no database, no login, no forms, no cookies, no analytics and no third-party resources (SECURITY.md "Current state"). The attack surface is the generated HTML, the nginx config, and the supply chain that produces the build.

## When to Use

- **Automatically triggered**: After changes to `docker/nginx.conf`, `docker/security-headers*.conf`, `Dockerfile`, `astro.config.mjs`, `src/layouts/Base.astro`, anything using `set:html`, or `.github/workflows/`
- **Manual invocation**: Before release, after adding or bumping a dependency, after adding any external resource (font, image host, embed, script)
- **Proactive**: Whenever content from Markdown/frontmatter reaches HTML or JSON-LD, or a script starts storing something in the browser

## Threat Categories for This Stack

| Threat | Severity | Where it shows up here |
|--------|----------|-------------------------|
| **XSS via raw HTML** | 🔴 Critical | `set:html` (only used for JSON-LD in `Base.astro`), `innerHTML` in `src/scripts/` |
| **CSP weakened** | 🔴 Critical | `docker/nginx.conf` `$csp`; any `'unsafe-inline'`, new origin, or inline style/script in the build |
| **Supply chain** | 🔴 Critical | `package.json` (exact versions), `pnpm-lock.yaml`, `pnpm-workspace.yaml` (`minimumReleaseAge`, `onlyBuiltDependencies`), Docker base images and Actions pinned by digest/SHA |
| **Missing headers on a location** | 🟡 High | nginx `add_header` inside a `location` drops inherited headers: every block must re-include the snippet |
| **Path/redirect tricks** | 🟡 High | encoded slash rejection, host/HTTPS redirects, `/episodes/*` 301s in `nginx.conf` |
| **Container privileges** | 🟡 High | `Dockerfile` final stage must stay `nginx-unprivileged` (port 8080, no Node in production) |
| **Browser storage** | 🟢 Medium | `localStorage` keys `cj:*` in `player.ts` (position, speed, volume only; never personal data) |
| **External links** | 🟢 Medium | `recursos[].url` in episodes (schema forces `https`), official channels in `src/data/site.ts` |

## Security Analysis Workflow

### 1. XSS in generated HTML

Astro escapes `{expressions}` by default. The risk is opting out of that.

```astro
<!-- 🔴 Raw HTML from content -->
<div set:html={ep.data.resumo} />

<!-- ✅ Escaped text -->
<div>{ep.data.resumo}</div>
```

- `set:html` is acceptable only for `JSON.stringify(...)` inside `<script type="application/ld+json">` with site-controlled data. If frontmatter could ever contain `</script>`, escape `<` in the JSON before injecting.
- In `src/scripts/`, write user-visible strings with `textContent`, never `innerHTML`.

```bash
rg -n "set:html|innerHTML|outerHTML|insertAdjacentHTML" src/
```

### 2. CSP and headers (the nginx model)

The CSP is set in `docker/nginx.conf`, not by Astro (Astro's `security.csp` doesn't support `<ClientRouter />`):

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; media-src 'self'; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

- [ ] No `'unsafe-inline'` / `'unsafe-eval'`. The build must not inline anything: `build.inlineStylesheets: 'never'` and `vite.build.assetsInlineLimit: 0` in `astro.config.mjs` stay as they are. No `style=""`, `<style>`, `is:inline` or inline `<script>` (except `application/ld+json`). JS changes styles only via `el.style.setProperty`.
- [ ] Any new external resource needs an explicit CSP change and a reason. The project's stance is zero third parties; prefer self-hosting (fonts come from `@fontsource-variable/*`).
- [ ] Every `location` that uses `add_header` includes `/etc/nginx/snippets/security-headers.conf` (or `security-headers-public.conf` for the OG image/icons, which need `Cross-Origin-Resource-Policy: cross-origin` for WhatsApp Web) and re-adds `Content-Security-Policy` where HTML/JS/CSS/media can be served.
- [ ] Headers expected by `e2e/servidor.spec.ts`: HSTS (no preload), `nosniff`, `X-Frame-Options: DENY`, COOP `same-origin`, Referrer-Policy, Permissions-Policy, and `Server: nginx` with no version (`server_tokens off`).
- [ ] The e2e suite (`e2e/ajuda.ts` `vigiar`) fails on any CSP violation in any page; run it against the Docker image, never against `pnpm dev`.

### 3. Supply chain

```bash
pnpm audit
```

- [ ] Exact versions in `package.json`, `pnpm install --frozen-lockfile` in CI and Dockerfile.
- [ ] `minimumReleaseAge: 20160` (14 days) in `pnpm-workspace.yaml` stays; only `esbuild` and `sharp` in `onlyBuiltDependencies`.
- [ ] Docker `FROM` lines pinned by `@sha256:` digest; GitHub Actions pinned by commit SHA with the version in a comment; workflows keep `permissions: contents: read` and `persist-credentials: false`.
- [ ] Dependabot (`.github/dependabot.yml`) uses a 14-day cooldown matching the pnpm rule.

### 4. Secrets and environment

There are no runtime env vars: the site is static and nginx serves files. Nothing in `src/` should read `process.env` or `import.meta.env` for secrets — anything referenced at build time ends up in public HTML/JS.

```bash
rg -n "process\.env|import\.meta\.env" src/
```

- [ ] `.gitignore` still lists `.env*`.

### 5. Browser storage and privacy

The player stores only `cj:posicao:<id>`, `cj:velocidade` and `cj:volume` in `localStorage`, wrapped in `try/catch`. The privacy page (`src/pages/privacidade.astro`) describes this; update it if storage changes. No cookies, no tracking, no data sent anywhere.

## Detection Command Reference

```bash
# XSS surface
rg -n "set:html|innerHTML|outerHTML|insertAdjacentHTML" src/

# Inline content the CSP would block
rg -n 'style="|<style|is:inline' src/

# External origins referenced by code/styles (should be none)
rg -n 'https?://' src/scripts src/styles src/layouts

# Every location with add_header must include a security-headers snippet
rg -n "location|include /etc/nginx/snippets|add_header" docker/nginx.conf

# Live headers on the image
docker run --rm -d --name cj-sec -p 127.0.0.1:18080:8080 cyberjust && curl -sI http://127.0.0.1:18080/ ; docker stop cj-sec

# Dependencies
pnpm audit
```

## Incident Response

1. **Assess severity** (CVSS-style: Critical/High/Medium/Low)
2. **Patch in an isolated branch**, don't fix directly on `main`
3. **Verify the fix** against the Docker image (reproduce pre-fix, confirm post-fix) and add an e2e assertion when it's a header/redirect/CSP issue
4. **Document** in the PR description what the vulnerability was and how it's mitigated — don't put exploit details in public commit messages while the site is live; reports go through GitHub private vulnerability reporting (SECURITY.md)
