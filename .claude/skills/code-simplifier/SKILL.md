---
name: code-simplifier
description: Review CyberJust TypeScript/Astro code for idiomatic simplification. Detects over-engineering, unnecessary JS, verbose patterns. Applies TS (strictest) and Astro idioms without changing behavior.
triggers:
  - "simplify"
  - "too verbose"
  - "over-engineered"
  - "refactor this"
  - "make this idiomatic"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
effort: low
tags: [typescript, astro, simplify, refactor, idioms]
---

# CyberJust Code Simplifier

Review and simplify the TypeScript and `.astro` code in this repo (Astro 7 static site, TypeScript 6 with `astro/tsconfigs/strictest`, plain CSS layers, one custom element for the player) while respecting the project's constraints.

## Constraints (never simplify away)

- Nothing inline in generated HTML: no `style=""`, no `<style>`, no inline `<script>` except `application/ld+json`. Style changes from JS go through `el.style.setProperty(...)`. The CSP has no `'unsafe-inline'`.
- Document-level event delegation and the idempotent `connectedCallback` guard in `src/scripts/player.ts` (`if (this.#iniciado) return;`). Don't "simplify" into per-element or per-page listeners: with `<ClientRouter />` they would pile up.
- The single shared `<audio>` and the play call made directly inside the click handler (iOS needs the user gesture).
- `try/catch` around `localStorage` (`guardar` in `player.ts`) and around `navigator.mediaSession.setActionHandler`/`setPositionState`: they throw in some browsers.
- Bracket access on `dataset` (`d['id']`) is a house style, not a compiler requirement; keep it consistent. Non-null `!` after an index access is there because of `noUncheckedIndexedAccess`; only remove it if the value is narrowed another way.
- Accessibility attributes (`aria-*`, `aria-live`, `aria-valuetext`, semantic HTML, visible text alongside colors in `Selo.astro`) — never strip these for brevity.
- The zod schema in `src/content.config.ts` — don't loosen validation to shorten it.

## Simplification Patterns

### 1. Derive in the component frontmatter instead of in client JS

```astro
---
// ❌ Ships JS to compute something known at build time
---
<span data-segundos={audio.segundos} class="dur"></span>
<script>/* format every .dur on load */</script>

---
// ✅ Computed at build time, zero JS
import { formatarTempo } from '../lib/tempo';
---
<span class="dur">{formatarTempo(audio.segundos)}</span>
```

### 2. Early returns over nested conditionals

```ts
// ❌ Verbose
function formatarData(data: string): string {
  const [a, m, d] = data.split('-');
  if (m && d) {
    return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
  } else {
    return a ?? data;
  }
}

// ✅ Simple (as in src/lib/tempo.ts)
function formatarData(data: string): string {
  const [a, m, d] = data.split('-');
  if (!m || !d) return a ?? data;
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
}
```

### 3. Optional chaining / nullish coalescing over manual guards

```ts
// ❌ Verbose
const texto = botao.querySelector('[data-texto]') ? botao.querySelector('[data-texto]')!.textContent : 'Ouvir';

// ✅ Simple
const texto = botao.querySelector('[data-texto]')?.textContent ?? 'Ouvir';
```

### 4. Array methods over manual loops (and `.at(-1)`, `??=`)

```ts
// ❌ Verbose
const comAudio: Episodio[] = [];
for (let i = 0; i < episodios.length; i++) {
  if (episodios[i]!.data.audio) comAudio.push(episodios[i]!);
}

// ✅ Simple
const comAudio = episodios.filter((e) => e.data.audio);
```

### 5. CSS or HTML instead of JS

A toggle, filter or responsive tweak that can be done with `<details>`, radio + `:has()`, `[hidden]`, a `data-*` attribute selector or a container query should not be a script. Removing JS is the best simplification this repo can get.

### 6. Shared pure logic goes to `src/lib/`

If a page and `player.ts` compute the same thing (time formatting, labels, URLs), use the helper in `src/lib/tempo.ts` or `src/lib/episodios.ts` instead of duplicating it, and add a case to `src/lib/tempo.test.ts` when it's new pure logic.

## When to Use

- Manual invocation before opening a PR
- After a feature is functionally done but reads verbose
- When a script grew listeners, state or DOM queries that the markup could express

## Detection Commands

```bash
# Manual for-loops that could be array methods
rg -n "for \(let i = 0" src/

# Casts hiding a real type issue
rg -n "as any|as unknown as" src/

# Inline styles/scripts (forbidden by the CSP)
rg -n 'style="|<style|is:inline' src/

# Type check after simplifying (part of pnpm build)
pnpm check
```

Do not change behavior while simplifying — if a simplification changes the rendered HTML, the player's behavior or what the e2e suite asserts, stop and flag it instead of applying it silently.
