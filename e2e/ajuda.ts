import { expect, type Page } from '@playwright/test';

// Episódio de referência dos testes (o nome da página não muda quando o áudio é refeito).
export const EPISODIO = '/episodios/falso-advogado-ceara/';

export const PAGINAS = [
  '/',
  '/episodios/',
  EPISODIO,
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
