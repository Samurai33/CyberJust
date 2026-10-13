import { expect, type Page } from '@playwright/test';

export const PAGINAS = [
  '/',
  '/episodios/',
  '/episodios/fraudes-digitais/',
  '/episodios/protecao-de-criancas/',
  '/temas/',
  '/temas/fraudes/',
  '/fui-vitima/',
  '/sobre/',
  '/acessibilidade/',
  '/privacidade/',
];

/** Registra violações de CSP e erros de JavaScript da página (devem ser sempre zero). */
export async function vigiar(page: Page): Promise<string[]> {
  const problemas: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`CSP bloqueou ${e.violatedDirective}: ${e.blockedURI}`);
    });
  });
  page.on('console', (m) => {
    if (m.type() === 'error') problemas.push(m.text());
  });
  page.on('pageerror', (e) => problemas.push(e.message));
  return problemas;
}

/** Nada pode vazar para os lados (rolagem horizontal) em nenhuma largura de tela. */
export async function semRolagemLateral(page: Page): Promise<void> {
  const { largura, conteudo } = await page.evaluate(() => ({
    largura: document.documentElement.clientWidth,
    conteudo: document.documentElement.scrollWidth,
  }));
  expect(conteudo, 'conteúdo mais largo que a tela').toBeLessThanOrEqual(largura);
}
