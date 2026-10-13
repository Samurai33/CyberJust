// Feed RSS do podcast: RSS 2.0 + namespaces da Apple (itunes) e do Podcasting 2.0 (podcast).
// Requisitos: https://podcasters.apple.com/support/823-podcast-requirements
//             https://podcasting2.org/docs/podcast-namespace
import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { dataCompleta, infoAudio, listarEpisodios, urlEpisodio } from '../lib/episodios';
import { APRESENTADOR, N3XUS, SITE } from '../data/site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** podcast:guid = UUIDv5 da URL do feed sem protocolo (namespace definido pelo Podcasting 2.0). */
function guidDoFeed(url: string): string {
  const ns = Buffer.from('ead4c236bf5858c6a2c6a6b28d128cb6', 'hex');
  const h = createHash('sha1').update(Buffer.concat([ns, Buffer.from(url.replace(/^https?:\/\//, '').replace(/\/$/, ''))])).digest();
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

/** Data de publicação em RFC 2822. Só o ano conhecido: 1º de janeiro, ao meio-dia de Brasília. */
const rfc2822 = (d: string) => new Date(`${dataCompleta(d) ?? `${d.slice(0, 4)}-01-01`}T12:00:00-03:00`).toUTCString();

export const GET: APIRoute = async ({ site }) => {
  const base = site!.href.replace(/\/$/, '');
  const feed = `${base}/podcast.xml`;
  const eps = (await listarEpisodios()).filter((e) => e.data.audio && e.data.data);
  const pessoa = `<podcast:person role="host" href="${base}/sobre/" img="${base}/icon-512.png">${esc(APRESENTADOR.nome)}</podcast:person>`;

  const itens = eps
    .map((e) => {
      const d = e.data;
      const a = infoAudio(e)!;
      const url = `${base}${urlEpisodio(e)}`;
      return `    <item>
      <title>${esc(d.titulo)}</title>
      <link>${url}</link>
      <guid isPermaLink="false">cyberjus:${e.id}</guid>
      <pubDate>${rfc2822(d.data!)}</pubDate>
      <description>${esc(d.resumo)}</description>
      <itunes:summary>${esc(d.resumo)}</itunes:summary>
      <enclosure url="${base}${d.audio}" length="${a.bytes}" type="audio/x-m4a" />
      <itunes:duration>${Math.round(a.segundos)}</itunes:duration>
      ${d.numero ? `<itunes:episode>${d.numero}</itunes:episode>` : ''}
      <itunes:episodeType>${d.numero ? 'full' : 'bonus'}</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
      ${d.transcricao ? `<podcast:transcript url="${base}${d.transcricao}" type="text/vtt" language="pt-BR" />` : ''}
      ${d.capitulos.length ? `<podcast:chapters url="${url}capitulos.json" type="application/json+chapters" />` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(SITE.nome)}</title>
    <link>${base}/</link>
    <atom:link href="${feed}" rel="self" type="application/rss+xml" />
    <language>pt-br</language>
    <copyright>© ${new Date().getFullYear()} ${esc(N3XUS.razao)}</copyright>
    <description>${esc(SITE.descricao)}</description>
    <itunes:summary>${esc(SITE.descricao)}</itunes:summary>
    <itunes:author>${esc(APRESENTADOR.nome)}</itunes:author>
    <itunes:owner><itunes:name>${esc(N3XUS.marca)}</itunes:name><itunes:email>${N3XUS.email}</itunes:email></itunes:owner>
    <itunes:image href="${base}/capa-podcast-v1.jpg" />
    <image><url>${base}/capa-podcast-v1.jpg</url><title>${esc(SITE.nome)}</title><link>${base}/</link></image>
    <itunes:category text="Technology" />
    <itunes:category text="True Crime" />
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <podcast:guid>${guidDoFeed(feed)}</podcast:guid>
    <podcast:locked owner="${N3XUS.email}">yes</podcast:locked>
    ${pessoa}
${itens}
  </channel>
</rss>
`;
  return new Response(xml.replace(/\n\s*\n/g, '\n'), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
