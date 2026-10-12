#!/bin/sh
# Gera public/og-v1.jpg (prévia de link) e os ícones a partir de design/og.html e design/icone.svg.
# Precisa de Docker e das dependências instaladas (fontes em node_modules). Rode na raiz do repositório.
# Mudou a arte? Gere com outro nome (og-v2.jpg) e atualize Base.astro: a Cloudflare e as redes cacheiam a imagem.
set -e
docker run --rm -v "$PWD":/w -w /w -e OWN="$(id -u):$(id -g)" alpine:3 sh -c '
  apk add -q chromium imagemagick >/dev/null 2>&1
  timeout 90 chromium-browser --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars \
    --allow-file-access-from-files --virtual-time-budget=5000 --window-size=1200,630 \
    --screenshot=/tmp/og.png file:///w/design/og.html >/dev/null 2>&1
  magick /tmp/og.png -strip -interlace JPEG -quality 86 public/og-v1.jpg
  timeout 60 chromium-browser --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars \
    --window-size=1024,1024 --screenshot=/tmp/icone.png file:///w/design/icone.svg >/dev/null 2>&1
  magick /tmp/icone.png -resize 512x512 -strip public/icon-512.png
  magick /tmp/icone.png -resize 192x192 -strip public/icon-192.png
  magick /tmp/icone.png -resize 180x180 -strip public/apple-touch-icon.png
  magick /tmp/icone.png -resize 32x32 -strip public/favicon-32x32.png
  magick /tmp/icone.png -define icon:auto-resize=48,32,16 public/favicon.ico
  chown "$OWN" public/og-v1.jpg public/icon-*.png public/apple-touch-icon.png public/favicon*
'
ls -la public/og-v1.jpg public/icon-*.png public/apple-touch-icon.png public/favicon*
