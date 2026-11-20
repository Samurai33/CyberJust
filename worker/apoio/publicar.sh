#!/bin/sh
# Publica o apoio dos ouvintes (Worker cyberjus-apoio + D1) pela API da Cloudflare, sem wrangler/Node.
# Token de conta temporário em CF_TOKEN: Workers Scripts Edit + D1 Edit (conta) e Workers Routes Edit
# (zona cyberjus.org). Apague o token no painel depois.
#   CF_TOKEN=... sh worker/apoio/publicar.sh d1                 -> cria o banco (se não existir) e aplica schema.sql
#   CF_TOKEN=... ASAAS_BASE=https://api.asaas.com/v3 sh worker/apoio/publicar.sh script
#                                                                -> sobe worker.js (DB, LIMITE, ASAAS_BASE)
#   CF_TOKEN=... ASAAS_KEY=... WEBHOOK_TOKEN=... sh worker/apoio/publicar.sh segredos
#                                                                -> grava ASAAS_KEY e WEBHOOK_TOKEN no Worker
#   ASAAS_BASE=... ASAAS_KEY=... WEBHOOK_TOKEN=... sh worker/apoio/publicar.sh webhook
#                                                                -> cadastra o webhook no Asaas (pagamentos)
#   CF_TOKEN=... sh worker/apoio/publicar.sh rota               -> www.cyberjus.org/api/apoio* -> Worker
#   CF_TOKEN=... sh worker/apoio/publicar.sh desfazer           -> apaga a rota (a página Apoie mostra o aviso de fora do ar)
# WEBHOOK_TOKEN: 32+ caracteres aleatórios, o mesmo no Worker e no Asaas (ex.: openssl rand -hex 24).
set -eu
ACC=35f8be2ffd8ab7bde84c9379dd89dbda
NOME=cyberjus-apoio
BANCO=cyberjus-apoio
ROTA='www.cyberjus.org/api/apoio*'
DIR=$(dirname "$0")
API=https://api.cloudflare.com/client/v4
c() { curl -sS -A 'n3xus-publicar/1' -H "Authorization: Bearer ${CF_TOKEN:?defina CF_TOKEN}" "$@"; }
ok() { python3 -c 'import json,sys;d=json.load(sys.stdin);print("OK" if d["success"] else d["errors"])'; }
banco() { c "$API/accounts/$ACC/d1/database?name=$BANCO" | python3 -c 'import json,sys;r=json.load(sys.stdin)["result"];print(r[0]["uuid"] if r else "")'; }
zona() { c "$API/zones?name=cyberjus.org" | python3 -c 'import json,sys;print(json.load(sys.stdin)["result"][0]["id"])'; }
segredo() {
  python3 -c 'import json,sys,os;print(json.dumps({"name":sys.argv[1],"text":os.environ[sys.argv[1]],"type":"secret_text"}))' "$1" |
    c -X PUT "$API/accounts/$ACC/workers/scripts/$NOME/secrets" -H 'content-type: application/json' --data-binary @- | ok
}

case "${1:-}" in
d1)
  [ -n "$(banco)" ] || c -X POST "$API/accounts/$ACC/d1/database" -H 'content-type: application/json' \
    -d "{\"name\":\"$BANCO\",\"primary_location_hint\":\"enam\"}" | ok
  SQL=$(python3 -c 'import json,sys;print(json.dumps({"sql":open(sys.argv[1]).read()}))' "$DIR/schema.sql")
  c -X POST "$API/accounts/$ACC/d1/database/$(banco)/query" -H 'content-type: application/json' -d "$SQL" | ok ;;
script)
  : "${ASAAS_BASE:?defina ASAAS_BASE (https://api.asaas.com/v3 ou https://api-sandbox.asaas.com/v3)}"
  META=$(python3 -c 'import json,sys;print(json.dumps({"main_module":"worker.js","compatibility_date":"2026-10-01",
    "observability":{"enabled":True,"head_sampling_rate":0.01},
    "keep_bindings":["secret_text"],
    "bindings":[{"type":"d1","name":"DB","id":sys.argv[1]},
                {"type":"plain_text","name":"ASAAS_BASE","text":sys.argv[2]},
                {"type":"ratelimit","name":"LIMITE","namespace_id":"5202","simple":{"limit":5,"period":60}}]}))' "$(banco)" "$ASAAS_BASE")
  c -X PUT "$API/accounts/$ACC/workers/scripts/$NOME" \
    -F "metadata=$META;type=application/json" \
    -F "worker.js=@$DIR/worker.js;type=application/javascript+module" | ok ;;
segredos)
  : "${ASAAS_KEY:?defina ASAAS_KEY}" "${WEBHOOK_TOKEN:?defina WEBHOOK_TOKEN}"
  segredo ASAAS_KEY
  segredo WEBHOOK_TOKEN ;;
webhook)
  : "${ASAAS_BASE:?}" "${ASAAS_KEY:?}" "${WEBHOOK_TOKEN:?}"
  python3 -c 'import json,os;print(json.dumps({"name":"CyberJustiça apoio","url":"https://www.cyberjus.org/api/apoio/webhook",
    "email":"contato@n3xus.dev","enabled":True,"interrupted":False,"apiVersion":3,"authToken":os.environ["WEBHOOK_TOKEN"],
    "sendType":"SEQUENTIALLY","events":["PAYMENT_CONFIRMED","PAYMENT_RECEIVED"]}))' |
    curl -sS -A 'cyberjus-apoio/1.0' -H "access_token: $ASAAS_KEY" -H 'content-type: application/json' \
      -X POST "$ASAAS_BASE/webhooks" --data-binary @- |
    python3 -c 'import json,sys;d=json.load(sys.stdin);print("OK", d["id"]) if "id" in d else print(d)' ;;
rota)
  c -X POST "$API/zones/$(zona)/workers/routes" -H 'content-type: application/json' \
    -d "{\"pattern\":\"$ROTA\",\"script\":\"$NOME\"}" | ok ;;
desfazer)
  Z=$(zona)
  for id in $(c "$API/zones/$Z/workers/routes" | python3 -c "import json,sys;[print(r['id']) for r in json.load(sys.stdin)['result'] if r.get('script')=='$NOME']"); do
    c -X DELETE "$API/zones/$Z/workers/routes/$id" | ok; done ;;
*) echo "uso: $0 d1|script|segredos|webhook|rota|desfazer" >&2; exit 2 ;;
esac
