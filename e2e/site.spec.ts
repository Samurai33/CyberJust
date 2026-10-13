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
    expect(titulo.length, titulo).toBeLessThanOrEqual(60);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.cyberjus.org${caminho}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://www.cyberjus.org/og-v1.jpg');
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
  await menu.getByRole('link', { name: 'Proteção' }).click();
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
  await page.locator('label[for="f-audio"]').click();
  await expect(linhas.filter({ visible: true })).toHaveCount(3);
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
  await expect(page.locator('.host h3')).toContainText('Thiago Rangel');
  await expect.poll(() => foto.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});
