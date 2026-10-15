import { expect, test } from '@playwright/test';
import { DASH_PATH } from '../src/data/dash';
import { EPISODIO } from './ajuda';

// Comportamento do nginx de produção. Não depende do navegador: roda só no projeto chromium.
test.beforeEach(({}, info) => test.skip(info.project.name !== 'chromium', 'teste de servidor, um navegador basta'));

test('headers de segurança no HTML', async ({ request }) => {
  const r = await request.get('/');
  const h = r.headers();
  expect(h['content-security-policy']).toContain("script-src 'self'");
  expect(h['content-security-policy']).not.toContain('unsafe-inline');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['strict-transport-security']).toContain('max-age=63072000');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['cross-origin-opener-policy']).toBe('same-origin');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=()');
  // direto no contêiner: nginx (sem versão); em produção, atrás da Cloudflare: cloudflare
  expect(['nginx', 'cloudflare']).toContain(h['server']);
});

test('/api/contador sem o Worker: "indisponível" em JSON, sem cache e com os headers de segurança', async ({ request }) => {
  for (const method of ['GET', 'POST'] as const) {
    const r = await request.fetch('/api/contador', { method });
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('application/json');
    expect(r.headers()['cache-control']).toBe('no-store');
    expect(r.headers()['x-content-type-options']).toBe('nosniff');
    expect(await r.json()).toEqual({ indisponivel: true });
  }
});

test('áudio: streaming por Range, tipo correto e cache imutável', async ({ request }) => {
  // o nome do arquivo leva um hash e muda quando o áudio é refeito: lê da página do episódio
  const audio = (await (await request.get(EPISODIO)).text()).match(/data-src="(\/audio\/[^"]+\.m4a)"/)![1]!;
  const r = await request.get(audio, { headers: { Range: 'bytes=0-15' } });
  expect(r.status()).toBe(206);
  expect(r.headers()['content-type']).toBe('audio/mp4');
  expect(r.headers()['content-range']).toMatch(/^bytes 0-15\/\d+$/);
  expect(r.headers()['cache-control']).toContain('immutable');
  // apps e players web de podcast tocam o áudio de outra origem
  expect(r.headers()['cross-origin-resource-policy']).toBe('cross-origin');
  // MP4 com moov no início (faststart): o segundo átomo é "moov", senão o streaming quebra.
  const inicio = await request.get(audio, { headers: { Range: 'bytes=0-63' } });
  const b = await inicio.body();
  const tamanhoFtyp = b.readUInt32BE(0);
  expect(b.subarray(4, 8).toString()).toBe('ftyp');
  const r2 = await request.get(audio, { headers: { Range: `bytes=${tamanhoFtyp}-${tamanhoFtyp + 7}` } });
  expect((await r2.body()).subarray(4, 8).toString()).toBe('moov');
});

test('imagem de prévia com CORP cross-origin (WhatsApp Web)', async ({ request }) => {
  const r = await request.get('/og-v2.jpg');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toBe('image/jpeg');
  expect(r.headers()['cross-origin-resource-policy']).toBe('cross-origin');
});

const ANTIGOS: [string, string][] = [
  ['/episodes', '/episodios/'],
  ['/episodes/7', '/episodios/'],
  ['/episodes/6', '/episodios/'],
  ['/episodes/ESPECIAL', '/episodios/'],
  ['/episodios/7', '/episodios/'],
  ['/episodio/6', '/episodios/'],
  // episódios removidos em 14/10/2026: o link compartilhado cai na lista, não num 404
  ['/episodios/caso-lulu/', '/episodios/'],
  ['/episodios/namoral', '/episodios/'],
  ['/episodios/fraudes-digitais/', '/episodios/'],
  ['/episodios', '/episodios/'],
];
for (const [de, para] of ANTIGOS) {
  test(`redirect 301 ${de} → ${para}`, async ({ request }) => {
    const r = await request.get(de, { maxRedirects: 0 });
    expect(r.status()).toBe(301);
    expect(r.headers()['location']).toBe(para);
  });
}

test('domínio sem www vai para o www com 301', async ({ request }) => {
  const r = await request.get('/episodios/?x=1', { headers: { Host: 'cyberjus.org' }, maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expect(r.headers()['location']).toBe('https://www.cyberjus.org/episodios/?x=1');
});

test('nenhum link interno das páginas principais leva a erro', async ({ request }) => {
  const vistos = new Set<string>();
  for (const pagina of ['/', '/episodios/', '/temas/', EPISODIO, '/fui-vitima/', '/sobre/']) {
    const html = await (await request.get(pagina)).text();
    for (const [, href] of html.matchAll(/href="(\/(?!\/)[^"#?]*)"/g)) vistos.add(href!);
  }
  for (const href of vistos) {
    const r = await request.get(href, { maxRedirects: 0 });
    expect(r.status(), href).toBeLessThan(400);
  }
});

test('sitemap, robots e security.txt', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const sm = await request.get('/sitemap-0.xml');
  const xml = await sm.text();
  expect(xml).toContain(`https://www.cyberjus.org${EPISODIO}`);
  expect(xml).not.toContain('/episodios/caso-lulu/');
  expect(xml).not.toContain('/404');
  expect((await request.get('/.well-known/security.txt')).headers()['content-type']).toContain('text/plain');
});

test('painel: noindex, sem cache, CSP própria e fora do sitemap e do robots', async ({ request }) => {
  expect(await (await request.get('/sitemap-0.xml')).text()).not.toContain('/dash-');
  expect(await (await request.get('/robots.txt')).text()).not.toContain('dash');
  const r = await request.get(DASH_PATH);
  expect(r.status()).toBe(200);
  expect(r.headers()['x-robots-tag']).toContain('noindex');
  expect(r.headers()['cache-control']).toBe('no-store');
  expect(r.headers()['content-security-policy']).toContain('connect-src');
  expect(r.headers()['content-security-policy']).toContain('https://api.github.com');
});

test('feed do podcast válido para Apple e Podcasting 2.0', async ({ request }) => {
  const r = await request.get('/podcast.xml');
  expect(r.headers()['content-type']).toContain('application/rss+xml');
  const xml = await r.text();
  expect(xml).toContain('<itunes:image href="https://www.cyberjus.org/capa-podcast-v1.jpg" />');
  expect(xml).toMatch(/<podcast:guid>[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}<\/podcast:guid>/);
  expect(xml).toContain('<itunes:email>contato@n3xus.dev</itunes:email>');
  const itens = [...xml.matchAll(/<enclosure url="([^"]+)" length="(\d+)" type="audio\/x-m4a" \/>/g)];
  // Todo <item> do feed tem áudio (podcast.xml.ts só publica episódio com áudio e data).
  expect(itens.length).toBeGreaterThan(0);
  expect(itens.length).toBe((xml.match(/<item>/g) ?? []).length);
  for (const [, url, tam] of itens) {
    const a = await request.head(url!.replace('https://www.cyberjus.org', ''));
    expect(a.status()).toBe(200);
    expect(a.headers()['content-length']).toBe(tam);
  }
  const capa = await request.get('/capa-podcast-v1.jpg');
  expect(capa.headers()['content-type']).toBe('image/jpeg');
  expect(capa.headers()['cross-origin-resource-policy']).toBe('cross-origin');
});

test('prévia de link própria por episódio (JPEG 1200x630, CORP cross-origin)', async ({ request }) => {
  const html = await (await request.get(EPISODIO)).text();
  const og = html.match(/<meta property="og:image" content="https:\/\/www\.cyberjus\.org(\/og\/[^"]+)"/)?.[1];
  expect(og).toBeTruthy();
  const r = await request.get(og!);
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toBe('image/jpeg');
  expect(r.headers()['cross-origin-resource-policy']).toBe('cross-origin');
  const b = await r.body();
  // dimensões no marcador SOF do JPEG
  let i = 2;
  while (i < b.length && !(b[i] === 0xff && (b[i + 1] === 0xc0 || b[i + 1] === 0xc2))) i += 2 + b.readUInt16BE(i + 2);
  expect([b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]).toEqual([1200, 630]);
});
