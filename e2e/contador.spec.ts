import { expect, test, type Page } from '@playwright/test';
import { vigiar } from './ajuda';

// Contador anônimo da home (Contador.astro + src/scripts/contador.ts). No contêiner local o nginx responde
// "indisponível" em /api/contador (em produção quem responde é o Worker); os casos com número simulam a
// resposta do Worker com page.route.

const FRASE_SEM_NUMERO = 'Informe-se aqui para não cair em golpe digital.';
const titulo = (page: Page) => page.getByRole('heading', { level: 2, name: /golpe digital/ }).first();

/** Responde como o Worker e guarda os métodos pedidos. */
async function worker(page: Page, total: number) {
  const metodos: string[] = [];
  await page.route('**/api/contador', async (rota) => {
    metodos.push(rota.request().method());
    await rota.fulfill({ json: { total: total + (rota.request().method() === 'POST' ? 1 : 0), desde: '2026-10-15' } });
  });
  return metodos;
}

/** O Playwright marca navigator.webdriver (e o site não conta robôs); aqui simulamos uma pessoa. */
async function comoPessoa(page: Page, extra: { gpc?: boolean } = {}) {
  await page.addInitScript((gpc) => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
    if (gpc) Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true });
  }, extra.gpc ?? false);
}

test('sem o Worker: frase sem número, sem erro no console e sem violação de CSP', async ({ page }) => {
  const problemas = await vigiar(page);
  const resposta = page.waitForResponse('**/api/contador');
  await page.goto('/');
  expect((await resposta).status()).toBe(200);
  await expect(titulo(page)).toHaveText(FRASE_SEM_NUMERO);
  await expect(page.locator('[data-contador-desde]')).toHaveText('Sem cookies, sem rastreio');
  await expect(page.locator('.contador-num')).toHaveCount(0);
  expect(problemas).toEqual([]);
});

test('com o número real: frase, data de início, região aria-live e sem violação de CSP', async ({ page }) => {
  const problemas = await vigiar(page);
  await worker(page, 12480);
  await page.goto('/');
  // O nome acessível do título é a frase final; a parte animada fica fora da árvore de acessibilidade.
  await expect(titulo(page)).toHaveAccessibleName('12.480 pessoas já se informaram aqui para não cair em golpe digital.');
  await expect(page.locator('[data-contador-anuncio]')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('[data-contador-frase]')).toHaveAttribute('aria-hidden', 'true');
  await page.locator('[data-contador]').scrollIntoViewIfNeeded();
  await expect(page.locator('.contador-num')).toHaveText('12.480');
  await expect(page.locator('[data-contador-desde]')).toHaveText('Contagem anônima desde 15/10/2026');
  await expect(page.locator('[data-contador]').getByRole('button', { name: /^Ouvir/ })).toBeVisible();
  await expect(page.locator('[data-contador]').getByRole('link', { name: 'Como contamos' })).toHaveAttribute('href', '/privacidade/#contador');
  expect(problemas).toEqual([]);
});

test('abaixo de 100 pessoas o número não aparece (prova social baixa trabalha contra)', async ({ page }) => {
  await worker(page, 42);
  const resposta = page.waitForResponse('**/api/contador');
  await page.goto('/');
  await resposta;
  await expect(titulo(page)).toHaveText(FRASE_SEM_NUMERO);
  await expect(page.locator('.contador-num')).toHaveCount(0);
});

test('resposta inválida do contador não quebra a página', async ({ page }) => {
  const problemas = await vigiar(page);
  await page.route('**/api/contador', (rota) => rota.fulfill({ json: { total: '9999', desde: 1 } }));
  await page.goto('/');
  await expect(titulo(page)).toHaveText(FRASE_SEM_NUMERO);
  expect(problemas).toEqual([]);
});

test('conta uma vez por navegador: POST na primeira visita, GET depois, sem cookie', async ({ page, context }) => {
  await comoPessoa(page);
  const metodos = await worker(page, 500);
  await page.goto('/');
  await expect(titulo(page)).toHaveAccessibleName(/^501 pessoas/);
  expect(metodos).toEqual(['POST']);
  expect(await page.evaluate(() => localStorage.getItem('cj-contado'))).toBe('1');
  await page.reload();
  await expect(titulo(page)).toHaveAccessibleName(/^500 pessoas/);
  expect(metodos).toEqual(['POST', 'GET']);
  expect(await context.cookies()).toEqual([]);
});

test('Global Privacy Control e robôs de automação não entram na conta', async ({ browser }) => {
  for (const gpc of [true, false]) {
    const contexto = await browser.newContext();
    const page = await contexto.newPage();
    if (gpc) await comoPessoa(page, { gpc }); // sem comoPessoa, o navigator.webdriver do Playwright vale
    const metodos = await worker(page, 500);
    await page.goto('/');
    await expect(titulo(page)).toHaveAccessibleName(/^500 pessoas/);
    expect(metodos).toEqual(['GET']);
    await contexto.close();
  }
});

test('trocar de página não pede o contador de novo nem recria a frase', async ({ page }) => {
  const metodos = await worker(page, 12480);
  await page.goto('/sobre/');
  await expect.poll(() => metodos.length).toBe(1);
  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(titulo(page)).toHaveAccessibleName(/^12\.480 pessoas/);
  expect(metodos).toEqual(['GET']);
});

test('com movimento reduzido o número aparece pronto, sem contagem animada', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await worker(page, 12480);
  await page.goto('/');
  await expect(page.locator('[data-contador-anuncio]')).not.toBeEmpty();
  // No mesmo instante em que a frase é trocada, o número já é o final.
  expect(await page.locator('.contador-num').textContent()).toBe('12.480');
});
