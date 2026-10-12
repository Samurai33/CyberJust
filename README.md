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
| `src/data/site.ts` | Textos fixos: menu, tipos de crime, dicas, especialistas, canais oficiais. |
| `docker/` | nginx: CSP e headers, redirects 301 das URLs antigas, cache. |
| `design/` | Fontes da imagem de prévia e dos ícones (`sh design/gerar-imagens.sh`). |
| `e2e/` | Playwright: páginas, CSP, player, headers, redirects e Range. |

## Publicar um episódio

1. Converta o áudio para AAC em MP4 com o índice no início. Sem isso o streaming não funciona:
   `ffmpeg -i entrada.m4a -map 0:a -c copy -movflags +faststart public/audio/<nome-novo>.m4a`
2. Use sempre um **nome novo** de arquivo: o áudio é servido com cache imutável.
3. Crie `src/content/episodios/<slug>.md` com `audio.arquivo`, `audio.segundos` e `audio.bytes`
   (valores do `ffprobe` e do `ls -l`). O build valida o esquema.
4. Abra um PR. O CI roda os testes, o build e o e2e; depois do merge, o Coolify publica.

## Deploy

O Coolify (VM 520) constrói o `Dockerfile` a partir da `main` e serve na porta 8080 atrás do
Cloudflare Tunnel. O domínio canônico é `www.cyberjus.org`; o nginx redireciona `cyberjus.org` para ele.

## Licença

[MIT](LICENSE).
