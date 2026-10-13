import { expect, test } from '@playwright/test';
import { semRolagemLateral, vigiar } from './ajuda';

// O Chromium do Playwright não decodifica AAC; os testes verificam o comportamento do player
// (estado, persistência, controles), não o som. O som é conferido em navegador real.

test('ouvir abre o player e ele continua o mesmo ao navegar entre páginas', async ({ page }) => {
  const problemas = await vigiar(page);
  await page.goto('/');
  const player = page.locator('cj-player');
  await expect(player).toBeHidden();

  await page.locator('.hero [data-tocar]').click();
  await expect(player).toBeVisible();
  await expect(player.getByRole('link', { name: /fraudes digitais/i })).toBeVisible();
  await semRolagemLateral(page);

  // marca o <audio> atual: se a navegação recriasse o elemento, a marca sumiria
  await page.evaluate(() => {
    (document.querySelector('cj-player audio') as HTMLAudioElement & { marca?: string }).marca = 'mesmo';
  });
  await page.getByRole('link', { name: /Ver todos os \d+ episódios/ }).click();
  await expect(page).toHaveURL(/\/episodios\/$/);
  await expect(player).toBeVisible();
  const marca = await page.evaluate(() => (document.querySelector('cj-player audio') as HTMLAudioElement & { marca?: string }).marca);
  expect(marca).toBe('mesmo');
  await expect(page.locator('cj-player audio')).toHaveAttribute('src', '/audio/bfraudes-digitais.m4a');

  await player.getByRole('button', { name: 'Fechar player' }).click();
  await expect(player).toBeHidden();
  expect(problemas.filter((p) => !/audio|media|decode|NotSupported/i.test(p))).toEqual([]);
});

test('player publica título na Media Session (tela de bloqueio e teclas de mídia)', async ({ page }) => {
  await page.goto('/episodios/caso-lulu/');
  await page.locator('.ep-head [data-tocar]').click();
  const titulo = await page.evaluate(() => navigator.mediaSession?.metadata?.title ?? null);
  expect(titulo).toBe('Caso Lulu: uso indevido de dados pessoais');
});

test('controles do player têm nome acessível e alvo de toque >= 44px', async ({ page }) => {
  await page.goto('/episodios/namoral/');
  await page.locator('.ep-head [data-tocar]').click();
  const botoes = page.locator('cj-player button:visible');
  const n = await botoes.count();
  expect(n).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < n; i++) {
    const b = botoes.nth(i);
    await expect(b).toHaveAttribute('aria-label', /.+/);
    const caixa = await b.boundingBox();
    expect(caixa!.width, await b.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(44);
    expect(caixa!.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('cj-player input[aria-label="Posição no episódio"]')).toHaveAttribute('aria-valuetext', /de 7 minutos e 24 segundos$/);
});

test('velocidade avança e fica lembrada', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no celular o botão de velocidade fica escondido para caber o essencial');
  await page.goto('/episodios/namoral/');
  await page.locator('.ep-head [data-tocar]').click();
  const vel = page.locator('cj-player [data-acao="velocidade"]');
  await vel.click();
  await expect(vel).toHaveText('1.25x');
  expect(await page.evaluate(() => localStorage.getItem('cj:velocidade'))).toBe('1.25');
});

test('episódio sem áudio mostra botão desabilitado', async ({ page }) => {
  await page.goto('/episodios/lava-jato-digital/');
  await expect(page.locator('.ep-head').getByRole('button', { name: 'Áudio em breve' })).toBeDisabled();
});
