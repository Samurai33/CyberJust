import { expect, test } from '@playwright/test';

// Comportamento do nginx de produção. Não depende do navegador: roda só no projeto chromium.
test.beforeEach(({}, info) => test.skip(info.project.name !== 'chromium', 'teste de servidor, um navegador basta'));

test('headers de segurança no HTML', async ({ request }) => {
  const r = await request.get('/');
  const h = r.headers();
  expect(h['content-security-policy']).toContain("script-src 'self'");
  expect(h['content-security-policy']).not.toContain('unsafe-inline');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['strict-transport-security']).toContain('max-age=31536000');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['cross-origin-opener-policy']).toBe('same-origin');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=()');
  expect(h['server']).toBe('nginx');
});

test('áudio: streaming por Range, tipo correto e cache imutável', async ({ request }) => {
  const r = await request.get('/audio/bfraudes-digitais.m4a', { headers: { Range: 'bytes=0-15' } });
  expect(r.status()).toBe(206);
  expect(r.headers()['content-type']).toBe('audio/mp4');
  expect(r.headers()['content-range']).toBe('bytes 0-15/12535498');
  expect(r.headers()['cache-control']).toContain('immutable');
  // MP4 com moov no início (faststart): o segundo átomo é "moov", senão o streaming quebra.
  const inicio = await request.get('/audio/bfraudes-digitais.m4a', { headers: { Range: 'bytes=0-63' } });
  const b = await inicio.body();
  const tamanhoFtyp = b.readUInt32BE(0);
  expect(b.subarray(4, 8).toString()).toBe('ftyp');
  const r2 = await request.get('/audio/bfraudes-digitais.m4a', { headers: { Range: `bytes=${tamanhoFtyp}-${tamanhoFtyp + 7}` } });
  expect((await r2.body()).subarray(4, 8).toString()).toBe('moov');
});

test('imagem de prévia com CORP cross-origin (WhatsApp Web)', async ({ request }) => {
  const r = await request.get('/og-v1.jpg');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-type']).toBe('image/jpeg');
  expect(r.headers()['cross-origin-resource-policy']).toBe('cross-origin');
});

const ANTIGOS: [string, string][] = [
  ['/episodes', '/episodios/'],
  ['/episodes/7', '/episodios/fraudes-digitais/'],
  ['/episodes/6', '/episodios/caso-lulu/'],
  ['/episodes/5', '/episodios/namoral/'],
  ['/episodes/13', '/episodios/fraude-e-estelionato/'],
  ['/episodes/ESPECIAL', '/episodios/protecao-de-criancas/'],
  ['/episodes/3', '/episodios/lava-jato-digital/'],
  ['/episodios/7', '/episodios/fraudes-digitais/'],
  ['/episodio/6', '/episodios/caso-lulu/'],
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

test('sitemap, robots e security.txt', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const sm = await request.get('/sitemap-0.xml');
  const xml = await sm.text();
  expect(xml).toContain('https://www.cyberjus.org/episodios/caso-lulu/');
  expect(xml).not.toContain('/404');
  expect((await request.get('/.well-known/security.txt')).headers()['content-type']).toContain('text/plain');
});
