// Contador anônimo do cyberjus.org: www.cyberjus.org/api/contador (rota mais específica que a do
// n3xus-manutencao, então só este Worker atende esse caminho).
//
//   GET  -> { total, desde }          número agregado, sem nada por pessoa
//   POST -> soma 1 e devolve o mesmo  o navegador chama uma vez só (marca no localStorage)
//
// LGPD: não guarda IP, cookie, User-Agent nem identificador. O IP só é usado, em memória, como chave do
// limitador de taxa da Cloudflare (contra quem tenta inflar o número) e é descartado em seguida.

const ORIGEM = 'https://www.cyberjus.org';
// Robôs que executam JavaScript (o resto nem chega aqui, porque a contagem depende do script do site).
const ROBO = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|go-http/i;

const CABECALHOS = {
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer',
};

const json = (status, corpo, cache = 'no-store') =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CABECALHOS, 'cache-control': cache } });

const ler = (env) => env.DB.prepare('SELECT total, desde FROM contador WHERE id = 1').first();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/contador') return json(404, { erro: 'não encontrado' });

    try {
      if (request.method === 'GET' || request.method === 'HEAD') {
        const linha = await ler(env);
        return json(200, { total: linha.total, desde: linha.desde }, 'public, max-age=30');
      }

      if (request.method === 'POST') {
        // Só o próprio site conta: origem igual, pedido feito pelo navegador na mesma origem, sem robôs.
        const site = request.headers.get('sec-fetch-site');
        if (request.headers.get('origin') !== ORIGEM || (site && site !== 'same-origin')) return json(403, { erro: 'origem' });
        if (ROBO.test(request.headers.get('user-agent') ?? '')) return json(403, { erro: 'robô' });
        if (env.LIMITE) {
          const { success } = await env.LIMITE.limit({ key: request.headers.get('cf-connecting-ip') ?? 'sem-ip' });
          if (!success) return json(429, { erro: 'muitas tentativas' });
        }
        const linha = await env.DB.prepare('UPDATE contador SET total = total + 1 WHERE id = 1 RETURNING total, desde').first();
        return json(200, { total: linha.total, desde: linha.desde });
      }

      return new Response(null, { status: 405, headers: { ...CABECALHOS, allow: 'GET, HEAD, POST' } });
    } catch {
      // O site mostra a frase sem número quando o contador não responde.
      return json(503, { erro: 'indisponível' });
    }
  },
};
