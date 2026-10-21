#!/usr/bin/env node
// Envia áudio para o R2 (pelo Worker worker/audio) e registra duração e tamanho em src/data/audio.json, que é
// de onde o build lê esses dados (o áudio não fica mais no Git). O pipeline faz o mesmo em podcast/pipeline/episodio.py.
//
//   AUDIO_ENVIO=... node scripts/audio-r2.mjs <slug>-<sha256[:8]>.m4a ...
//   node scripts/audio-r2.mjs --so-manifesto arquivo.m4a ...      só confere e grava o manifesto, sem enviar
//   --base https://cyberjus-audio.<conta>.workers.dev                antes da rota existir (publicar.sh teste)
//
// Antes de enviar confere o faststart e se o nome bate com o SHA-256 do conteúdo (arquivo publicado nunca muda).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { infoMp4 } from '../worker/audio/mp4.js';

const MANIFESTO = join(import.meta.dirname, '..', 'src', 'data', 'audio.json');
const NOME = /^[a-z0-9-]+-([0-9a-f]{8})\.m4a$/;

const args = process.argv.slice(2);
const so = args.includes('--so-manifesto');
const iBase = args.indexOf('--base');
const base = (iBase !== -1 ? args[iBase + 1] : 'https://www.cyberjus.org').replace(/\/$/, '');
const arquivos = args.filter((a, i) => !a.startsWith('--') && i !== iBase + 1);
if (!arquivos.length) {
  console.error('uso: node scripts/audio-r2.mjs [--so-manifesto] [--base URL] arquivo.m4a ...');
  process.exit(2);
}
const token = process.env.AUDIO_ENVIO;
if (!so && !token) {
  console.error('defina AUDIO_ENVIO (o segredo ENVIO do Worker)');
  process.exit(2);
}

const manifesto = JSON.parse(readFileSync(MANIFESTO, 'utf8'));
for (const arq of arquivos) {
  const nome = basename(arq);
  const bytes = readFileSync(arq);
  const sha = createHash('sha256').update(bytes).digest('hex');
  const m = NOME.exec(nome);
  if (!m || !sha.startsWith(m[1])) throw new Error(`${nome}: o nome precisa ser <slug>-${sha.slice(0, 8)}.m4a`);
  let info = infoMp4(bytes);
  if (!so) {
    const r = await fetch(`${base}/audio/${nome}`, {
      method: 'PUT',
      body: bytes,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'audio/mp4', 'user-agent': 'cyberjust-audio-r2/1' },
    });
    const corpo = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${nome}: envio recusado (${r.status}) ${corpo.erro ?? ''}`);
    const h = await fetch(`${base}/audio/${nome}`, { method: 'HEAD' });
    if (h.status !== 200 || h.headers.get('content-length') !== String(bytes.length)) {
      throw new Error(`${nome}: depois do envio o HEAD deu ${h.status}, ${h.headers.get('content-length')} bytes`);
    }
    info = { segundos: corpo.segundos, bytes: corpo.bytes };
    console.log(`${r.status === 201 ? 'enviado' : 'já estava lá'}: ${nome} (${(bytes.length / 1048576).toFixed(1)} MB, ${info.segundos} s)`);
  }
  manifesto[`/audio/${nome}`] = info;
}
const ordenado = Object.fromEntries(Object.entries(manifesto).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(MANIFESTO, JSON.stringify(ordenado, null, 2) + '\n');
console.log(`manifesto: ${Object.keys(ordenado).length} áudio(s) em src/data/audio.json`);
