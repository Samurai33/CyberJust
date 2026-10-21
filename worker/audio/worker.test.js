import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { infoMp4 } from './mp4.js';
import { intervalo } from './intervalo.js';
import worker from './worker.js';

const caixa = (tipo, corpo = new Uint8Array(0)) => {
  const b = new Uint8Array(8 + corpo.length);
  new DataView(b.buffer).setUint32(0, b.length);
  b.set(new TextEncoder().encode(tipo), 4);
  b.set(corpo, 8);
  return b;
};
const juntar = (...partes) => {
  const b = new Uint8Array(partes.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const p of partes) b.set(p, (i += p.length) - p.length);
  return b;
};
// mvhd versão 0: escala 1000, duração 392000 (392 s)
const mvhd = () => {
  const c = new Uint8Array(100);
  const v = new DataView(c.buffer);
  v.setUint32(12, 1000);
  v.setUint32(16, 392000);
  return caixa('mvhd', c);
};
const BOM = juntar(caixa('ftyp', new Uint8Array(8)), caixa('moov', mvhd()), caixa('mdat', new Uint8Array(4000).fill(7)));
const SEM_FASTSTART = juntar(caixa('ftyp', new Uint8Array(8)), caixa('mdat', new Uint8Array(16)), caixa('moov', mvhd()));
const sha8 = (b) => createHash('sha256').update(b).digest('hex').slice(0, 8);

describe('infoMp4', () => {
  it('lê duração e tamanho', () => {
    expect(infoMp4(BOM)).toEqual({ segundos: 392, bytes: BOM.length });
  });
  it('recusa MP4 com o índice no fim (sem faststart)', () => {
    expect(() => infoMp4(SEM_FASTSTART)).toThrow(/faststart/);
  });
  it('recusa o que não é MP4', () => {
    expect(() => infoMp4(new TextEncoder().encode('<html>não é áudio</html>'))).toThrow(/não é um MP4/);
  });
});

// R2 de mentira com a semântica que o Worker usa: get com range/onlyIf, head e put.
function r2() {
  const objetos = new Map();
  const meta = (k, o) => ({
    key: k,
    size: o.bytes.length,
    httpEtag: `"${o.sha}"`,
    customMetadata: o.customMetadata,
    writeHttpMetadata: (h) => h.set('cache-control', o.httpMetadata.cacheControl),
  });
  return {
    objetos,
    async head(k) {
      const o = objetos.get(k);
      return o ? meta(k, o) : null;
    },
    async put(k, bytes, op) {
      objetos.set(k, { bytes, sha: op.sha256, ...op });
    },
    async get(k, { range, onlyIf }) {
      const o = objetos.get(k);
      if (!o) return null;
      const m = meta(k, o);
      if (onlyIf.get('if-none-match') === m.httpEtag) return m;
      const pedido = range.get('range');
      if (!pedido) return { ...m, body: o.bytes };
      const [, a, b] = /^bytes=(\d*)-(\d*)$/.exec(pedido);
      // o formato do range que o R2 real devolve não é confiável: o Worker calcula pelo cabeçalho
      if (a === '') return { ...m, range: { formato: 'desconhecido' }, body: o.bytes.slice(-Number(b)) };
      const inicio = Number(a);
      if (inicio >= o.bytes.length) throw new RangeError('fora do arquivo');
      const fim = b === '' ? o.bytes.length - 1 : Math.min(Number(b), o.bytes.length - 1);
      return { ...m, range: { formato: 'desconhecido' }, body: o.bytes.slice(inicio, fim + 1) };
    },
  };
}

const BASE = 'https://www.cyberjus.org';
const NOME = `/audio/falso-advogado-ceara-${sha8(BOM)}.m4a`;
const env = () => ({ AUDIO: r2(), ENVIO: 'segredo-de-teste' });
const enviar = (e, corpo = BOM, nome = NOME, token = 'segredo-de-teste') =>
  worker.fetch(
    new Request(BASE + nome, {
      method: 'PUT',
      body: corpo,
      headers: { authorization: `Bearer ${token}`, 'content-length': String(corpo.length) },
    }),
    e,
  );

describe('intervalo (Range)', () => {
  it('início-fim, aberto, sufixo e inválidos', () => {
    expect(intervalo('bytes=0-15', 100)).toEqual({ inicio: 0, fim: 15 });
    expect(intervalo('bytes=90-', 100)).toEqual({ inicio: 90, fim: 99 });
    expect(intervalo('bytes=95-500', 100)).toEqual({ inicio: 95, fim: 99 });
    expect(intervalo('bytes=-10', 100)).toEqual({ inicio: 90, fim: 99 });
    expect(intervalo('bytes=-500', 100)).toEqual({ inicio: 0, fim: 99 });
    expect(intervalo(null, 100)).toBeNull();
    expect(intervalo('bytes=0-1,5-6', 100)).toBeNull();
  });
});

describe('Worker do áudio', () => {
  it('envio: valida, grava e devolve os dados do manifesto', async () => {
    const e = env();
    const r = await enviar(e);
    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({ caminho: NOME, bytes: BOM.length, segundos: 392 });
    expect(e.AUDIO.objetos.get(NOME.slice(1)).httpMetadata.cacheControl).toContain('immutable');
    // reenviar o mesmo arquivo é idempotente (o pipeline tenta de novo quando o push falha)
    expect((await enviar(e)).status).toBe(200);
  });

  it('envio: recusa sem token, sem faststart, hash que não bate e nome fora do padrão', async () => {
    const e = env();
    expect((await enviar(e, BOM, NOME, 'errado')).status).toBe(401);
    expect((await enviar({ AUDIO: r2() }, BOM, NOME, '')).status).toBe(401);
    const semFs = `/audio/x-${sha8(SEM_FASTSTART)}.m4a`;
    const r = await enviar(e, SEM_FASTSTART, semFs);
    expect(r.status).toBe(422);
    expect((await r.json()).erro).toMatch(/faststart/);
    expect((await enviar(e, BOM, '/audio/falso-advogado-ceara-00000000.m4a')).status).toBe(422);
    expect((await enviar(e, BOM, '/audio/Maiuscula-00000000.m4a')).status).toBe(404);
    expect(e.AUDIO.objetos.size).toBe(0);
  });

  it('envio: conteúdo diferente com o mesmo nome não sobrescreve', async () => {
    const e = env();
    await enviar(e);
    e.AUDIO.objetos.get(NOME.slice(1)).customMetadata.sha256 = 'outro';
    expect((await enviar(e)).status).toBe(409);
  });

  it('GET inteiro: 200 com tipo, cache imutável, CORS e CORP cross-origin', async () => {
    const e = env();
    await enviar(e);
    const r = await worker.fetch(new Request(BASE + NOME), e);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('audio/mp4');
    expect(r.headers.get('content-length')).toBe(String(BOM.length));
    expect(r.headers.get('accept-ranges')).toBe('bytes');
    expect(r.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(r.headers.get('access-control-allow-origin')).toBe('*');
    expect(r.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(BOM);
  });

  it('Range: 206 com Content-Range, inclusive sufixo e intervalo aberto', async () => {
    const e = env();
    await enviar(e);
    const pedir = (range) => worker.fetch(new Request(BASE + NOME, { headers: { range } }), e);
    let r = await pedir('bytes=0-15');
    expect(r.status).toBe(206);
    expect(r.headers.get('content-range')).toBe(`bytes 0-15/${BOM.length}`);
    expect(r.headers.get('content-length')).toBe('16');
    expect(new TextDecoder().decode((await r.arrayBuffer()).slice(4, 8))).toBe('ftyp');
    r = await pedir('bytes=100-');
    expect(r.headers.get('content-range')).toBe(`bytes 100-${BOM.length - 1}/${BOM.length}`);
    r = await pedir('bytes=-10');
    expect(r.headers.get('content-range')).toBe(`bytes ${BOM.length - 10}-${BOM.length - 1}/${BOM.length}`);
    r = await pedir(`bytes=${BOM.length + 5}-`);
    expect(r.status).toBe(416);
    expect(r.headers.get('content-range')).toBe(`bytes */${BOM.length}`);
  });

  it('If-None-Match: 304; HEAD sem corpo; inexistente 404; OPTIONS para CORS', async () => {
    const e = env();
    await enviar(e);
    const etag = (await worker.fetch(new Request(BASE + NOME), e)).headers.get('etag');
    expect((await worker.fetch(new Request(BASE + NOME, { headers: { 'if-none-match': etag } }), e)).status).toBe(304);
    const h = await worker.fetch(new Request(BASE + NOME, { method: 'HEAD' }), e);
    expect(h.status).toBe(200);
    expect(h.headers.get('content-length')).toBe(String(BOM.length));
    expect(h.body).toBeNull();
    expect((await worker.fetch(new Request(`${BASE}/audio/nao-existe-12345678.m4a`), e)).status).toBe(404);
    const o = await worker.fetch(new Request(BASE + NOME, { method: 'OPTIONS' }), e);
    expect(o.status).toBe(204);
    expect(o.headers.get('access-control-allow-headers')).toContain('Range');
    expect((await worker.fetch(new Request(BASE + NOME, { method: 'DELETE' }), e)).status).toBe(405);
  });
});
