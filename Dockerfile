# syntax=docker/dockerfile:1
# Imagens fixadas por digest (as mesmas do n3xus.dev): build reproduzível e sem troca silenciosa de base.
FROM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# nginx oficial sem root (usuário nginx, porta 8080). Só arquivos estáticos: nada de Node em produção.
FROM nginxinc/nginx-unprivileged:1.31.6-alpine@sha256:884e0b7f42f303641b0f4e78755aea647521dca0b89ca3be7992ad78b5c07434
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/security-headers-public.conf /etc/nginx/snippets/security-headers-public.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --chmod=755 docker/versao.sh /docker-entrypoint.d/40-versao.sh
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:8080/robots.txt || exit 1
