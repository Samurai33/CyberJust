import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import AUDIOS from './audio.json';

// O áudio fica no R2; o build só vê o manifesto. Os episódios entram e saem pelo pipeline: o teste confere
// cada entrada em vez de valores fixos.
const manifesto = AUDIOS as Record<string, { segundos: number; bytes: number }>;
const pasta = 'src/content/episodios';
const usados = readdirSync(pasta)
  .filter((a) => a.endsWith('.md'))
  .flatMap((a) => [...readFileSync(`${pasta}/${a}`, 'utf8').matchAll(/^audio:\s*"?(\S+?)"?\s*$/gm)].map((m) => [a, m[1]!] as const));

describe('src/data/audio.json', () => {
  it('todo episódio com áudio está no manifesto', () => {
    expect(usados.length).toBeGreaterThan(0);
    for (const [ep, audio] of usados) expect(manifesto[audio], `${ep}: ${audio}`).toBeDefined();
  });

  it('entradas com nome, duração e tamanho plausíveis', () => {
    for (const [caminho, { segundos, bytes }] of Object.entries(manifesto)) {
      expect(caminho).toMatch(/^\/audio\/[a-z0-9-]+-[0-9a-f]{8}\.m4a$/);
      expect(segundos, caminho).toBeGreaterThan(60);
      expect(segundos, caminho).toBeLessThan(2 * 3600);
      expect(bytes, caminho).toBeGreaterThan(100_000);
    }
  });
});
