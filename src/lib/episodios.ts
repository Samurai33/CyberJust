import { getCollection, type CollectionEntry } from 'astro:content';
import AUDIOS from '../data/audio.json';
import { TEMAS, type Tema } from '../data/temas';

export type Episodio = CollectionEntry<'episodios'>;

/**
 * Todos os episódios: primeiro os que já têm áudio, cada grupo do mais recente para o mais antigo;
 * os sem data ("em produção") por último.
 */
export async function listarEpisodios(): Promise<Episodio[]> {
  const todos = await getCollection('episodios');
  return todos.sort(
    (a, b) =>
      Number(!!b.data.audio) - Number(!!a.data.audio) || (b.data.data ?? '').localeCompare(a.data.data ?? '') || a.id.localeCompare(b.id),
  );
}

export interface InfoAudio {
  segundos: number;
  bytes: number;
}

/**
 * Duração e tamanho do áudio. O arquivo fica no R2 (worker/audio), não no Git: os dados vêm de
 * src/data/audio.json, gravado por quem envia o áudio (pipeline ou scripts/audio-r2.mjs) depois que o Worker
 * conferiu o faststart. Episódio com áudio fora do manifesto quebra o build.
 */
export function infoAudio(e: Episodio): InfoAudio | undefined {
  const arquivo = e.data.audio;
  if (!arquivo) return undefined;
  const info = (AUDIOS as Record<string, InfoAudio>)[arquivo];
  if (!info) throw new Error(`${e.id}: ${arquivo} não está em src/data/audio.json (envie com scripts/audio-r2.mjs)`);
  return info;
}

/** Episódios parecidos: mesmo tema vale mais que mesma ameaça, que vale mais que tag em comum. */
export function recomendados(atual: Episodio, todos: Episodio[], limite = 3): Episodio[] {
  const pontos = (e: Episodio) =>
    (e.data.tema === atual.data.tema ? 3 : 0) +
    (e.data.ameaca === atual.data.ameaca ? 2 : 0) +
    (e.data.tags.some((t) => atual.data.tags.includes(t)) ? 1 : 0) +
    (e.data.audio ? 0.5 : 0);
  return todos
    .filter((e) => e.id !== atual.id)
    .map((e) => ({ e, p: pontos(e) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, limite)
    .map(({ e }) => e);
}

/** Vizinhos na ordem cronológica de publicação (só episódios com áudio), para "anterior/próximo". */
export function vizinhos(atual: Episodio, todos: Episodio[]): { anterior: Episodio | undefined; proximo: Episodio | undefined } {
  const lista = todos.filter((e) => e.data.audio && e.data.data).sort((a, b) => a.data.data!.localeCompare(b.data.data!));
  const i = lista.findIndex((e) => e.id === atual.id);
  if (i === -1) return { anterior: undefined, proximo: undefined };
  return { anterior: lista[i - 1], proximo: lista[i + 1] };
}

export const urlEpisodio = (e: Episodio) => `/episodios/${e.id}/`;
export const urlTema = (t: Tema) => `/temas/${t}/`;
export const nomeTema = (t: Tema) => TEMAS[t].nome;

export const rotuloEpisodio = (e: Episodio) => (e.data.numero ? `EP ${String(e.data.numero).padStart(2, '0')}` : 'ESPECIAL');

/** Data completa (AAAA-MM-DD) para JSON-LD/feed; undefined quando só o ano é conhecido. */
export const dataCompleta = (d?: string) => (d && d.length === 10 ? d : undefined);
