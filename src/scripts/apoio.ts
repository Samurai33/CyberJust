// Formulário da página Apoie (src/pages/apoie.astro) -> Worker worker/apoio (/api/apoio).
// O módulo roda uma vez por sessão (ClientRouter): tudo por delegação no document, nada registrado por página.

export {};

const API = '/api/apoio';

type Resposta = { tipo: 'unico' | 'mensal'; fatura: string; pix: { copiaECola: string; qr: string } | null };

const form = (alvo: EventTarget | null) => (alvo instanceof HTMLElement ? alvo.closest<HTMLFormElement>('form[data-apoio]') : null);

function marcarCpf(campo: HTMLInputElement) {
  const d = campo.value.replace(/\D/g, '').slice(0, 11);
  campo.value = d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function atualizar(f: HTMLFormElement) {
  const dados = new FormData(f);
  const outro = f.querySelector<HTMLElement>('[data-apoio-outro]');
  if (outro) outro.hidden = dados.get('valor') !== 'outro';
  const opcional = f.querySelector<HTMLElement>('[data-apoio-email-opcional]');
  const mensal = dados.get('tipo') === 'mensal';
  if (opcional) opcional.textContent = mensal ? '(obrigatório no apoio mensal)' : '(opcional)';
  f.querySelector<HTMLInputElement>('#a-email')!.required = mensal;
}

document.addEventListener('change', (e) => {
  const f = form(e.target);
  if (f) atualizar(f);
});

document.addEventListener('input', (e) => {
  if (e.target instanceof HTMLInputElement && e.target.id === 'a-cpf' && form(e.target)) marcarCpf(e.target);
});

document.addEventListener('submit', async (e) => {
  const f = form(e.target);
  if (!f) return;
  e.preventDefault();
  const erro = f.querySelector<HTMLElement>('[data-apoio-erro]')!;
  const botao = f.querySelector<HTMLButtonElement>('[data-apoio-enviar]')!;
  const d = new FormData(f);
  const valor = d.get('valor') === 'outro' ? Number(String(d.get('valorLivre') ?? '').replace(',', '.')) : Number(d.get('valor'));
  erro.textContent = '';
  botao.disabled = true;
  botao.setAttribute('aria-busy', 'true');
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({
        tipo: d.get('tipo'),
        valor,
        nome: d.get('nome'),
        cpf: d.get('cpf'),
        email: d.get('email'),
        aceite: d.get('aceite') === 'on',
        site: d.get('site'),
      }),
    });
    const corpo = (await r.json().catch(() => ({}))) as Partial<Resposta> & { erro?: string };
    if (!r.ok || !corpo.fatura) {
      erro.textContent = corpo.erro ?? 'Não foi possível gerar o pagamento agora. Tente de novo em alguns minutos.';
      return;
    }
    mostrar(f, corpo as Resposta);
  } catch {
    erro.textContent = 'Sem conexão com o sistema de pagamento. Confira sua internet e tente de novo.';
  } finally {
    botao.disabled = false;
    botao.removeAttribute('aria-busy');
  }
});

function mostrar(f: HTMLFormElement, r: Resposta) {
  const caixa = document.querySelector<HTMLElement>('[data-apoio-resultado]');
  if (!caixa) return;
  // Só aceita fatura do próprio Asaas (o link abre em outra aba).
  const fatura = new URL(r.fatura);
  if (fatura.protocol !== 'https:' || !/(^|\.)asaas\.com$/.test(fatura.hostname)) return;
  caixa.querySelector<HTMLAnchorElement>('[data-apoio-fatura]')!.href = fatura.href;
  const pix = caixa.querySelector<HTMLElement>('[data-apoio-pix]')!;
  pix.hidden = !r.pix;
  if (r.pix && r.pix.qr.startsWith('/api/apoio/qr/')) {
    caixa.querySelector<HTMLImageElement>('[data-apoio-qr]')!.src = r.pix.qr;
    caixa.querySelector<HTMLTextAreaElement>('[data-apoio-copia]')!.value = r.pix.copiaECola;
  }
  caixa.querySelector<HTMLElement>('[data-apoio-mensal]')!.hidden = r.tipo !== 'mensal';
  f.hidden = true;
  caixa.hidden = false;
  caixa.focus();
}

document.addEventListener('click', async (e) => {
  const botao = e.target instanceof HTMLElement ? e.target.closest('[data-apoio-copiar]') : null;
  if (!botao) return;
  const texto = document.querySelector<HTMLTextAreaElement>('[data-apoio-copia]');
  const aviso = document.querySelector<HTMLElement>('[data-apoio-copiado]');
  if (!texto || !aviso) return;
  try {
    await navigator.clipboard.writeText(texto.value);
    aviso.textContent = 'Código copiado. Cole no app do banco, em Pix copia e cola.';
  } catch {
    texto.select();
    aviso.textContent = 'Selecione o código e copie.';
  }
});
