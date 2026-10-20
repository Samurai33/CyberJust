#!/bin/sh
# Build do espelho de emergência no Cloudflare Pages (projeto "cyberjus", ligado à branch main).
# Comando de build no Pages: sh scripts/pages-build.sh   (diretório de saída: dist)
# Variáveis no Pages: NODE_VERSION=24, PNPM_VERSION = a do package.json#packageManager.
set -eu
cd "$(dirname "$0")/.."
[ "${SO_ARQUIVOS:-}" = 1 ] || pnpm build
node scripts/espelho-pages.mjs
# Commit deste build em /versao.txt (o Pages informa no CF_PAGES_COMMIT_SHA). O monitor do LXC 730 compara com o
# /versao.txt do site (docker/versao.sh) e avisa se o espelho ficar para trás.
printf '%s\n' "${CF_PAGES_COMMIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo desconhecido)}" > dist/versao.txt
