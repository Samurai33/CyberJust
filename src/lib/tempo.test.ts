import { describe, expect, it } from 'vitest';
import { duracaoIso, formatarData, formatarTempo, posicaoParaRetomar, proximaVelocidade, tempoPorExtenso, VELOCIDADES } from './tempo';

describe('formatarTempo', () => {
  it.each([
    [0, '0:00'],
    [9.9, '0:09'],
    [389.6, '6:29'],
    [3725, '1:02:05'],
    [Number.NaN, '0:00'],
    [Number.POSITIVE_INFINITY, '0:00'],
    [-5, '0:00'],
  ])('%s → %s', (s, esperado) => expect(formatarTempo(s)).toBe(esperado));
});

describe('tempoPorExtenso', () => {
  it('usa singular e plural', () => {
    expect(tempoPorExtenso(61)).toBe('1 minuto e 1 segundo');
    expect(tempoPorExtenso(389.6)).toBe('6 minutos e 29 segundos');
    expect(tempoPorExtenso(3600)).toBe('1 hora');
    expect(tempoPorExtenso(7322)).toBe('2 horas, 2 minutos e 2 segundos');
    expect(tempoPorExtenso(0)).toBe('0 segundos');
  });
});

describe('duracaoIso', () => {
  it.each([
    [389.6, 'PT6M29S'],
    [3600, 'PT1H'],
    [3725, 'PT1H2M5S'],
    [0, 'PT0S'],
  ])('%s → %s', (s, esperado) => expect(duracaoIso(s)).toBe(esperado));
});

describe('proximaVelocidade', () => {
  it('percorre a lista e volta ao início', () => {
    let v = 1;
    const vistas = [];
    for (let i = 0; i < VELOCIDADES.length; i++) vistas.push((v = proximaVelocidade(v)));
    expect(vistas).toEqual([1.25, 1.5, 1.75, 2, 0.75, 1]);
  });
  it('valor desconhecido recomeça da primeira', () => expect(proximaVelocidade(3)).toBe(1));
});

describe('posicaoParaRetomar', () => {
  it('ignora o começo e o fim do episódio', () => {
    expect(posicaoParaRetomar(5, 400)).toBe(0);
    expect(posicaoParaRetomar(200, 400)).toBe(200);
    expect(posicaoParaRetomar(390, 400)).toBe(0);
    expect(posicaoParaRetomar(Number.NaN, 400)).toBe(0);
    expect(posicaoParaRetomar(200, Number.NaN)).toBe(200);
  });
});

describe('formatarData', () => {
  it('formata data completa e só ano', () => {
    expect(formatarData('2024-01-15')).toBe('15 jan. 2024');
    expect(formatarData('2023')).toBe('2023');
  });
});
