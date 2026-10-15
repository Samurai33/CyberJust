#!/bin/sh
# Publica o contador anônimo (Worker cyberjus-contador + D1) pela API da Cloudflare, sem wrangler/Node.
# Token de conta temporário em CF_TOKEN: Workers Scripts Edit + D1 Edit (conta) e Workers Routes Edit
# (zona cyberjus.org). Apague o token no painel depois.
#   CF_TOKEN=... sh worker/contador/publicar.sh d1        -> cria o banco (se não existir) e aplica schema.sql
#   CF_TOKEN=... sh worker/contador/publicar.sh script    -> sobe worker.js com os bindings DB e LIMITE
#   CF_TOKEN=... sh worker/contador/publicar.sh rota      -> www.cyberjus.org/api/contador -> Worker
#   CF_TOKEN=... sh worker/contador/publicar.sh desfazer  -> apaga a rota (o site volta a mostrar a frase sem número)
set -eu
ACC=35f8be2ffd8ab7bde84c9379dd89dbda
NOME=cyberjus-contador
BANCO=cyberjus-contador
ROTA=www.cyberjus.org/api/contador
DIR=$(dirname "$0")
API=https://api.cloudflare.com/client/v4
: "${CF_TOKEN:?defina CF_TOKEN}"
c() { curl -sS -A 'n3xus-publicar/1' -H "Authorization: Bearer $CF_TOKEN" "$@"; }
ok() { python3 -c 'import json,sys;d=json.load(sys.stdin);print("OK" if d["success"] else d["errors"])'; }
banco() { c "$API/accounts/$ACC/d1/database?name=$BANCO" | python3 -c 'import json,sys;r=json.load(sys.stdin)["result"];print(r[0]["uuid"] if r else "")'; }
zona() { c "$API/zones?name=cyberjus.org" | python3 -c 'import json,sys;print(json.load(sys.stdin)["result"][0]["id"])'; }

case "$1" in
d1)
  [ -n "$(banco)" ] || c -X POST "$API/accounts/$ACC/d1/database" -H 'content-type: application/json' \
    -d "{\"name\":\"$BANCO\",\"primary_location_hint\":\"enam\"}" | ok
  SQL=$(python3 -c 'import json,sys;print(json.dumps({"sql":open(sys.argv[1]).read()}))' "$DIR/schema.sql")
  c -X POST "$API/accounts/$ACC/d1/database/$(banco)/query" -H 'content-type: application/json' -d "$SQL" | ok ;;
script)
  META=$(python3 -c 'import json,sys;print(json.dumps({"main_module":"worker.js","compatibility_date":"2026-10-01",
    "observability":{"enabled":True,"head_sampling_rate":0.01},
    "bindings":[{"type":"d1","name":"DB","id":sys.argv[1]},
                {"type":"ratelimit","name":"LIMITE","namespace_id":"5201","simple":{"limit":5,"period":60}}]}))' "$(banco)")
  c -X PUT "$API/accounts/$ACC/workers/scripts/$NOME" \
    -F "metadata=$META;type=application/json" \
    -F "worker.js=@$DIR/worker.js;type=application/javascript+module" | ok ;;
rota)
  c -X POST "$API/zones/$(zona)/workers/routes" -H 'content-type: application/json' \
    -d "{\"pattern\":\"$ROTA\",\"script\":\"$NOME\"}" | ok ;;
desfazer)
  Z=$(zona)
  for id in $(c "$API/zones/$Z/workers/routes" | python3 -c "import json,sys;[print(r['id']) for r in json.load(sys.stdin)['result'] if r.get('script')=='$NOME']"); do
    c -X DELETE "$API/zones/$Z/workers/routes/$id" | ok; done ;;
*) echo "uso: $0 d1|script|rota|desfazer" >&2; exit 2 ;;
esac
