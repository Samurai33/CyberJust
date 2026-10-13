---
name: design-patterns
description: Astro design patterns for CyberJust. Static .astro components with typed Props, the episodios content collection, the <cj-player> custom element with document-level event delegation, CSS layers without inline styles. Use when designing new components or refactoring existing ones.
triggers:
  - "design pattern"
  - "how to structure"
  - "best pattern for"
  - "refactor to pattern"
allowed-tools:
  - Read
  - Grep
  - Glob
effort: medium
tags: [astro, design-patterns, architecture, components, web-components]
---

# CyberJust Astro Design Patterns

Patterns that apply to this repo's actual stack: Astro 7, 100% static output, no UI framework, one custom element for the player, CSS in `src/styles/global.css`. Every page must work without JavaScript and must not produce anything inline that the CSP (`docker/nginx.conf`, no `'unsafe-inline'`) would block.

## 1. Static `.astro` components with a typed `Props` interface

Components render to HTML at build time and ship zero JS. Declare `interface Props` (or a `type Props` union when variants need different fields, as in `Selo.astro`) and destructure with defaults from `Astro.props`.

```astro
---
// src/components/LinhaEpisodio.astro
import BotaoOuvir from './BotaoOuvir.astro';
import { rotuloEpisodio, urlEpisodio, type Episodio } from '../lib/episodios';
interface Props { ep: Episodio; nivel?: 'h2' | 'h3' }
const { ep, nivel = 'h3' } = Astro.props;
const H = nivel;
---
<article class="ep-row">
  <span class="n">{rotuloEpisodio(ep)}</span>
  <H><a href={urlEpisodio(ep)}>{ep.data.titulo}</a></H>
  <BotaoOuvir ep={ep} variante="linha" />
</article>
```

Prefer a small variant prop (`variante?: 'principal' | 'linha'`) or a `<slot />` over a list of boolean flags.

## 2. Content lives in the `episodios` collection, logic in `src/lib/`

- One Markdown file per episode in `src/content/episodios/<slug>.md`; the file name is the URL (`/episodios/<slug>/`). The zod schema in `src/content.config.ts` validates every field at build time (title length, date format, `audio.arquivo` regex, `https` only for `recursos[].url`).
- Pages never call `getCollection` directly for ordering/grouping: use `listarEpisodios()`, `recomendados()`, `urlEpisodio()`, `rotuloEpisodio()`, `grupoDoEpisodio()` from `src/lib/episodios.ts`, and the `Episodio` type (`CollectionEntry<'episodios'>`).
- Dynamic routes use `getStaticPaths()` and pass the entry as a prop (`src/pages/episodios/[id].astro`), then `render(ep)` for the Markdown body.
- Fixed site copy (menu, crime types, tips, experts, official channels) goes in `src/data/site.ts` as `as const` data, not hard-coded in pages.
- Pure helpers (time/date formatting, speed cycling, resume position) live in `src/lib/tempo.ts` and are unit-tested in `src/lib/tempo.test.ts`. New pure logic should follow that split so Vitest can cover it.

## 3. Interactivity: one custom element + `data-*` attributes + delegation

There is no hydration (`client:*` directives are not used). Behavior is plain TypeScript in `src/scripts/`, imported from a `<script>` tag in a component/layout so Astro bundles it as a module file (never inline).

- The player is `<cj-player transition:persist="player">` (`src/components/Player.astro`), defined in `src/scripts/player.ts`. A single `<audio>` exists for the whole session (iOS requirement).
- Any button that plays an episode is `BotaoOuvir.astro`, which emits `data-tocar` plus `data-id`, `data-src`, `data-titulo`, `data-url`, `data-rotulo`, `data-segundos`. Don't build another play button.
- Listeners are registered once on `document` (module scripts run once with `<ClientRouter />`) and use `closest('[data-...]')`. Never attach a listener per page or per element on navigation.
- Per-page sync happens on `astro:page-load` (and cleanup on `astro:after-swap`, as in `src/scripts/site.ts`).
- `connectedCallback` runs again every time the persisted element is moved to the new document, so it must be idempotent (`if (this.#iniciado) return;`).
- Internal refs use `data-ref="..."`, actions use `data-acao="..."`; state for CSS goes in attributes (`data-estado`, `data-tocando`, `hidden`), not classes toggled from many places.

```ts
document.addEventListener('click', (ev) => {
  const botao = (ev.target as Element).closest<HTMLButtonElement>('[data-tocar]');
  if (!botao) return;
  const faixa = faixaDoBotao(botao);
  const player = obterPlayer();
  if (faixa && player) player.tocar(faixa);
});
```

## 4. Prefer CSS (or HTML) over JS

- The episode filter on `/episodios/` is radio inputs + `:has()` in CSS, no JS.
- The mobile menu is a `<details data-menu>`; JS only closes it on outside click/Escape/navigation.
- Responsive player layout uses container queries (`@container player`), not resize listeners.
- When JS must change a style, use CSSOM custom properties (`el.style.setProperty('--p', ...)`), which the CSP allows. Never write `style=""` in markup or `<style>` blocks.

## 5. Styling: design-system layers in `global.css`

`@layer reset, tokens, base, layout, components, utilities;`. Use tokens from the `tokens` layer (`--bg`, `--fg`, `--accent`, ...) and put new component rules in `@layer components`. No scoped `<style>` in components (the build sets `inlineStylesheets: 'never'`, but keeping one stylesheet keeps the design system in one place). Icons are SVG via `Icon.astro` (decorative, `aria-hidden`); never rely on font glyphs like ✓ or →.

## When to Use

- Adding a new section, page or component
- A component's prop list is growing past ~5-6 props
- Deciding whether something needs JavaScript at all (default answer: no)

## Detection

```bash
# Inline styles/scripts that the CSP would block (only application/ld+json is allowed)
rg -n 'style="|<style|is:inline' src/

# Hydration directives (should not exist: no UI framework)
rg -n 'client:(load|idle|visible|only|media)' src/

# Every listener should hang off document, window, the custom element or its <audio>
rg -n 'addEventListener' src/

# Play buttons not using BotaoOuvir
rg -n 'data-tocar' src/ --glob '!BotaoOuvir.astro' --glob '!*.ts'
```
