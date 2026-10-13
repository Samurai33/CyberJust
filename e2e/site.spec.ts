import { expect, test } from '@playwright/test';
import { PAGINAS, semRolagemLateral, vigiar } from './ajuda';

for (const caminho of PAGINAS) {
  test(`${caminho} abre sem erro, sem violação de CSP e sem rolagem lateral`, async ({ page }) => {
    const problemas = await vigiar(page);
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await semRolagemLateral(page);
    expect(problemas).toEqual([]);
  });
}

test('título, descrição, canonical e prévia de link em cada página', async ({ page }) => {
  for (const caminho of PAGINAS) {
    await page.goto(caminho);
    const titulo = await page.title();
    expect(titulo.length, titulo).toBeGreaterThanOrEqual(30);
    expect(titulo.length, titulo).toBeLessThanOrEqual(60);
    const desc = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
    expect(desc.length, desc).toBeLessThanOrEqual(155);
    // JSON-LD sempre válido (um único grafo)
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '');
    expect(ld['@graph'].length).toBeGreaterThan(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.cyberjus.org${caminho}`);
    const og = caminho.startsWith('/episodios/') && caminho !== '/episodios/' ? /^https:\/\/www\.cyberjus\.org\/og\/[a-z0-9-]+-[0-9a-f]{8}\.jpg$/ : /^https:\/\/www\.cyberjus\.org\/og-v1\.jpg$/;
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', og);
  }
});

test('página inexistente responde 404 com a página própria', async ({ page }) => {
  const resposta = await page.goto('/nao-existe/');
  expect(resposta?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página não existe.');
});

test('links do menu levam às seções da home a partir de outra página', async ({ page, isMobile }) => {
  await page.goto('/episodios/fraudes-digitais/');
  if (isMobile) await page.getByRole('button', { name: 'Abrir menu' }).or(page.locator('summary[aria-label="Abrir menu"]')).click();
  const menu = page.getByRole('navigation', { name: isMobile ? 'Principal (celular)' : 'Principal' });
  await menu.getByRole('link', { name: 'Proteção', exact: true }).click();
  await expect(page).toHaveURL(/\/#protecao$/);
  await expect(page.locator('#protecao')).toBeInViewport();
  if (isMobile) await expect(page.locator('details[data-menu]')).not.toHaveAttribute('open', '');
});

test('filtro de episódios funciona sem JavaScript', async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const page = await contexto.newPage();
  await page.goto('/episodios/');
  const linhas = page.locator('.ep-row');
  const total = await linhas.count();
  // Conta pelo atributo, não por número fixo: o pipeline publica episódios novos com áudio.
  const comAudio = await page.locator('.ep-row[data-audio]').count();
  expect(comAudio).toBeGreaterThan(0);
  expect(comAudio).toBeLessThan(total);
  await page.locator('label[for="f-audio"]').click();
  await expect(linhas.filter({ visible: true })).toHaveCount(comAudio);
  await page.locator('label[for="f-corrupcao"]').click();
  await expect(linhas.filter({ visible: true })).toHaveCount(2);
  await page.locator('label[for="f-todos"]').click();
  await expect(linhas.filter({ visible: true })).toHaveCount(total);
  await contexto.close();
});

test('conteúdo e navegação funcionam com JavaScript desligado', async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const page = await contexto.newPage();
  await page.goto('/');
  await page.getByRole('link', { name: /Ver todos os \d+ episódios/ }).click();
  await expect(page).toHaveURL(/\/episodios\/$/);
  await page.getByRole('link', { name: /Caso Lulu/ }).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Caso Lulu');
  await contexto.close();
});

test('especialista em destaque com foto carregada', async ({ page }) => {
  await page.goto('/#especialistas');
  const foto = page.locator('.host img');
  await foto.scrollIntoViewIfNeeded();
  await expect(page.locator('.host h3')).toContainText('Samurai');
  await expect.poll(() => foto.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test('episódio tem trilha de navegação, autoria e anterior/próximo', async ({ page }) => {
  await page.goto('/episodios/caso-lulu/');
  const trilha = page.getByRole('navigation', { name: 'Você está em' });
  await expect(trilha.getByRole('link', { name: 'Dados pessoais e privacidade' })).toHaveAttribute('href', '/temas/dados-pessoais/');
  await expect(page.locator('.byline a[rel="author"]')).toHaveText('Samurai');
  await expect(page.locator('.vizinhos a[rel="next"], .vizinhos a[rel="prev"]').first()).toBeVisible();
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '');
  const tipos = ld['@graph'].map((n: { '@type': string }) => n['@type']);
  expect(tipos).toEqual(expect.arrayContaining(['WebSite', 'PodcastEpisode', 'BreadcrumbList']));
});

test('três cliques no logo abrem o painel; um clique vai para a home', async ({ page, isMobile }) => {
  await page.goto('/episodios/');
  const logo = page.locator('.site-header .logo');
  await logo.click();
  // um clique: espera o timer de 350 ms e vai para a raiz (não basta terminar em "/")
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
  await page.goto('/episodios/');
  if (isMobile) {
    // tap() do Playwright espera estabilidade entre toques (>350 ms); dedo real é mais rápido
    for (let i = 0; i < 3; i++) await logo.dispatchEvent('click', { detail: i + 1, button: 0 });
  } else {
    await logo.click({ clickCount: 3 });
  }
  await expect(page).toHaveURL(/\/dash-[0-9a-f]+\/$/);
  // o Sveltia acrescenta o próprio meta noindex ao carregar: todos precisam dizer noindex
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
  expect(await page.locator('meta[name="robots"]').evaluateAll((ms) => ms.every((m) => (m as HTMLMetaElement).content.includes('noindex')))).toBe(true);
});

test('texto e links não grudam (espaço preservado na compressão do HTML)', async ({ page }) => {
  await page.goto('/fui-vitima/');
  await expect(page.locator('main')).toContainText('incluído pela Lei 14.155/2021');
  await page.goto('/privacidade/');
  await expect(page.locator('main')).toContainText('encarregado: privacidade@n3xus.dev');
});

test('clique simples no logo navega uma vez só e não interrompe o player', async ({ page }) => {
  await page.goto('/episodios/namoral/');
  await page.locator('.ep-head [data-tocar]').click();
  await page.evaluate(() => {
    (document.querySelector('cj-player audio') as HTMLAudioElement & { marca?: string }).marca = 'mesmo';
  });
  // marca no window: um recarregamento completo a apagaria (pushState do roteador não)
  await page.evaluate(() => ((window as Window & { semRecarga?: boolean }).semRecarga = true));
  await page.locator('.site-header .logo').click();
  await expect(page.locator('.hero')).toBeVisible();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as Window & { semRecarga?: boolean }).semRecarga), 'a página não recarregou').toBe(true);
  const marca = await page.evaluate(() => (document.querySelector('cj-player audio') as HTMLAudioElement & { marca?: string }).marca);
  expect(marca).toBe('mesmo');
});
