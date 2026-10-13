// Capítulos no formato JSON do Podcasting 2.0 (https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/examples/chapters/jsonChapters.md).
import type { APIRoute, GetStaticPaths } from 'astro';
import { listarEpisodios, type Episodio } from '../../../lib/episodios';
import { paraSegundos } from '../../../lib/tempo';

export const getStaticPaths = (async () =>
  (await listarEpisodios()).filter((e) => e.data.capitulos.length > 0).map((ep) => ({ params: { id: ep.id }, props: { ep } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ ep: Episodio }> = ({ props }) =>
  new Response(
    JSON.stringify({ version: '1.2.0', chapters: props.ep.data.capitulos.map((c) => ({ startTime: paraSegundos(c.inicio), title: c.titulo })) }),
    { headers: { 'Content-Type': 'application/json+chapters' } },
  );
