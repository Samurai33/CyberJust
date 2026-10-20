#!/bin/sh
# Roda na subida do contêiner (/docker-entrypoint.d do nginx). Escreve o commit publicado em /tmp/versao.txt,
# servido em /versao.txt (docker/nginx.conf). O Coolify passa o commit no SOURCE_COMMIT do contêiner.
# O monitor (LXC 730) compara com o /versao.txt do espelho no Pages e avisa se ficarem diferentes.
printf '%s\n' "${SOURCE_COMMIT:-desconhecido}" > /tmp/versao.txt
