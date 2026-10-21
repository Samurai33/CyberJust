import { expect, test, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Estúdio (podcast/painel): a página é servida pelo contêiner do bot, não pela imagem do site. Aqui ela roda com a
// API simulada (page.route), para conferir os estados de carregamento e a trava do pipeline sem bot nem Access.
// Padrões: botão indisponível = aria-disabled + aria-describedby (continua focável, WAI-ARIA APG); em andamento =
// aria-busy + rótulo do que está rodando; região que carrega = aria-busy + esqueleto; falha = "Tentar de novo".

test.beforeEach(({}, info) => test.skip(info.project.name !== 'chromium', 'interface do Estúdio: um navegador basta'));

const DIR = 'podcast/painel';
const BASE = 'http://estudio.test/e/';
const PASTA = 'ep-teste';
const agora = () => Date.now() / 1000;
const LIVRE = { ocupado: false, etapa: null, etapa_nome: null, alvo: null, desde: null };
const EP = {
  pasta: PASTA, titulo: 'Episódio de teste', estado: 'audio', tema: 'fraudes', status: 'ATIVO', palavras: 1000, minutos: 9, caracteres: 8000,
  custo_audio: 3800, roteiro: { titulo: 'Episódio de teste' }, ficha: 'ficha', fontes: [], revisao: [], modelos: { avisos: [], etapas: [] },
  copias: [], url: null, versao_de: null, texto_mudou: false,
  qa: { aprovado: true, duracao_s: 547, lufs: -16.2, pico_dbtp: -1.05, faststart: true, cobertura_alinhamento: 0.9, fora_do_tom: [] },
  tem_audio: true, versao_audio: 1, tem_legenda: false, capitulos: [], audio_bytes: 6_900_000, blocos: 5, legenda_em_dia: true,
  falas: [{ quem: 'samurai', texto: 'Olá.', tempo: [0, 2], custo_refazer: 10 }, { quem: 'coapresentadora', texto: 'Oi.', tempo: [2, 3], custo_refazer: 5 }],
};

interface Simulacao { estado: Record<string, unknown>; falharEpisodios: number; atraso: number }

async function simular(page: Page, sim: Simulacao) {
  const json = (route: Route, corpo: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(corpo) });
  await page.route('http://estudio.test/**', async (route) => {
    const p = new URL(route.request().url()).pathname.replace(/^\/e\//, '');
    if (p === '') return route.fulfill({ contentType: 'text/html', body: readFileSync(`${DIR}/index.html`) });
    if (p.startsWith('estatico/fontes/')) return route.fulfill({ status: 404, body: '' });
    if (p.startsWith('estatico/')) {
      const arq = p.slice('estatico/'.length);
      return route.fulfill({ contentType: arq.endsWith('.css') ? 'text/css' : 'text/javascript', body: readFileSync(`${DIR}/${arq}`) });
    }
    if (sim.atraso) await new Promise((r) => setTimeout(r, sim.atraso));
    if (p === 'api/estado') {
      return json(route, { usuario: 'teste@exemplo.dev', ...sim.estado, agora: agora(), creditos: { livre: 97_000, limite: 131_000 },
        proxima_pauta: null, hora: 9, custo_caractere: 0.45, modelo_tts: 'eleven_v4', estabilidade: '0.35', coapresentadora: 'Sara' });
    }
    if (p === 'api/episodios') {
      if (sim.falharEpisodios-- > 0) return json(route, { erro: 'falha simulada' }, 500);
      return json(route, [{ pasta: PASTA, titulo: EP.titulo, estado: EP.estado, qa: EP.qa, minutos: 9, atualizado: agora(), caracteres: 8000 }]);
    }
    if (p === `api/episodios/${PASTA}`) return json(route, EP);
    if (p === `api/episodios/${PASTA}/publicar`) {
      sim.estado = { ocupado: true, etapa: 'publicar', etapa_nome: 'publicando', alvo: PASTA, desde: agora() };
      return json(route, { ok: true });
    }
    if (p === 'api/atividade') return json(route, []);
    return json(route, { erro: `rota não simulada: ${p}` }, 404);
  });
}

test('visão geral: esqueleto ao carregar, erro com "Tentar de novo" e nada de "Nada pendente" falso', async ({ page }) => {
  const sim: Simulacao = { estado: { ...LIVRE }, falharEpisodios: 1, atraso: 800 };
  await simular(page, sim);
  await page.goto(BASE);
  await expect(page.locator('#kpis')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#kpis .esqueleto').first()).toBeAttached();
  sim.atraso = 0;
  await expect(page.locator('#kpis')).not.toHaveAttribute('aria-busy', 'true');
  // a 1ª busca da lista falhou: erro visível, e a fila não diz "Nada pendente" (seria falso)
  await expect(page.locator('#fila .erro-carga')).toContainText('falha simulada');
  await expect(page.locator('#fila')).not.toContainText('Nada pendente');
  await page.locator('#fila .erro-carga button').click();
  await expect(page.locator('#fila a', { hasText: 'Episódio de teste' })).toBeVisible();
});

test('publicar: o botão fica indisponível e mostra "Publicando…" até a etapa terminar', async ({ page }) => {
  const sim: Simulacao = { estado: { ...LIVRE }, falharEpisodios: 0, atraso: 0 };
  await simular(page, sim);
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));

  await page.goto(`${BASE}#/episodios/${PASTA}`);
  const publicar = page.locator('#ep-acoes .botao.publica');
  await expect(publicar).toBeVisible();
  await expect(publicar).not.toHaveAttribute('aria-disabled', 'true');

  // dois toques: o 1º arma, o 2º envia
  await publicar.click();
  await expect(publicar.locator('.rotulo')).toHaveText('Confirmar publicação');
  await publicar.click();

  // durante a etapa: indisponível (com o motivo descrito), em andamento, com indicador
  await expect(publicar).toHaveAttribute('aria-busy', 'true');
  await expect(publicar.locator('.rotulo')).toHaveText('Publicando…');
  await expect(publicar).toHaveAttribute('aria-disabled', 'true');
  await expect(publicar).toHaveAttribute('aria-describedby', 'motivo-ocupado');
  await expect(page.locator('#motivo-ocupado')).toContainText('publicando');
  await expect(publicar.locator('.giro')).toHaveCount(1);
  // os outros botões de etapa também travam; só o que disparou mostra andamento
  for (const b of await page.locator('#ep-acoes .botao[data-pipeline], #ep-falas .botao[data-pipeline]').all()) {
    await expect(b).toHaveAttribute('aria-disabled', 'true');
  }
  await expect(page.locator('#ep-acoes .botao.perigo')).not.toHaveAttribute('aria-busy', 'true');
  // faixa de progresso: etapa numa região role=status, cronômetro fora dela
  await expect(page.locator('#ep-progresso')).not.toHaveClass(/rot-oculto/);
  await expect(page.locator('#ep-progresso-txt')).toHaveText('publicando (este episódio)');
  await expect(page.locator('#ep-progresso-txt')).toHaveAttribute('role', 'status');
  await expect(page.locator('#ep-progresso-tempo')).toHaveAttribute('aria-hidden', 'true');

  // clicar no botão travado não envia nada e explica o motivo; ele continua focável
  const posts: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()); });
  await publicar.click();
  await publicar.click();
  await expect(page.locator('#avisos')).toContainText('Indisponível: o pipeline está publicando');
  expect(posts).toEqual([]);
  await publicar.focus();
  await expect(publicar).toBeFocused();

  // a etapa termina: botão liberado, rótulo e ícone de volta, faixa escondida
  sim.estado = { ...LIVRE };
  await expect(publicar).not.toHaveAttribute('aria-disabled', 'true', { timeout: 12_000 });
  await expect(publicar.locator('.rotulo')).toHaveText('Publicar no site');
  await expect(publicar.locator('.giro')).toHaveCount(0);
  await expect(page.locator('#ep-progresso')).toHaveClass(/rot-oculto/);
  expect(erros).toEqual([]);
});

test('episódio que não abre: mensagem de erro com "Tentar de novo", sem mostrar o episódio anterior', async ({ page }) => {
  await simular(page, { estado: { ...LIVRE }, falharEpisodios: 0, atraso: 0 });
  await page.route(`http://estudio.test/e/api/episodios/nao-existe`, (r) => r.fulfill({ status: 404, contentType: 'application/json', body: '{"erro":"episódio não encontrado"}' }));
  await page.goto(`${BASE}#/episodios/${PASTA}`);
  await expect(page.locator('#t-ep')).toHaveText('Episódio de teste');
  await page.goto(`${BASE}#/episodios/nao-existe`);
  await expect(page.locator('#t-ep')).toHaveText('Não foi possível abrir o episódio');
  await expect(page.locator('#ep-falas .erro-carga')).toContainText('episódio não encontrado');
  await expect(page.locator('#ep-acoes .botao')).toHaveCount(0);
});

test('menos movimento: indicador e esqueleto sem animação', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.setContent(`<style>${readFileSync(`${DIR}/estudio.css`, 'utf8')}</style><span class="giro"></span><div class="esqueleto"></div>`);
  await expect(page.locator('.giro')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.esqueleto')).toHaveCSS('animation-name', 'none');
  await ctx.close();
});
