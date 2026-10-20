#!/bin/sh
# Publica o áudio no R2 (Worker cyberjus-audio + bucket cyberjus-audio) pela API da Cloudflare, sem wrangler/Node.
# Token de conta temporário em CF_TOKEN: Workers Scripts Edit + Workers R2 Storage Edit (conta) e Workers Routes
# Edit (zona cyberjus.org). Apague o token no painel depois.
#   CF_TOKEN=... sh worker/audio/publicar.sh bucket    -> cria o bucket (se não existir)
#   CF_TOKEN=... sh worker/audio/publicar.sh script    -> sobe worker.js + mp4.js com o binding AUDIO (mantém o segredo)
#   CF_TOKEN=... ENVIO=... sh worker/audio/publicar.sh segredo -> grava o segredo ENVIO (o mesmo do pipeline)
#   CF_TOKEN=... sh worker/audio/publicar.sh teste     -> liga o endereço *.workers.dev (enviar e testar antes da rota)
#   CF_TOKEN=... sh worker/audio/publicar.sh sem-teste -> desliga o *.workers.dev
#   CF_TOKEN=... sh worker/audio/publicar.sh rota      -> www.cyberjus.org/audio/* -> Worker (só depois de enviar tudo)
#   CF_TOKEN=... sh worker/audio/publicar.sh desfazer  -> apaga a rota (o /audio/ volta para a origem)
# Os arquivos entram pelo próprio Worker (PUT com o segredo): node scripts/audio-r2.mjs ou o pipeline.
set -eu
ACC=35f8be2ffd8ab7bde84c9379dd89dbda
NOME=cyberjus-audio
BUCKET=cyberjus-audio
ROTA='www.cyberjus.org/audio/*'
DIR=$(dirname "$0")
API=https://api.cloudflare.com/client/v4
: "${CF_TOKEN:?defina CF_TOKEN}"
c() { curl -sS -A 'n3xus-publicar/1' -H "Authorization: Bearer $CF_TOKEN" "$@"; }
ok() { python3 -c 'import json,sys;d=json.load(sys.stdin);print("OK" if d["success"] else d["errors"])'; }
zona() { c "$API/zones?name=cyberjus.org" | python3 -c 'import json,sys;print(json.load(sys.stdin)["result"][0]["id"])'; }

case "$1" in
bucket)
  # Sem região na América do Sul: enam (leste da América do Norte) é a mais perto do Brasil.
  c "$API/accounts/$ACC/r2/buckets/$BUCKET" | python3 -c 'import json,sys;sys.exit(0 if json.load(sys.stdin)["success"] else 1)' && echo "já existe" ||
    c -X POST "$API/accounts/$ACC/r2/buckets" -H 'content-type: application/json' \
      -d "{\"name\":\"$BUCKET\",\"locationHint\":\"enam\"}" | ok ;;
script)
  META=$(python3 -c 'import json,sys;print(json.dumps({"main_module":"worker.js","compatibility_date":"2026-10-01",
    "observability":{"enabled":True,"head_sampling_rate":0.01},
    "bindings":[{"type":"r2_bucket","name":"AUDIO","bucket_name":sys.argv[1]}],"keep_bindings":["secret_text"]}))' "$BUCKET")
  c -X PUT "$API/accounts/$ACC/workers/scripts/$NOME" \
    -F "metadata=$META;type=application/json" \
    -F "worker.js=@$DIR/worker.js;type=application/javascript+module" \
    -F "mp4.js=@$DIR/mp4.js;type=application/javascript+module" | ok ;;
segredo)
  : "${ENVIO:?defina ENVIO (o mesmo valor de AUDIO_ENVIO no pipeline)}"
  python3 -c 'import json,os;print(json.dumps({"name":"ENVIO","text":os.environ["ENVIO"],"type":"secret_text"}))' |
    c -X PUT "$API/accounts/$ACC/workers/scripts/$NOME/secrets" -H 'content-type: application/json' --data-binary @- | ok ;;
teste|sem-teste)
  [ "$1" = teste ] && L=true || L=false
  c -X POST "$API/accounts/$ACC/workers/scripts/$NOME/subdomain" -H 'content-type: application/json' \
    -d "{\"enabled\":$L,\"previews_enabled\":false}" | ok
  SUB=$(c "$API/accounts/$ACC/workers/subdomain" | python3 -c 'import json,sys;print(json.load(sys.stdin)["result"]["subdomain"])')
  [ "$1" = teste ] && echo "https://$NOME.$SUB.workers.dev" || true ;;
rota)
  c -X POST "$API/zones/$(zona)/workers/routes" -H 'content-type: application/json' \
    -d "{\"pattern\":\"$ROTA\",\"script\":\"$NOME\"}" | ok ;;
desfazer)
  Z=$(zona)
  for id in $(c "$API/zones/$Z/workers/routes" | python3 -c "import json,sys;[print(r['id']) for r in json.load(sys.stdin)['result'] if r.get('script')=='$NOME']"); do
    c -X DELETE "$API/zones/$Z/workers/routes/$id" | ok; done ;;
*) echo "uso: $0 bucket|script|segredo|teste|sem-teste|rota|desfazer" >&2; exit 2 ;;
esac
