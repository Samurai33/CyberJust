# CyberJust — CyberJustiça Brasil

Site do podcast CyberJustiça Brasil (casos reais de crimes cibernéticos). **Astro 7, 100% estático**, servido por nginx (imagem `nginx-unprivileged`) em Docker no **Coolify** (VM 520), atrás do Cloudflare Tunnel, em [www.cyberjus.org](https://www.cyberjus.org). Visual: design system N3XUS, o mesmo do repositório `N3xusD3v/n3xus-site` (tokens em `src/styles/global.css`).

## Comandos

```bash
pnpm dev | pnpm test | pnpm build      # build = astro check + astro build
docker build -t cyberjust . && docker run --rm -p 127.0.0.1:18080:8080 cyberjust
BASE_URL=http://127.0.0.1:18080 pnpm test:e2e   # e2e SEMPRE contra a imagem (nginx/CSP reais)
```

CI: `ci.yml` (check obrigatório `build`: vitest + astro check + build) e `e2e.yml` (build da imagem + Playwright em chromium/webkit/iphone/ipad/android, no contêiner `mcr.microsoft.com/playwright`).

## Regras que não podem quebrar

- **CSP sem `'unsafe-inline'`** (definida em `docker/nginx.conf`). Nada inline no HTML gerado: sem `<style>`, sem `style=""`, sem `<script>` inline (exceto `application/ld+json`). Por isso `build.inlineStylesheets: 'never'` e `vite.build.assetsInlineLimit: 0`. Mudar estilo via JS só por CSSOM (`el.style.setProperty`), que a CSP permite. O e2e falha em qualquer violação.
- Não usar o `security.csp` do Astro: ele não suporta `<ClientRouter />`, que é o que mantém o áudio tocando entre páginas.
- **Player** (`src/scripts/player.ts`, `<cj-player transition:persist>`): um único `<audio>` na sessão (exigência do iOS). Os scripts de módulo rodam uma vez só; a página nova se sincroniza em `astro:page-load`. Use delegação no `document` e nunca registre ouvinte por página. O `connectedCallback` roda de novo após cada troca de página, então precisa ser idempotente.
- Botão que toca episódio: sempre `BotaoOuvir.astro` (atributos `data-tocar`).
- Áudio: AAC em MP4 com `moov` no início (`-movflags +faststart`), arquivo novo a cada mudança (cache imutável). O e2e confere a ordem `ftyp`/`moov`.
- Sem glifos que dependem da fonte (✓, →, ●): use SVG (`Icon.astro`) ou texto.
- Conteúdo factual: nada de números, nomes ou e-mails inventados. Links oficiais conferidos (HTTP 200).
- URLs antigas do site Next (`/episodes/<n>`) têm 301 no nginx. Novo slug = novo redirect + teste em `e2e/servidor.spec.ts`.
- Dependências: pnpm 10 com `minimumReleaseAge` de 14 dias (`pnpm-workspace.yaml`); versões exatas no `package.json`; imagens Docker e actions fixadas por digest/SHA.
- TypeScript 6 (o `@astrojs/check` 0.9 não aceita o 7), tsconfig `astro/tsconfigs/strictest`.

## Painel, feed e SEO

- Painel: Sveltia CMS em `src/pages/dash-*/` (caminho em `src/data/dash.ts`). Os 3 cliques no logo (`src/scripts/logo-atalho.ts`) abrem o Estúdio, `ESTUDIO_PATH` = `/dash-…/estudio/`, o painel do pipeline servido pelo contêiner do bot (`podcast/`), não por este nginx. O Cloudflare Access protege esse caminho. O painel é noindex (meta e `X-Robots-Tag`), fica fora do sitemap e tem CSP própria em `docker/nginx.conf`. Login só com token fine-grained. Mudou um campo do esquema? Atualize `src/cms/config.ts` também.
- `src/lib/mp4.ts` lê duração e tamanho do áudio no build e **falha** se o MP4 não tiver faststart.
- Feed: `src/pages/podcast.xml.ts` (RSS + itunes + podcast namespace; `podcast:guid` é um UUIDv5 da URL do feed e não pode mudar). A capa de 3000 px vem de `design/capa.html`.
- Prévia por episódio: `src/pages/og/[arquivo].ts` (satori + resvg + sharp, fontes `@fontsource/*` em WOFF, porque o satori não lê WOFF2). O nome leva um hash do conteúdo da arte.
- JSON-LD: um `@graph` por página (`Base.astro`). `@id`s fixos em `src/data/site.ts#LD`. Episódio = `PodcastEpisode` + `BreadcrumbList`; `/sobre/` = `ProfilePage` do Samurai.
- Áudio, transcrições, capítulos, feed, capa e prévias usam CORP `cross-origin` (apps de podcast e WhatsApp Web); o HTML usa `same-origin`.

## Deploy

O app do Coolify é `cyberjust-web` (uuid `3xuywg7do0sgc8q7kzrclikz`), porta **8080**, healthcheck do Dockerfile. Um webhook do GitHub (push) publica cada commit na `main`, inclusive os do painel. Depois do merge, confira se o deploy terminou e teste o site no ar: CI verde não é deploy.

### Espelho de emergência (Cloudflare Pages)

Projeto Pages `cyberjus` ligado à `main`: comando `sh scripts/pages-build.sh`, saída `dist`, `NODE_VERSION=24` e `PNPM_VERSION` = a do `packageManager`. O `scripts/espelho-pages.mjs` gera `_headers` e `_redirects` **lendo o `docker/nginx.conf`** (fonte única) e tira o painel `/dash-*/` (no `pages.dev` não há Access). Quando a VM 520 ou o túnel caem, o Worker `n3xus-manutencao` (repositório `n3xus-site`, pasta `manutencao/`) serve o espelho no próprio `www.cyberjus.org` (header `x-n3xus-espelho: 1`). O contador continua no Worker dele; o painel e o Estúdio mostram a página de manutenção. Regex nova num `location ... return 301` só com grupos `(a|b)` e `/?` no fim: outra forma faz o build do espelho falhar de propósito.
