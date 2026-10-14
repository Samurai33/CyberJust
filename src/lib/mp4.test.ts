import { describe, expect, it } from 'vitest';
import { closeSync, openSync, readdirSync, statSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lerInfoAudio } from './mp4';

describe('lerInfoAudio', () => {
  it('lê duração e tamanho de todos os áudios publicados', () => {
    // Os episódios entram e saem pelo pipeline: o teste confere cada arquivo em vez de valores fixos.
    const arquivos = readdirSync('public/audio').filter((a) => a.endsWith('.m4a'));
    expect(arquivos.length).toBeGreaterThan(0);
    for (const a of arquivos) {
      const info = lerInfoAudio(`public/audio/${a}`);
      expect(info.bytes, a).toBe(statSync(`public/audio/${a}`).size);
      expect(info.segundos, a).toBeGreaterThan(60);
      expect(info.segundos, a).toBeLessThan(2 * 3600);
    }
  });

  it('recusa MP4 com o índice no fim (sem faststart)', () => {
    const caixa = (tipo: string, corpo = Buffer.alloc(0)) => {
      const h = Buffer.alloc(8);
      h.writeUInt32BE(8 + corpo.length, 0);
      h.write(tipo, 4, 'latin1');
      return Buffer.concat([h, corpo]);
    };
    const arq = join(tmpdir(), 'sem-faststart.m4a');
    const fd = openSync(arq, 'w');
    writeSync(fd, Buffer.concat([caixa('ftyp', Buffer.alloc(8)), caixa('mdat', Buffer.alloc(16)), caixa('moov')]));
    closeSync(fd);
    expect(() => lerInfoAudio(arq)).toThrow(/faststart/);
  });
});
