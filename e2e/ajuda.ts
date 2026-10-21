import { expect, type Page } from '@playwright/test';

// Episódio de referência dos testes (o nome da página não muda quando o áudio é refeito).
export const EPISODIO = '/episodios/falso-advogado-ceara/';

// O áudio fica no R2 e é servido pelo Worker worker/audio em www.cyberjus.org/audio/* (o contêiner não tem
// /audio/). Antes da rota existir: AUDIO_BASE=https://cyberjus-audio.<conta>.workers.dev
export const AUDIO_BASE = (process.env['AUDIO_BASE'] ?? 'https://www.cyberjus.org').replace(/\/$/, '');

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
    // com a URL: "Failed to load resource" não diz qual (o 404 do <audio> no contêiner, sem /audio/, é esperado)
    if (m.type() === 'error') problemas.push(`${m.text()} ${m.location().url}`.trim());
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
