// Espelho de emergência no Cloudflare Pages: gera dist/_headers e dist/_redirects A PARTIR do docker/nginx.conf
// e dos snippets de headers, que continuam sendo a fonte única. Mudou o CSP, um header ou um 301 no nginx,
// o espelho acompanha no próximo build. Uso: node scripts/espelho-pages.mjs (depois do `pnpm build`).
//
// Quando a VM 520 ou o túnel caem, o Worker n3xus-manutencao (repositório n3xus-site) serve este espelho
// no próprio www.cyberjus.org. O painel (/dash-*/) NÃO vai para o espelho: no cyberjus.org ele fica atrás
// do Cloudflare Access; no endereço *.pages.dev ficaria exposto.
import { readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));

/** Linhas `add_header Nome "valor" always;` de um trecho do nginx, na ordem. */
export function lerHeaders(texto) {
  const out = [];
  for (const m of texto.matchAll(/^\s*add_header\s+(\S+)\s+"([^"]*)"\s+always;/gm)) out.push([m[1], m[2]]);
  return out;
}

/** Expande `^/(a|b)/(1|2)/?$` em todos os caminhos possíveis (com e sem barra no fim). */
export function expandirRegex(re) {
  const corpo = re.replace(/^\^/, '').replace(/\$$/, '');
  const barraOpcional = corpo.endsWith('/?');
  const base = barraOpcional ? corpo.slice(0, -2) : corpo;
  if (/[\\[\]*+.{}]|\?/.test(base.replace(/\([^()]*\)/g, ''))) throw new Error(`regex não suportada no espelho: ${re}`);
  let caminhos = [''];
  for (const parte of base.split(/(\([^()]*\))/).filter(Boolean)) {
    const opcoes = parte.startsWith('(') ? parte.slice(1, -1).split('|') : [parte];
    if (opcoes.some((o) => /[^A-Za-z0-9/_-]/.test(o))) throw new Error(`regex não suportada no espelho: ${re}`);
    caminhos = caminhos.flatMap((c) => opcoes.map((o) => c + o));
  }
  return barraOpcional ? caminhos.flatMap((c) => [c, `${c}/`]) : caminhos;
}

/** Os 301 do nginx (location exato e location por regex) no formato do _redirects do Pages. */
export function gerarRedirects(conf) {
  const linhas = [];
  for (const m of conf.matchAll(/^\s*location\s+=\s+(\S+)\s*\{\s*return\s+301\s+([^;\s]+);\s*\}/gm)) {
    linhas.push(`${m[1]} ${m[2]} 301`);
  }
  for (const m of conf.matchAll(/^\s*location\s+~\s+(\S+)\s*\{\s*return\s+301\s+([^;\s]+);\s*\}/gm)) {
    for (const c of expandirRegex(m[1])) linhas.push(`${c} ${m[2]} 301`);
  }
  return [...new Set(linhas)];
}

/** Bloco do nginx cujo `location` começa por <padrão> (até a chave que fecha), ou erro se não existir. */
function bloco(conf, padrao) {
  const i = conf.indexOf(`location ${padrao}`);
  if (i < 0) throw new Error(`location ${padrao} não encontrado no nginx.conf`);
  return conf.slice(i, conf.indexOf('\n    }', i));
}

/** Valor de `add_header Nome "valor"` dentro de um bloco. */
function valor(texto, nome) {
  const v = lerHeaders(texto).find(([n]) => n === nome)?.[1];
  if (v === undefined) throw new Error(`${nome} não encontrado em: ${texto.split('\n')[0]}`);
  return v;
}

/** Tipo de `types { tipo ext; }` dentro de um bloco. */
function tipo(texto) {
  const m = texto.match(/types\s*\{\s*"?([^"\s]+)"?\s+\w+;\s*\}/);
  if (!m) throw new Error(`types não encontrado em: ${texto.split('\n')[0]}`);
  return m[1];
}

export function gerarHeaders(conf, comuns, publicos) {
  const csp = conf.match(/^\s*set \$csp "([^"]*)";/m)?.[1];
  if (!csp) throw new Error('CSP não encontrado no nginx.conf');
  const fmt = (pares) => pares.map(([n, v]) => `  ${n}: ${v}`);
  // Herdados de /* que não existem (ou mudam de valor) no snippet público: esses saem.
  const tirar = comuns.filter(([n, v]) => !publicos.some(([pn, pv]) => pn === n && pv === v)).map(([n]) => n);
  const iguais = new Set(comuns.map(([n, v]) => `${n}\0${v}`));
  // Arquivos para outros sites (áudio, feed, prévias): o nginx manda só security-headers-public.conf, sem CSP.
  // No Pages a regra /* vale para tudo; "! Nome" tira o herdado (repetido, o Pages junta com vírgula).
  const publico = (cache, extra = []) => [
    ...[...tirar, 'Content-Security-Policy', 'Cache-Control'].map((n) => `  ! ${n}`),
    ...fmt(publicos.filter(([n, v]) => !iguais.has(`${n}\0${v}`))),
    ...fmt(extra),
    `  Cache-Control: ${cache}`,
  ];

  const audio = bloco(conf, '/audio/');
  const vtt = bloco(conf, '/transcricoes/');
  const cap = bloco(conf, '~ ^/episodios/[a-z0-9-]+/capitulos\\.json$');
  const feed = bloco(conf, '= /podcast.xml');
  const prev = bloco(conf, '~* ^/(og-');
  const manifest = bloco(conf, '= /site.webmanifest');
  const astro = bloco(conf, '/_astro/');
  const cachePrev = valor(prev, 'Cache-Control');

  const regras = [
    // O Pages põe Access-Control-Allow-Origin: * em tudo; o nginx só manda nos arquivos para outros sites.
    ['/*', ['  ! Access-Control-Allow-Origin', ...fmt(comuns), `  Content-Security-Policy: ${csp}`, '  Cache-Control: no-cache']],
    ['/_astro/*', ['  ! Cache-Control', `  Cache-Control: ${valor(astro, 'Cache-Control')}`]],
    ['/audio/*', publico(valor(audio, 'Cache-Control'), [['Access-Control-Allow-Origin', '*'], ['Content-Type', tipo(audio)]])],
    ['/transcricoes/*', publico(valor(vtt, 'Cache-Control'), [['Access-Control-Allow-Origin', '*'], ['Content-Type', `${tipo(vtt)}; charset=utf-8`]])],
    ['/episodios/:slug/capitulos.json', publico(valor(cap, 'Cache-Control'), [['Access-Control-Allow-Origin', '*'], ['Content-Type', tipo(cap)]])],
    ['/podcast.xml', publico(valor(feed, 'Cache-Control'), [['Access-Control-Allow-Origin', '*'], ['Content-Type', `${tipo(feed)}; charset=utf-8`]])],
    // Mesmos arquivos do location das prévias e ícones (o Pages não tem regex; um splat por grupo).
    ...['/og-*', '/og/*', '/capa-podcast-*', '/favicon.ico', '/favicon-32x32.png', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'].map(
      (r) => [r, publico(cachePrev)],
    ),
    ['/site.webmanifest', ['  ! Cache-Control', '  ! Content-Type', `  Content-Type: ${tipo(manifest)}`, `  Cache-Control: ${valor(manifest, 'Cache-Control')}`]],
    ['/.well-known/security.txt', ['  ! Content-Type', '  Content-Type: text/plain; charset=utf-8']],
    // Endereços próprios do espelho fora do Google (cópia do site). O www.cyberjus.org servido pelo espelho
    // num incidente continua indexável: o Worker tira este header.
    ['https://:project.pages.dev/*', ['  X-Robots-Tag: noindex']],
    ['https://:version.:project.pages.dev/*', ['  X-Robots-Tag: noindex']],
  ];
  return regras.map(([r, l]) => [r, ...l].join('\n')).join('\n\n');
}

function principal() {
  const dist = `${raiz}dist`;
  if (!existsSync(`${dist}/index.html`)) throw new Error('dist/ vazio: rode `pnpm build` antes');
  for (const d of readdirSync(dist).filter((d) => d.startsWith('dash-'))) rmSync(`${dist}/${d}`, { recursive: true });

  const conf = readFileSync(`${raiz}docker/nginx.conf`, 'utf8');
  const comuns = lerHeaders(readFileSync(`${raiz}docker/security-headers.conf`, 'utf8'));
  const publicos = lerHeaders(readFileSync(`${raiz}docker/security-headers-public.conf`, 'utf8'));
  const aviso = '# Gerado por scripts/espelho-pages.mjs a partir de docker/nginx.conf. Não editar.\n';
  const redirects = gerarRedirects(conf);
  writeFileSync(`${dist}/_redirects`, `${aviso}${redirects.join('\n')}\n`);
  writeFileSync(`${dist}/_headers`, `${aviso}${gerarHeaders(conf, comuns, publicos)}\n`);
  console.log(`espelho: ${redirects.length} redirects, _headers gerado, painel removido`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) principal();
