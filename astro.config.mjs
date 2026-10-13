// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// lastmod só onde a data é confiável (data completa no episódio: "atualizado" ou "data").
// Data do build em todas as páginas seria imprecisa, e o Google ignora lastmod que não reflete mudança real.
const EPS = './src/content/episodios';
const lastmod = new Map();
for (const f of readdirSync(EPS).filter((x) => x.endsWith('.md'))) {
  const fm = readFileSync(`${EPS}/${f}`, 'utf8').split('---')[1] ?? '';
  const d = (fm.match(/^atualizado:\s*"?(\d{4}-\d{2}-\d{2})/m) ?? fm.match(/^data:\s*"?(\d{4}-\d{2}-\d{2})/m))?.[1];
  if (d) lastmod.set(`/episodios/${f.replace(/\.md$/, '')}/`, d);
}

// Site 100% estático: `astro build` gera HTML/CSS/JS em dist/, servido pelo nginx (docker/nginx.conf).
// A CSP é enviada pelo nginx (sem 'unsafe-inline'); por isso nada pode virar inline no HTML.
export default defineConfig({
  site: 'https://www.cyberjus.org',
  trailingSlash: 'always',
  // O padrão do Astro 7 ('jsx') remove o espaço entre texto e link quando há quebra de linha no fonte
  // ("pela\n<a>Lei" vira "pelaLei"). true mantém um espaço, como o HTML normal.
  compressHTML: true,
  build: {
    format: 'directory',
    // CSS sempre em arquivo: permite a CSP style-src 'self'.
    inlineStylesheets: 'never',
  },
  // O <ClientRouter /> já faz prefetch ao passar o mouse/tocar nos links.
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  vite: {
    build: {
      // Nunca embutir arquivos como data: nem scripts inline (a CSP bloqueia os dois).
      assetsInlineLimit: 0,
      // Os únicos pacotes acima de 500 kB são do Sveltia CMS (painel /dash-*/), que o site público não carrega.
      chunkSizeWarningLimit: 2500,
    },
  },
  integrations: [
    sitemap({
      // Fora do sitemap: 404 e o painel (caminho /dash-*/, protegido e noindex).
      filter: (page) => !page.endsWith('/404/') && !/\/dash-[0-9a-f]+\//.test(page),
      serialize(item) {
        const d = lastmod.get(new URL(item.url).pathname);
        return d ? { ...item, lastmod: new Date(`${d}T12:00:00-03:00`).toISOString() } : item;
      },
      i18n: { defaultLocale: 'pt-BR', locales: { 'pt-BR': 'pt-BR' } },
    }),
  ],
});
