// Áudio dos episódios no R2: www.cyberjus.org/audio/* (rota mais específica que a do n3xus-manutencao, então
// só este Worker atende esse caminho). O site, o espelho do Pages e os apps de podcast usam a mesma origem,
// e a URL do feed não mudou quando o áudio saiu do Git.
//
//   GET/HEAD -> o arquivo, com Range (206) nativo, ETag/If-None-Match e cache imutável
//   PUT      -> envio pelo pipeline (Bearer ENVIO). O nome leva os 8 primeiros hex do SHA-256 do conteúdo
//               (o mesmo do podcast/pipeline/episodio.py), então um arquivo publicado nunca muda: reenviar o
//               mesmo é idempotente, conteúdo diferente com o mesmo nome é recusado.
//               Devolve { caminho, bytes, segundos } para o src/data/audio.json.
import { infoMp4 } from './mp4.js';

const NOME = /^\/audio\/([a-z0-9-]+)-([0-9a-f]{8})\.m4a$/;
const MAXIMO = 95 * 1024 * 1024; // abaixo do limite de corpo de 100 MB da Cloudflare
const IMUTAVEL = 'public, max-age=31536000, immutable';

// Os mesmos do location /audio/ do docker/nginx.conf (security-headers-public.conf + CORS).
const PUBLICOS = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'cross-origin-resource-policy': 'cross-origin',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
};

const resposta = (status, corpo, extra = {}) =>
  new Response(corpo === null ? null : JSON.stringify(corpo), {
    status,
    headers: { ...PUBLICOS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function autorizado(request, env) {
  const enviado = new TextEncoder().encode(request.headers.get('authorization') ?? '');
  const esperado = new TextEncoder().encode(`Bearer ${env.ENVIO ?? ''}`);
  if (!env.ENVIO || enviado.byteLength !== esperado.byteLength) return false;
  // tempo constante (o crypto.subtle.timingSafeEqual só existe no runtime da Cloudflare, não no vitest)
  let dif = 0;
  for (let i = 0; i < esperado.byteLength; i++) dif |= enviado[i] ^ esperado[i];
  return dif === 0;
}

async function servir(request, env, chave) {
  let obj;
  try {
    obj = await env.AUDIO.get(chave, { range: request.headers, onlyIf: request.headers });
  } catch (e) {
    // Range fora do arquivo ou malformado: o R2 recusa; devolve 416 como o nginx.
    const meta = request.headers.has('range') ? await env.AUDIO.head(chave) : null;
    if (!meta) throw e;
    return resposta(416, null, { 'content-range': `bytes */${meta.size}` });
  }
  if (obj === null) return resposta(404, { erro: 'não encontrado' }, { 'cache-control': 'public, max-age=60' });
  const h = new Headers(PUBLICOS);
  obj.writeHttpMetadata(h);
  h.set('content-type', 'audio/mp4');
  h.set('cache-control', IMUTAVEL);
  h.set('etag', obj.httpEtag);
  h.set('accept-ranges', 'bytes');
  // Sem corpo = If-None-Match/If-Modified-Since bateu.
  if (!('body' in obj)) return new Response(null, { status: 304, headers: h });

  let status = 200;
  let tamanho = obj.size;
  if (obj.range && request.headers.has('range')) {
    const r = obj.range;
    const inicio = 'suffix' in r ? obj.size - r.suffix : r.offset ?? 0;
    tamanho = 'suffix' in r ? r.suffix : r.length ?? obj.size - inicio;
    h.set('content-range', `bytes ${inicio}-${inicio + tamanho - 1}/${obj.size}`);
    status = 206;
  }
  h.set('content-length', String(tamanho));
  return new Response(request.method === 'HEAD' ? null : obj.body, { status, headers: h });
}

async function receber(request, env, chave, m) {
  if (!(await autorizado(request, env))) return resposta(401, { erro: 'sem autorização' });
  const declarado = Number(request.headers.get('content-length') ?? NaN);
  if (!(declarado > 0) || declarado > MAXIMO) return resposta(413, { erro: `tamanho inválido (máximo ${MAXIMO} bytes)` });
  const bytes = new Uint8Array(await request.arrayBuffer());
  const sha = hex(await crypto.subtle.digest('SHA-256', bytes));
  if (!sha.startsWith(m[2])) return resposta(422, { erro: `o nome termina em ${m[2]}, mas o SHA-256 do arquivo começa com ${sha.slice(0, 8)}` });
  let info;
  try {
    info = infoMp4(bytes);
  } catch (e) {
    return resposta(422, { erro: e.message });
  }
  const corpo = { caminho: `/${chave}`, ...info };
  const existe = await env.AUDIO.head(chave);
  if (existe) {
    if (existe.customMetadata?.sha256 === sha) return resposta(200, corpo);
    return resposta(409, { erro: 'já existe um arquivo diferente com esse nome' });
  }
  await env.AUDIO.put(chave, bytes, {
    sha256: sha,
    httpMetadata: { contentType: 'audio/mp4', cacheControl: IMUTAVEL },
    customMetadata: { sha256: sha, segundos: String(info.segundos) },
  });
  return resposta(201, corpo);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = NOME.exec(url.pathname);
    if (!m) return resposta(404, { erro: 'não encontrado' });
    const chave = url.pathname.slice(1);
    try {
      switch (request.method) {
        case 'GET':
        case 'HEAD':
          return await servir(request, env, chave);
        case 'PUT':
          return await receber(request, env, chave, m);
        case 'OPTIONS':
          return new Response(null, {
            status: 204,
            headers: {
              ...PUBLICOS,
              'access-control-allow-methods': 'GET, HEAD',
              'access-control-allow-headers': 'Range, If-None-Match',
              'access-control-max-age': '86400',
            },
          });
        default:
          return resposta(405, { erro: 'método não permitido' }, { allow: 'GET, HEAD, OPTIONS, PUT' });
      }
    } catch {
      return resposta(503, { erro: 'indisponível' });
    }
  },
};
