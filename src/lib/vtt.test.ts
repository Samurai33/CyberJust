import { describe, expect, it } from 'vitest';
import { lerVtt } from './vtt';
import { paraSegundos } from './tempo';

describe('lerVtt', () => {
  it('agrupa falas consecutivas do mesmo locutor e limpa as tags', () => {
    const vtt = `WEBVTT

NOTE comentário

00:00.000 --> 00:04.000
<v Samurai>Bem-vindos ao <b>CyberJustiça</b>.

00:04.000 --> 00:07.500
<v Samurai>Hoje: fraudes &amp; golpes.

01:02:05.000 --> 01:02:09.000
<v Convidado>Obrigado.`;
    expect(lerVtt(vtt)).toEqual([
      { inicio: '0:00', segundos: 0, locutor: 'Samurai', texto: 'Bem-vindos ao CyberJustiça. Hoje: fraudes & golpes.' },
      { inicio: '1:02:05', segundos: 3725, locutor: 'Convidado', texto: 'Obrigado.' },
    ]);
  });
  it('recusa arquivo sem cabeçalho', () => expect(() => lerVtt('00:00.000 --> 00:01.000\noi')).toThrow(/WEBVTT/));
});

describe('paraSegundos', () => {
  it('converte mm:ss e h:mm:ss', () => {
    expect(paraSegundos('6:29')).toBe(389);
    expect(paraSegundos('1:02:05')).toBe(3725);
  });
});
