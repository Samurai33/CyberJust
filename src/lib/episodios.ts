import { getCollection, type CollectionEntry } from 'astro:content';
import { join } from 'node:path';
import { lerInfoAudio, type InfoAudio } from './mp4';
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

const cacheAudio = new Map<string, InfoAudio>();
/** Duração e tamanho do áudio, lidos do arquivo em public/ no build (falha se não servir para streaming). */
export function infoAudio(e: Episodio): InfoAudio | undefined {
  const arquivo = e.data.audio;
  if (!arquivo) return undefined;
  let info = cacheAudio.get(arquivo);
  if (!info) {
    info = lerInfoAudio(join(process.cwd(), 'public', arquivo));
    cacheAudio.set(arquivo, info);
  }
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
