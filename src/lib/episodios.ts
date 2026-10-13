import { getCollection, type CollectionEntry } from 'astro:content';

export type Episodio = CollectionEntry<'episodios'>;

/** Todos os episódios: primeiro os que já têm áudio, cada grupo do mais recente para o mais antigo. */
export async function listarEpisodios(): Promise<Episodio[]> {
  const todos = await getCollection('episodios');
  return todos.sort((a, b) => Number(!!b.data.audio) - Number(!!a.data.audio) || b.data.data.localeCompare(a.data.data));
}

/** Episódios parecidos: mesma categoria vale mais que mesma ameaça, que vale mais que tag em comum. */
export function recomendados(atual: Episodio, todos: Episodio[], limite = 3): Episodio[] {
  const pontos = (e: Episodio) =>
    (e.data.categoria === atual.data.categoria ? 3 : 0) +
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

export const urlEpisodio = (e: Episodio) => `/episodios/${e.id}/`;

export const rotuloEpisodio = (e: Episodio) => (e.data.numero ? `EP ${String(e.data.numero).padStart(2, '0')}` : 'ESPECIAL');

export type Grupo = 'fraude' | 'dados' | 'corrupcao' | 'protecao';

/** Grupo usado pelo filtro da página /episodios/ (derivado da categoria). */
export function grupoDoEpisodio(e: Episodio): Grupo {
  const c = e.data.categoria.toLowerCase();
  if (c.includes('fraude')) return 'fraude';
  if (c.includes('dados')) return 'dados';
  if (c.includes('corrup')) return 'corrupcao';
  return 'protecao';
}
