#!/bin/sh
# Build do espelho de emergência no Cloudflare Pages (projeto "cyberjus", ligado à branch main).
# Comando de build no Pages: sh scripts/pages-build.sh   (diretório de saída: dist)
# Variáveis no Pages: NODE_VERSION=24, PNPM_VERSION = a do package.json#packageManager.
set -eu
cd "$(dirname "$0")/.."
[ "${SO_ARQUIVOS:-}" = 1 ] || pnpm build
node scripts/espelho-pages.mjs
