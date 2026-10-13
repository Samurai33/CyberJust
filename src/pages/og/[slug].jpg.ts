// Gera no build a prévia de link de cada episódio (satori → SVG, resvg → PNG, sharp → JPEG).
// Visual: o mesmo da arte geral (design/og.html), com o título do episódio.
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { listarEpisodios, type Episodio } from '../../lib/episodios';
import { dadosOg, urlOg } from '../../lib/og';

export const getStaticPaths = (async () => {
  const eps = await listarEpisodios();
  return eps.map((ep) => ({ params: { slug: urlOg(ep).replace(/^\/og\/|\.jpg$/g, '') }, props: { ep } }));
}) satisfies GetStaticPaths;

const fonte = (pacote: string, arquivo: string) => readFileSync(join(process.cwd(), 'node_modules/@fontsource', pacote, 'files', arquivo));
const FONTES = [
  { name: 'SG', data: fonte('space-grotesk', 'space-grotesk-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'IN', data: fonte('inter', 'inter-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'JB', data: fonte('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
];
const COR_AMEACA = { CRÍTICO: '#ff6b81', ALTO: '#ff9f5a', MÉDIO: '#fbbf24', BAIXO: '#3ddc97' } as const;
const FEMININO = { CRÍTICO: 'crítica', ALTO: 'alta', MÉDIO: 'média', BAIXO: 'baixa' } as const;
const ESCUDO =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="#5cc8ff" stroke-linecap="round" stroke-linejoin="round"><path d="M16 2.5 27 6.8v8.6c0 6.6-4.5 12-11 14.1C9.5 27.4 5 22 5 15.4V6.8z" stroke-width="2"/><path d="M16 9v13M11 22h10M10.5 11.5h11M10.5 11.5 8 17h5zM21.5 11.5 19 17h5z" stroke-width="1.6"/></svg>',
  ).toString('base64');

type No = { type: string; props: Record<string, unknown> };
// O satori exige display explícito em div com mais de um filho: flex é o padrão aqui.
const h = (type: string, style: Record<string, unknown>, ...children: (No | string)[]): No => ({
  type,
  props: { style: type === 'div' ? { display: 'flex', ...style } : style, children: children.length === 1 ? children[0] : children },
});

function arte(ep: Episodio): No {
  const o = dadosOg(ep);
  const cor = COR_AMEACA[o.ameaca];
  const tamanho = o.titulo.length > 62 ? 60 : o.titulo.length > 40 ? 68 : 76;
  return h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      padding: '64px 80px',
      backgroundColor: '#05070c',
      backgroundImage:
        'radial-gradient(circle at 85% 40%, rgba(92,200,255,0.16), rgba(5,7,12,0) 45%), radial-gradient(circle at 0% 0%, rgba(139,124,255,0.14), rgba(5,7,12,0) 40%)',
      color: '#f3f6fb',
      fontFamily: 'IN',
    },
    h(
      'div',
      { display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'SG', fontSize: 30, letterSpacing: -0.9 },
      { type: 'img', props: { src: ESCUDO, width: 40, height: 40 } },
      h('div', { display: 'flex' }, 'CyberJustiça', h('span', { color: '#8492a8', marginLeft: 8 }, 'Brasil')),
    ),
    h(
      'div',
      { display: 'flex', alignItems: 'center', gap: 16, marginTop: 56, fontFamily: 'JB', fontSize: 22, color: '#a3afc2' },
      h('span', { color: '#5cc8ff' }, o.rotulo),
      h('span', {}, '·'),
      h('span', {}, o.tema),
    ),
    h('div', { display: 'flex', marginTop: 22, fontFamily: 'SG', fontSize: tamanho, lineHeight: 1.04, letterSpacing: -2.6, maxWidth: 1040 }, o.titulo),
    h(
      'div',
      { display: 'flex', alignItems: 'center', gap: 20, marginTop: 'auto', fontFamily: 'JB', fontSize: 21, color: '#8492a8' },
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 999, border: `1px solid ${cor}66`, color: cor, backgroundColor: `${cor}1a` },
        h('div', { width: 10, height: 10, borderRadius: 999, backgroundColor: cor }),
        `Ameaça ${FEMININO[o.ameaca]}`,
      ),
      h('span', {}, `Podcast · ${o.duracao}`),
      h('span', { marginLeft: 'auto', color: '#a3afc2' }, 'cyberjus.org'),
    ),
  );
}

export const GET: APIRoute<{ ep: Episodio }> = async ({ props }) => {
  const svg = await satori(arte(props.ep) as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: FONTES });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  const jpg = await sharp(png).jpeg({ quality: 86, progressive: true, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
