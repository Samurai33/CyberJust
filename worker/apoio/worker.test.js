import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { cpfValido, hoje, validar } from './worker.js';

const BASE = 'https://api-sandbox.asaas.com/v3';
const URL_API = 'https://www.cyberjus.org/api/apoio';
const CPF = '529.982.247-25'; // CPF de exemplo com dígitos válidos
const navegador = {
  origin: 'https://www.cyberjus.org',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (iPhone) Safari/605.1.15',
  'content-type': 'application/json',
};
const formulario = (extra = {}) => ({ nome: 'Maria Silva', cpf: CPF, email: 'maria@example.com', valor: 25, tipo: 'unico', aceite: true, site: '', ...extra });
const post = (corpo, headers = navegador) => new Request(URL_API, { method: 'POST', headers, body: JSON.stringify(corpo) });

// D1 de mentira com as duas tabelas do schema.sql.
function banco() {
  const estado = { apoios: 3, desde: '2026-11-20', vistos: new Set() };
  return {
    estado,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) { args = a; return stmt; },
        async first() { return { apoios: estado.apoios, desde: estado.desde }; },
        async run() {
          if (sql.startsWith('INSERT OR IGNORE INTO vistos')) {
            const novo = !estado.vistos.has(args[0]);
            estado.vistos.add(args[0]);
            return { meta: { changes: novo ? 1 : 0 } };
          }
          if (sql.startsWith('UPDATE totais')) estado.apoios += 1;
          return { meta: { changes: 1 } };
        },
      };
      return stmt;
    },
  };
}

// Asaas de mentira: registra as chamadas e responde como a API v3.
function asaasFalso({ clienteExiste = false, clienteMudo = false, semPix = false, erroCliente = null, pagamento = {} } = {}) {
  const chamadas = [];
  const resp = (status, corpo) => new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } });
  const fetchFalso = vi.fn(async (url, init = {}) => {
    const caminho = String(url).replace(BASE, '');
    const corpo = init.body ? JSON.parse(init.body) : undefined;
    chamadas.push({ metodo: init.method ?? 'GET', caminho, corpo, headers: init.headers });
    if (caminho.startsWith('/customers?')) return resp(200, { data: clienteExiste ? [{ id: 'cus_1', email: 'antigo@example.com', notificationDisabled: clienteMudo }] : [] });
    if (caminho === '/customers') return erroCliente ? resp(400, { errors: [{ description: erroCliente }] }) : resp(200, { id: 'cus_2' });
    if (caminho.startsWith('/customers/')) return resp(200, { id: 'cus_1' });
    if (caminho === '/payments') return resp(200, { id: 'pay_abc123', invoiceUrl: 'https://sandbox.asaas.com/i/abc123' });
    if (caminho === '/subscriptions') return resp(200, { id: 'sub_9' });
    if (caminho.startsWith('/subscriptions/sub_9/payments')) return resp(200, { data: [{ id: 'pay_mes001', invoiceUrl: 'https://sandbox.asaas.com/i/mes001' }] });
    if (caminho.endsWith('/pixQrCode')) return semPix ? resp(400, { errors: [{ description: 'sem chave' }] }) : resp(200, { payload: '00020126PIX', encodedImage: btoa('PNG') });
    if (caminho.startsWith('/payments/')) return resp(200, { id: 'pay_abc123', externalReference: 'cyberjus-apoio', status: 'PENDING', ...pagamento });
    return resp(404, {});
  });
  return { chamadas, fetchFalso };
}

let db;
const env = () => ({ DB: db, ASAAS_BASE: BASE, ASAAS_KEY: 'chave-teste', WEBHOOK_TOKEN: 'segredo-do-webhook-com-32-caracteres!', LIMITE: { limit: async () => ({ success: true }) } });

beforeEach(() => { db = banco(); });
afterEach(() => vi.unstubAllGlobals());

describe('validação', () => {
  it('confere os dígitos do CPF', () => {
    expect(cpfValido(CPF)).toBe(true);
    expect(cpfValido('529.982.247-24')).toBe(false);
    expect(cpfValido('111.111.111-11')).toBe(false);
    expect(cpfValido('123')).toBe(false);
  });

  it('limpa e aceita um formulário bom', () => {
    expect(validar(formulario({ nome: '  Maria   Silva ', email: 'Maria@Example.com ' })).dados).toEqual({
      nome: 'Maria Silva', cpf: '52998224725', email: 'maria@example.com', tipo: 'unico', valor: 25,
    });
  });

  it.each([
    [{ valor: 4.99 }, 'valor'],
    [{ valor: 1001 }, 'valor'],
    [{ valor: 'abc' }, 'valor'],
    [{ tipo: 'anual' }, 'uma vez ou todo mês'],
    [{ nome: 'ab' }, 'nome'],
    [{ cpf: '000.000.000-00' }, 'CPF'],
    [{ email: 'sem-arroba' }, 'E-mail'],
    [{ tipo: 'mensal', email: '' }, 'obrigatório'],
    [{ aceite: false }, 'concordar'],
    [{ site: 'http://spam' }, 'inválido'],
  ])('recusa %o', (extra, trecho) => {
    expect(validar(formulario(extra)).erro).toContain(trecho);
  });

  it('vencimento usa a data de Brasília', () => {
    expect(hoje(new Date('2026-11-21T01:30:00Z'))).toBe('2026-11-20'); // 22h30 em Brasília
  });
});

describe('POST /api/apoio', () => {
  it('apoio único: cria cliente, cobrança com vencimento hoje e devolve fatura e Pix', async () => {
    const { chamadas, fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    const r = await worker.fetch(post(formulario()), env());
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({
      tipo: 'unico',
      fatura: 'https://sandbox.asaas.com/i/abc123',
      pix: { copiaECola: '00020126PIX', qr: '/api/apoio/qr/pay_abc123' },
    });
    const cobranca = chamadas.find((c) => c.caminho === '/payments');
    expect(cobranca.corpo).toMatchObject({ customer: 'cus_2', billingType: 'UNDEFINED', value: 25, externalReference: 'cyberjus-apoio' });
    expect(cobranca.corpo.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(chamadas[0].headers.access_token).toBe('chave-teste');
    expect(chamadas[0].headers['user-agent']).toContain('cyberjus-apoio');
  });

  it('apoio mensal: cria assinatura mensal e devolve a 1ª cobrança', async () => {
    const { chamadas, fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    const r = await worker.fetch(post(formulario({ tipo: 'mensal', valor: 10 })), env());
    expect(r.status).toBe(200);
    const corpo = await r.json();
    expect(corpo.tipo).toBe('mensal');
    expect(corpo.fatura).toBe('https://sandbox.asaas.com/i/mes001');
    expect(chamadas.find((c) => c.caminho === '/subscriptions').corpo).toMatchObject({ cycle: 'MONTHLY', value: 10, billingType: 'UNDEFINED' });
  });

  it('reaproveita o cliente pelo CPF e atualiza o e-mail', async () => {
    const { chamadas, fetchFalso } = asaasFalso({ clienteExiste: true });
    vi.stubGlobal('fetch', fetchFalso);
    await worker.fetch(post(formulario()), env());
    expect(chamadas.some((c) => c.metodo === 'POST' && c.caminho === '/customers')).toBe(false);
    expect(chamadas.find((c) => c.metodo === 'PUT').corpo).toEqual({ email: 'maria@example.com' });
    expect(chamadas.find((c) => c.caminho === '/payments').corpo.customer).toBe('cus_1');
  });

  it('apoio único cria o cliente sem notificação do Asaas (sem taxa de mensageria)', async () => {
    const { chamadas, fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    await worker.fetch(post(formulario()), env());
    expect(chamadas.find((c) => c.metodo === 'POST' && c.caminho === '/customers').corpo.notificationDisabled).toBe(true);
  });

  it('apoio mensal cria o cliente com notificação (a cobrança de cada mês chega por e-mail)', async () => {
    const { chamadas, fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    await worker.fetch(post(formulario({ tipo: 'mensal', valor: 10 })), env());
    expect(chamadas.find((c) => c.metodo === 'POST' && c.caminho === '/customers').corpo.notificationDisabled).toBe(false);
  });

  it('apoio mensal de cliente que estava sem notificação religa a notificação', async () => {
    const { chamadas, fetchFalso } = asaasFalso({ clienteExiste: true, clienteMudo: true });
    vi.stubGlobal('fetch', fetchFalso);
    await worker.fetch(post(formulario({ tipo: 'mensal', valor: 10 })), env());
    expect(chamadas.find((c) => c.metodo === 'PUT').corpo).toEqual({ email: 'maria@example.com', notificationDisabled: false });
  });

  it('apoio único de quem já é mensal não desliga a notificação', async () => {
    const { chamadas, fetchFalso } = asaasFalso({ clienteExiste: true });
    vi.stubGlobal('fetch', fetchFalso);
    await worker.fetch(post(formulario({ email: 'antigo@example.com' })), env());
    expect(chamadas.some((c) => c.metodo === 'PUT')).toBe(false);
  });

  it('sem chave Pix na conta: devolve só a fatura (cartão/boleto)', async () => {
    const { fetchFalso } = asaasFalso({ semPix: true });
    vi.stubGlobal('fetch', fetchFalso);
    const corpo = await (await worker.fetch(post(formulario()), env())).json();
    expect(corpo.pix).toBeNull();
    expect(corpo.fatura).toContain('asaas.com');
  });

  it('erro 400 do Asaas vira mensagem curta para a pessoa', async () => {
    const { fetchFalso } = asaasFalso({ erroCliente: 'O CPF informado é inválido.' });
    vi.stubGlobal('fetch', fetchFalso);
    const r = await worker.fetch(post(formulario()), env());
    expect(r.status).toBe(400);
    expect((await r.json()).erro).toBe('O CPF informado é inválido.');
  });

  it('Asaas fora do ar: 502 com mensagem genérica, sem vazar detalhe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('erro', { status: 500 })));
    const r = await worker.fetch(post(formulario()), env());
    expect(r.status).toBe(502);
    expect((await r.json()).erro).toContain('não respondeu');
  });

  it.each([
    [{ ...navegador, origin: 'https://golpe.example' }, 403],
    [{ ...navegador, 'sec-fetch-site': 'cross-site' }, 403],
    [{ ...navegador, 'user-agent': 'python-requests/2.32' }, 403],
    [{ ...navegador, 'content-type': 'text/plain' }, 415],
  ])('recusa pedido de fora do site (%#)', async (headers, status) => {
    const { fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    const r = await worker.fetch(post(formulario(), headers), env());
    expect(r.status).toBe(status);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('limitador de taxa: 429 sem chamar o Asaas', async () => {
    const { fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    const r = await worker.fetch(post(formulario()), { ...env(), LIMITE: { limit: async () => ({ success: false }) } });
    expect(r.status).toBe(429);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('formulário inválido: 400 sem chamar o Asaas', async () => {
    const { fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    const r = await worker.fetch(post(formulario({ cpf: '123' })), env());
    expect(r.status).toBe(400);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});

describe('GET /api/apoio', () => {
  it('devolve só o total agregado', async () => {
    const r = await worker.fetch(new Request(URL_API), env());
    expect(await r.json()).toEqual({ apoios: 3, desde: '2026-11-20' });
    expect(r.headers.get('set-cookie')).toBeNull();
  });
});

describe('webhook', () => {
  const aviso = (corpo, token = 'segredo-do-webhook-com-32-caracteres!') =>
    new Request(`${URL_API}/webhook`, { method: 'POST', headers: { 'asaas-access-token': token, 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
  const pago = (id = 'pay_abc123', event = 'PAYMENT_RECEIVED', externalReference = 'cyberjus-apoio') => ({ id: 'evt_1', event, payment: { id, externalReference } });

  it('recusa token errado', async () => {
    expect((await worker.fetch(aviso(pago(), 'errado'), env())).status).toBe(401);
    expect(db.estado.apoios).toBe(3);
  });

  it('soma 1 por pagamento, mesmo com CONFIRMED e RECEIVED', async () => {
    await worker.fetch(aviso(pago('pay_abc123', 'PAYMENT_CONFIRMED')), env());
    await worker.fetch(aviso(pago('pay_abc123', 'PAYMENT_RECEIVED')), env());
    expect(db.estado.apoios).toBe(4);
    await worker.fetch(aviso(pago('pay_outro99')), env());
    expect(db.estado.apoios).toBe(5);
  });

  it('não guarda o id do pagamento em claro', async () => {
    await worker.fetch(aviso(pago()), env());
    const [hash] = db.estado.vistos;
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('ignora outras cobranças da conta e outros eventos, com 200', async () => {
    const r1 = await worker.fetch(aviso(pago('pay_x1y2z3', 'PAYMENT_RECEIVED', 'saldato-plano')), env());
    const r2 = await worker.fetch(aviso(pago('pay_x1y2z3', 'PAYMENT_CREATED')), env());
    expect([r1.status, r2.status]).toEqual([200, 200]);
    expect(db.estado.apoios).toBe(3);
  });
});

describe('QR Code', () => {
  it('serve o PNG de uma cobrança de apoio pendente', async () => {
    const { fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    const r = await worker.fetch(new Request(`${URL_API}/qr/pay_abc123`), env());
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('image/png');
    expect(new TextDecoder().decode(await r.arrayBuffer())).toBe('PNG');
  });

  it('aceita o formato real de id do Asaas (pay_0_xxxx)', async () => {
    const { fetchFalso } = asaasFalso();
    vi.stubGlobal('fetch', fetchFalso);
    expect((await worker.fetch(new Request(`${URL_API}/qr/pay_0_ydn281c1y2kelw`), env())).status).toBe(200);
  });

  it('não serve cobrança de outro produto nem id malformado', async () => {
    const { fetchFalso } = asaasFalso({ pagamento: { externalReference: 'saldato-plano' } });
    vi.stubGlobal('fetch', fetchFalso);
    expect((await worker.fetch(new Request(`${URL_API}/qr/pay_abc123`), env())).status).toBe(404);
    expect((await worker.fetch(new Request(`${URL_API}/qr/..%2Fcustomers`), env())).status).toBe(404);
  });

  it('não serve cobrança já paga', async () => {
    const { fetchFalso } = asaasFalso({ pagamento: { status: 'RECEIVED' } });
    vi.stubGlobal('fetch', fetchFalso);
    expect((await worker.fetch(new Request(`${URL_API}/qr/pay_abc123`), env())).status).toBe(404);
  });
});
