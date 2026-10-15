import { describe, expect, it } from 'vitest';
import worker from './worker.js';

// D1 de mentira: uma linha só, como no schema.sql.
function ambiente({ falhar = false, limite = true } = {}) {
  const linha = { total: 41, desde: '2026-10-15' };
  const DB = {
    prepare(sql) {
      return {
        async first() {
          if (falhar) throw new Error('D1 fora');
          if (sql.startsWith('UPDATE')) linha.total += 1;
          return { ...linha };
        },
      };
    },
  };
  return { linha, env: { DB, LIMITE: { limit: async () => ({ success: limite }) } } };
}

const URL_API = 'https://www.cyberjus.org/api/contador';
const navegador = { origin: 'https://www.cyberjus.org', 'sec-fetch-site': 'same-origin', 'user-agent': 'Mozilla/5.0 (iPhone) Safari/605.1.15' };
const post = (headers = navegador) => new Request(URL_API, { method: 'POST', headers });

describe('contador anônimo', () => {
  it('GET devolve só o total e a data de início', async () => {
    const { env } = ambiente();
    const r = await worker.fetch(new Request(URL_API), env);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ total: 41, desde: '2026-10-15' });
    expect(r.headers.get('content-type')).toContain('application/json');
    expect(r.headers.get('set-cookie')).toBeNull();
  });

  it('POST do próprio site soma 1', async () => {
    const { env, linha } = ambiente();
    const r = await worker.fetch(post(), env);
    expect(r.status).toBe(200);
    expect((await r.json()).total).toBe(42);
    expect(linha.total).toBe(42);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });

  it('recusa outra origem, pedido entre sites, robô e excesso de pedidos sem somar', async () => {
    const casos = [
      [post({ ...navegador, origin: 'https://golpe.example' }), 403],
      [post({ ...navegador, 'sec-fetch-site': 'cross-site' }), 403],
      [post({ ...navegador, 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }), 403],
      [post({ ...navegador, 'user-agent': 'Mozilla/5.0 HeadlessChrome/140' }), 403],
    ];
    for (const [req, status] of casos) {
      const { env, linha } = ambiente();
      expect((await worker.fetch(req, env)).status).toBe(status);
      expect(linha.total).toBe(41);
    }
    const { env, linha } = ambiente({ limite: false });
    expect((await worker.fetch(post(), env)).status).toBe(429);
    expect(linha.total).toBe(41);
  });

  it('banco fora do ar vira 503 em JSON; outro método, 405; outro caminho, 404', async () => {
    expect((await worker.fetch(new Request(URL_API), ambiente({ falhar: true }).env)).status).toBe(503);
    expect((await worker.fetch(new Request(URL_API, { method: 'DELETE' }), ambiente().env)).status).toBe(405);
    expect((await worker.fetch(new Request('https://www.cyberjus.org/api/contador/x'), ambiente().env)).status).toBe(404);
  });
});
