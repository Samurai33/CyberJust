// Apoio dos ouvintes pelo Asaas da N3XUS: www.cyberjus.org/api/apoio* (rota mais específica que a do
// n3xus-manutencao, então só este Worker atende esse caminho, com o site no ar ou não).
//
//   GET  /api/apoio             -> { apoios, desde }   total agregado, nada por pessoa
//   POST /api/apoio             -> cria a cobrança (uma vez) ou a assinatura (todo mês) no Asaas e devolve
//                                  { tipo, fatura, pix: { copiaECola, qr } | null }
//   GET  /api/apoio/qr/<id>     -> PNG do QR Code Pix daquela cobrança (só cobranças de apoio)
//   POST /api/apoio/webhook     -> aviso do Asaas (cabeçalho asaas-access-token); soma 1 apoio por pagamento
//
// Segredos (Worker): ASAAS_KEY (chave da API), WEBHOOK_TOKEN (o authToken cadastrado no webhook do Asaas).
// Variável: ASAAS_BASE (https://api.asaas.com/v3 em produção, https://api-sandbox.asaas.com/v3 no teste).
//
// LGPD: nome, CPF e e-mail vão direto para o Asaas (operador de pagamento, exigência dele para emitir a
// cobrança) e não ficam guardados aqui nem nos logs. O D1 guarda só o total e o SHA-256 do id de cada
// pagamento já contado (para não contar duas vezes). O IP só serve, em memória, para o limitador de taxa.

const ORIGEM = 'https://www.cyberjus.org';
const REFERENCIA = 'cyberjus-apoio';
const DESCRICAO = 'Apoio ao podcast CyberJustiça Brasil';
export const VALOR_MIN = 5;
export const VALOR_MAX = 1000;
const ROBO = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|go-http/i;
const EVENTOS_PAGOS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);

const CABECALHOS = {
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer',
};

const json = (status, corpo, cache = 'no-store') =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CABECALHOS, 'cache-control': cache } });

// ---------- validação ----------

export function cpfValido(cpf) {
  const d = String(cpf ?? '').replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/** Confere o formulário. Devolve { erro } ou { dados } já limpos. */
export function validar(c) {
  if (!c || typeof c !== 'object') return { erro: 'Pedido inválido.' };
  if (c.site) return { erro: 'Pedido inválido.' }; // campo-isca: só robô preenche
  const nome = String(c.nome ?? '').trim().replace(/\s+/g, ' ');
  const cpf = String(c.cpf ?? '').replace(/\D/g, '');
  const email = String(c.email ?? '').trim().toLowerCase();
  const tipo = c.tipo === 'mensal' ? 'mensal' : c.tipo === 'unico' ? 'unico' : null;
  const valor = Math.round(Number(c.valor) * 100) / 100;
  if (!tipo) return { erro: 'Escolha se o apoio é uma vez ou todo mês.' };
  if (!Number.isFinite(valor) || valor < VALOR_MIN || valor > VALOR_MAX)
    return { erro: `O valor vai de R$ ${VALOR_MIN} a R$ ${VALOR_MAX}.` };
  if (nome.length < 3 || nome.length > 100 || !/\p{L}/u.test(nome)) return { erro: 'Informe seu nome.' };
  if (!cpfValido(cpf)) return { erro: 'CPF inválido.' };
  if (email && (email.length > 254 || !EMAIL.test(email))) return { erro: 'E-mail inválido.' };
  if (tipo === 'mensal' && !email) return { erro: 'No apoio mensal o e-mail é obrigatório: é por ele que chega a cobrança de cada mês.' };
  if (c.aceite !== true) return { erro: 'É preciso concordar com o uso dos dados para a cobrança.' };
  return { dados: { nome, cpf, email, tipo, valor } };
}

/** Data de hoje em Brasília (AAAA-MM-DD): em UTC, depois das 21h o vencimento sairia para amanhã. */
export const hoje = (agora = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);

// ---------- Asaas ----------

class ErroAsaas extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

async function asaas(env, caminho, { metodo = 'GET', corpo } = {}) {
  const r = await fetch(`${env.ASAAS_BASE}${caminho}`, {
    method: metodo,
    headers: {
      access_token: env.ASAAS_KEY,
      'user-agent': 'cyberjus-apoio/1.0 (+https://www.cyberjus.org/apoie/)',
      accept: 'application/json',
      ...(corpo ? { 'content-type': 'application/json' } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) {
    // As mensagens de erro do Asaas são em português e úteis ("CPF inválido"); vão curtas para a pessoa.
    const msg = Array.isArray(dados.errors) && dados.errors[0]?.description ? String(dados.errors[0].description).slice(0, 200) : '';
    throw new ErroAsaas(r.status, msg);
  }
  return dados;
}

// Notificações do Asaas (e-mail/SMS ao apoiador) custam a "taxa de mensageria" (R$ 0,99 por cobrança). No apoio único
// a pessoa já vê o Pix na tela: notificação desligada. No mensal ficam ligadas, porque é por elas que chega a cobrança
// de cada mês; um apoio único de quem já é mensal não mexe nisso.
async function cliente(env, { nome, cpf, email, tipo }) {
  const mensal = tipo === 'mensal';
  const achado = await asaas(env, `/customers?cpfCnpj=${cpf}&limit=1`);
  const existente = achado.data?.[0];
  if (existente && !existente.deleted) {
    const mudar = {};
    // Atualiza o e-mail se a pessoa informou um novo (é por ele que chegam as cobranças mensais).
    if (email && existente.email !== email) mudar.email = email;
    if (mensal && existente.notificationDisabled) mudar.notificationDisabled = false;
    if (Object.keys(mudar).length) await asaas(env, `/customers/${existente.id}`, { metodo: 'PUT', corpo: mudar });
    return existente.id;
  }
  const novo = await asaas(env, '/customers', {
    metodo: 'POST',
    corpo: { name: nome, cpfCnpj: cpf, ...(email ? { email } : {}), notificationDisabled: !mensal, externalReference: REFERENCIA },
  });
  return novo.id;
}

async function pixDe(env, idPagamento) {
  try {
    const p = await asaas(env, `/payments/${idPagamento}/pixQrCode`);
    return p.payload ? { copiaECola: p.payload, qr: `/api/apoio/qr/${idPagamento}` } : null;
  } catch {
    return null; // conta sem chave Pix ou Pix fora do ar: a fatura do Asaas ainda aceita cartão e boleto
  }
}

async function criar(env, dados) {
  const id = await cliente(env, dados);
  const comum = { customer: id, billingType: 'UNDEFINED', value: dados.valor, description: DESCRICAO, externalReference: REFERENCIA };
  let pagamento;
  if (dados.tipo === 'unico') {
    pagamento = await asaas(env, '/payments', { metodo: 'POST', corpo: { ...comum, dueDate: hoje() } });
  } else {
    const assinatura = await asaas(env, '/subscriptions', { metodo: 'POST', corpo: { ...comum, nextDueDate: hoje(), cycle: 'MONTHLY' } });
    const lista = await asaas(env, `/subscriptions/${assinatura.id}/payments?limit=1`);
    pagamento = lista.data?.[0];
    if (!pagamento) throw new ErroAsaas(502, '');
  }
  return { tipo: dados.tipo, fatura: pagamento.invoiceUrl, pix: await pixDe(env, pagamento.id) };
}

// ---------- webhook e totais ----------

function iguais(a, b) {
  const x = new TextEncoder().encode(String(a ?? ''));
  const y = new TextEncoder().encode(String(b ?? ''));
  if (x.length !== y.length || x.length === 0) return false;
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

async function sha256(texto) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function webhook(request, env) {
  if (!env.WEBHOOK_TOKEN || !iguais(request.headers.get('asaas-access-token'), env.WEBHOOK_TOKEN)) return json(401, { erro: 'token' });
  const evento = await request.json().catch(() => null);
  const p = evento?.payment;
  // Responde 200 a tudo que não é apoio pago: um erro aqui faz o Asaas pausar a fila de avisos da conta inteira.
  if (!evento || !EVENTOS_PAGOS.has(evento.event) || !p?.id || p.externalReference !== REFERENCIA) return json(200, { ok: true, contado: false });
  // Cartão manda CONFIRMED e depois RECEIVED para o mesmo pagamento: conta uma vez só.
  const r = await env.DB.prepare('INSERT OR IGNORE INTO vistos (hash) VALUES (?)').bind(await sha256(p.id)).run();
  if (r.meta?.changes) await env.DB.prepare('UPDATE totais SET apoios = apoios + 1 WHERE id = 1').run();
  return json(200, { ok: true, contado: Boolean(r.meta?.changes) });
}

async function qr(env, id) {
  if (!/^pay_[a-z0-9_]{6,40}$/i.test(id)) return json(404, { erro: 'não encontrado' });
  // Só cobranças de apoio: a conta Asaas da N3XUS tem outras cobranças que não podem vazar por aqui.
  const pagamento = await asaas(env, `/payments/${id}`).catch(() => null);
  if (!pagamento || pagamento.externalReference !== REFERENCIA || pagamento.status !== 'PENDING') return json(404, { erro: 'não encontrado' });
  const p = await asaas(env, `/payments/${id}/pixQrCode`).catch(() => null);
  if (!p?.encodedImage) return json(404, { erro: 'não encontrado' });
  const bytes = Uint8Array.from(atob(p.encodedImage), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    headers: { 'content-type': 'image/png', 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff', 'cross-origin-resource-policy': 'same-origin' },
  });
}

async function limitar(request, env) {
  if (!env.LIMITE) return true;
  const { success } = await env.LIMITE.limit({ key: request.headers.get('cf-connecting-ip') ?? 'sem-ip' });
  return success;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/apoio/webhook') {
        if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...CABECALHOS, allow: 'POST' } });
        return await webhook(request, env);
      }

      if (pathname.startsWith('/api/apoio/qr/') && request.method === 'GET') {
        if (!(await limitar(request, env))) return json(429, { erro: 'muitas tentativas' });
        return await qr(env, pathname.slice('/api/apoio/qr/'.length));
      }

      if (pathname !== '/api/apoio') return json(404, { erro: 'não encontrado' });

      if (request.method === 'GET' || request.method === 'HEAD') {
        const t = await env.DB.prepare('SELECT apoios, desde FROM totais WHERE id = 1').first();
        return json(200, { apoios: t.apoios, desde: t.desde }, 'public, max-age=60');
      }

      if (request.method === 'POST') {
        const site = request.headers.get('sec-fetch-site');
        if (request.headers.get('origin') !== ORIGEM || (site && site !== 'same-origin')) return json(403, { erro: 'origem' });
        if (ROBO.test(request.headers.get('user-agent') ?? '')) return json(403, { erro: 'robô' });
        if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) return json(415, { erro: 'tipo' });
        if (Number(request.headers.get('content-length') ?? 0) > 4096) return json(413, { erro: 'grande demais' });
        if (!(await limitar(request, env))) return json(429, { erro: 'Muitas tentativas. Espere um minuto e tente de novo.' });
        const v = validar(await request.json().catch(() => null));
        if (v.erro) return json(400, { erro: v.erro });
        try {
          return json(200, await criar(env, v.dados));
        } catch (e) {
          if (e instanceof ErroAsaas && e.status === 400 && e.message) return json(400, { erro: e.message });
          return json(502, { erro: 'O sistema de pagamento não respondeu. Tente de novo em alguns minutos.' });
        }
      }

      return new Response(null, { status: 405, headers: { ...CABECALHOS, allow: 'GET, HEAD, POST' } });
    } catch {
      return json(503, { erro: 'indisponível' });
    }
  },
};
