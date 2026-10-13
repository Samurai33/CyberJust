<div align="center">

<img src="public/icon-192.png" alt="" width="96">

# CyberJustiça Brasil

### Podcast sobre crimes cibernéticos no Brasil: casos reais, investigação e proteção digital

[![Site](https://img.shields.io/badge/site-cyberjus.org-5cc8ff?style=for-the-badge)](https://www.cyberjus.org)
[![Astro](https://img.shields.io/badge/Astro-7-8b7cff?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![CI](https://github.com/Samurai33/CyberJust/actions/workflows/ci.yml/badge.svg)](https://github.com/Samurai33/CyberJust/actions/workflows/ci.yml)
[![E2E](https://github.com/Samurai33/CyberJust/actions/workflows/e2e.yml/badge.svg)](https://github.com/Samurai33/CyberJust/actions/workflows/e2e.yml)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-f59e0b?style=flat-square)](LICENSE)

</div>

Site estático feito com [Astro](https://astro.build/), servido por nginx em Docker. Segue o design
system N3XUS (o mesmo do [n3xus.dev](https://n3xus.dev)). Conteúdo educativo: não é um sistema
policial nem orientação jurídica.

## Destaques

- **Player que não para ao navegar.** Usa um `<audio>` nativo com streaming por HTTP Range e
  persiste entre páginas (`<ClientRouter />` + `transition:persist`). A Media Session API mostra o
  episódio na tela de bloqueio e na Central de Controle e aceita teclas de mídia e fones. O player
  continua de onde você parou e lembra velocidade e volume. É um Web Component, sem framework.
- **Leve.** Cerca de 26 KB de JavaScript no total. Sem React, sem Tailwind, sem Node em produção.
  As páginas funcionam sem JavaScript (o filtro de episódios usa só CSS, com `:has()`).
- **Seguro por padrão.**
  - Política de segurança de conteúdo (CSP) sem `'unsafe-inline'`.
  - HSTS, COOP/CORP, `frame-ancestors 'none'` e Permissions-Policy.
  - nginx sem root, imagens Docker e actions fixadas por hash.
  - Dependências só com 14 dias ou mais de publicação (`minimumReleaseAge`).
  - Zero recursos de terceiros: sem rastreadores, sem cookies, fontes servidas do próprio domínio.
- **Responsivo de verdade.** Testado em Chrome, Safari (WebKit), iPhone, iPad e Android. Tem
  áreas seguras do iPhone (`safe-area-inset`), alvos de toque de 44 px, layout do player por
  container queries e respeita a preferência por menos movimento.

## Comandos

Pré-requisitos: Node 22.12 ou superior e pnpm 10 (`corepack enable`).

```bash
pnpm install          # dependências (lockfile congelado no CI)
pnpm dev              # servidor de desenvolvimento em http://localhost:4321
pnpm test             # testes unitários (Vitest)
pnpm build            # astro check (tipos) + build estático em dist/
docker build -t cyberjust .                                  # a mesma imagem da produção
docker run --rm -p 127.0.0.1:18080:8080 cyberjust            # site em http://127.0.0.1:18080
BASE_URL=http://127.0.0.1:18080 pnpm test:e2e                # e2e contra a imagem (5 navegadores)
```

## Estrutura

| Caminho | O que é |
| --- | --- |
| `src/content/episodios/*.md` | Um arquivo por episódio. O nome do arquivo vira a URL; o esquema fica em `src/content.config.ts`. |
| `src/pages/` | Rotas: `/`, `/episodios/`, `/episodios/[id]/`, `/privacidade/`, `404`. |
| `src/scripts/player.ts` | O player (`<cj-player>`). Qualquer botão com `data-tocar` controla o player. |
| `src/styles/global.css` | Design system N3XUS em camadas CSS (tokens, base, layout, componentes). |
| `src/data/site.ts`, `src/data/temas.ts` | Textos fixos (menu, especialista, convidados, canais oficiais, N3XUS) e os temas. |
| `src/cms/config.ts`, `src/pages/dash-*/` | Painel de episódios (Sveltia CMS). |
| `src/pages/podcast.xml.ts`, `src/pages/og/` | Feed do podcast e imagens de prévia por episódio, gerados no build. |
| `docker/` | nginx: CSP e headers, redirects 301 das URLs antigas, cache. |
| `design/` | Fontes da imagem de prévia e dos ícones (`sh design/gerar-imagens.sh`). |
| `e2e/` | Playwright: páginas, CSP, player, headers, redirects e Range. |

## Publicar e gerenciar episódios

**Pelo painel** (recomendado): três cliques no logo do site abrem `/dash-…/` (Sveltia CMS).
1. O Cloudflare Access pede o login do dono.
2. No painel, entre com um **token fine-grained do GitHub** com só *Contents: Read and write* no
   repositório `Samurai33/CyberJust`, com validade curta. O OAuth do GitHub foi descartado de propósito,
   porque exige acesso a todos os repositórios.
3. Crie, edite ou remova episódios e envie o áudio `.m4a` e a transcrição `.vtt`. Cada "Salvar" vira
   um commit na `main`, e o webhook publica no Coolify em 1 a 2 minutos.

**Por Git:** crie `src/content/episodios/<slug>.md` seguindo o esquema de `src/content.config.ts` e abra um PR.

Regras validadas pelo build (se algo quebrar, o deploy falha e o site anterior continua no ar):
- **Áudio** em AAC/M4A com o índice no início:
  `ffmpeg -i entrada -map 0:a -c copy -movflags +faststart public/audio/<nome-novo>.m4a`.
  A duração e o tamanho são lidos do arquivo, então você não preenche nada à mão.
  Use sempre um nome novo: o áudio tem cache imutável.
- **Resumo** com 50 a 155 caracteres e **título** com 10 a 90 (`tituloSeo` com até 60 para a aba e as prévias).
- **Fontes** só com `https://` oficiais. Nada de números, nomes ou contatos sem fonte.
- **Slug:** o nome do arquivo é a URL e não deve mudar depois de publicado.
  Se mudar, adicione um 301 em `docker/nginx.conf`.

Cada episódio ganha sozinho uma página, uma imagem de prévia própria (`/og/<slug>-<hash>.jpg`), uma
entrada no feed `/podcast.xml` (Apple Podcasts, Spotify e Podcasting 2.0), JSON-LD e `lastmod` no sitemap.

## Deploy

O Coolify (VM 520) constrói o `Dockerfile` a partir da `main` e serve na porta 8080 atrás do
Cloudflare Tunnel. O domínio canônico é `www.cyberjus.org`; o nginx redireciona `cyberjus.org` para ele.

## Licença

[MIT](LICENSE).
