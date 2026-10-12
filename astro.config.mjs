// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Site 100% estático: `astro build` gera HTML/CSS/JS em dist/, servido pelo nginx (docker/nginx.conf).
// A CSP é enviada pelo nginx (sem 'unsafe-inline'); por isso nada pode virar inline no HTML.
export default defineConfig({
  site: 'https://www.cyberjus.org',
  trailingSlash: 'always',
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
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/'),
      i18n: { defaultLocale: 'pt-BR', locales: { 'pt-BR': 'pt-BR' } },
    }),
  ],
});
