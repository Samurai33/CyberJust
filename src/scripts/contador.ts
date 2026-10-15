// Contador anônimo de pessoas (worker/contador). Conta uma vez por navegador, em qualquer página, e
// preenche a frase da home ([data-contador]). Sem cookie e sem identificador: só uma marca "já contado"
// no localStorage. Sem número (erro, contador fora do ar ou total baixo), fica a frase sem número.

const API = '/api/contador';
const MARCA = 'cj-contado';
// Abaixo disso a prova social trabalha contra ("só 12 pessoas"); mostra a frase sem número.
const MINIMO = 100;

type Dados = { total: number; desde: string };

const armazenamento = {
  ler(): string | null | undefined {
    try {
      return localStorage.getItem(MARCA);
    } catch {
      return undefined; // sem armazenamento: não conta, para não contar a mesma pessoa a cada visita
    }
  },
  marcar() {
    try {
      localStorage.setItem(MARCA, '1');
    } catch {}
  },
};

function deveContar(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  // Robôs de automação e quem pediu para não ser rastreado (GPC/DNT) não entram na conta.
  if (nav.webdriver || nav.globalPrivacyControl || nav.doNotTrack === '1') return false;
  return armazenamento.ler() === null;
}

let pedido: Promise<Dados | null> | null = null;

// O módulo roda uma vez por sessão (ClientRouter); as páginas seguintes reaproveitam a resposta.
function obter(): Promise<Dados | null> {
  pedido ??= (async () => {
    const contar = deveContar();
    const r = await fetch(API, { method: contar ? 'POST' : 'GET', headers: { accept: 'application/json' }, credentials: 'omit' });
    if (!r.ok) return null;
    const d = (await r.json()) as Partial<Dados>;
    if (typeof d.total !== 'number' || !Number.isSafeInteger(d.total) || d.total < 0 || typeof d.desde !== 'string') return null;
    if (contar) armazenamento.marcar();
    return { total: d.total, desde: d.desde };
  })().catch(() => null);
  return pedido;
}

const numero = new Intl.NumberFormat('pt-BR');
const dia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function contarAte(alvo: HTMLElement, total: number) {
  if (semMovimento() || !('IntersectionObserver' in window)) {
    alvo.textContent = numero.format(total);
    return;
  }
  alvo.textContent = numero.format(0);
  const obs = new IntersectionObserver((entradas) => {
    if (!entradas.some((e) => e.isIntersecting)) return;
    obs.disconnect();
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / 1200);
      alvo.textContent = numero.format(Math.round(total * (1 - (1 - t) ** 3)));
      if (t < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });
  obs.observe(alvo);
}

async function preencher() {
  const caixa = document.querySelector<HTMLElement>('[data-contador]');
  if (!caixa || caixa.dataset['pronto']) return;
  const dados = await obter();
  if (!dados || dados.total < MINIMO || !caixa.isConnected) return;
  caixa.dataset['pronto'] = '1';

  const total = numero.format(dados.total);
  const frase = caixa.querySelector<HTMLElement>('[data-contador-frase]')!;
  // A frase visível anima o número e fica fora da árvore de acessibilidade; o leitor de tela ouve só a frase
  // final, uma vez (região aria-live dentro do próprio título, que assim continua com nome completo).
  const forte = document.createElement('strong');
  forte.className = 'contador-num';
  frase.replaceChildren(forte, ' pessoas já se informaram aqui para não cair em golpe digital.');
  frase.setAttribute('aria-hidden', 'true');
  contarAte(forte, dados.total);
  caixa.querySelector('[data-contador-anuncio]')!.textContent = `${total} pessoas já se informaram aqui para não cair em golpe digital.`;

  const data = new Date(`${dados.desde}T00:00:00Z`);
  const desde = caixa.querySelector('[data-contador-desde]');
  if (desde && !Number.isNaN(data.getTime())) desde.textContent = `Contagem anônima desde ${dia.format(data)}`;
}

obter();
document.addEventListener('astro:page-load', preencher);
