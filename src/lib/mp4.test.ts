import { describe, expect, it } from 'vitest';
import { closeSync, openSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lerInfoAudio } from './mp4';

describe('lerInfoAudio', () => {
  it('lê duração e tamanho dos áudios publicados (valores do ffprobe)', () => {
    expect(lerInfoAudio('public/audio/bfraudes-digitais.m4a')).toEqual({ segundos: 389.6, bytes: 12535498 });
    expect(lerInfoAudio('public/audio/lulu.m4a').segundos).toBe(556.8);
    expect(lerInfoAudio('public/audio/namoral.m4a').segundos).toBe(444);
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
