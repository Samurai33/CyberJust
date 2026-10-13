// Funções puras de tempo/formatação usadas pelo player e pelas páginas (testadas em tempo.test.ts).

/** 389.6 → "6:29"; 3725 → "1:02:05". Valores inválidos viram "0:00". */
export function formatarTempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00';
  const total = Math.floor(segundos);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Texto para leitores de tela: 389.6 → "6 minutos e 29 segundos". */
export function tempoPorExtenso(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '0 segundos';
  const total = Math.floor(segundos);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const partes: string[] = [];
  if (h) partes.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
  if (m) partes.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
  if (s || partes.length === 0) partes.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`);
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}` : partes[0]!;
}

/** Duração ISO 8601 para JSON-LD: 389.6 → "PT6M29S". */
export function duracaoIso(segundos: number): string {
  const total = Math.floor(segundos);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

/** Velocidades oferecidas pelo player, na ordem do botão. */
export const VELOCIDADES = [1, 1.25, 1.5, 1.75, 2, 0.75] as const;

export function proximaVelocidade(atual: number): number {
  const i = VELOCIDADES.indexOf(atual as (typeof VELOCIDADES)[number]);
  return VELOCIDADES[(i + 1) % VELOCIDADES.length]!;
}

/**
 * Posição para continuar de onde parou. Ignora os primeiros 10 s (nada a retomar) e o fim
 * do episódio (quem chegou a 95% terminou: recomeça do zero).
 */
export function posicaoParaRetomar(salva: number, duracao: number): number {
  if (!Number.isFinite(salva) || salva < 10) return 0;
  if (Number.isFinite(duracao) && duracao > 0 && salva >= duracao * 0.95) return 0;
  return salva;
}

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

/** "2024-01-15" → "15 jan. 2024"; "2023" → "2023". */
export function formatarData(data: string): string {
  const [a, m, d] = data.split('-');
  if (!m || !d) return a ?? data;
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
}

/** "1:02:05" → 3725; "6:29" → 389. */
export function paraSegundos(tempo: string): number {
  return tempo.split(':').reduce((total, parte) => total * 60 + Number(parte), 0);
}
