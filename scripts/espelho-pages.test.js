import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { expandirRegex, gerarHeaders, gerarRedirects, lerHeaders } from './espelho-pages.mjs';

const conf = readFileSync(new URL('../docker/nginx.conf', import.meta.url), 'utf8');
const comuns = lerHeaders(readFileSync(new URL('../docker/security-headers.conf', import.meta.url), 'utf8'));
const publicos = lerHeaders(readFileSync(new URL('../docker/security-headers-public.conf', import.meta.url), 'utf8'));

describe('espelho do Pages', () => {
  test('expande a regex do nginx com e sem barra', () => {
    expect(expandirRegex('^/(a|b)/(1|2)/?$')).toEqual(['/a/1', '/a/1/', '/a/2', '/a/2/', '/b/1', '/b/1/', '/b/2', '/b/2/']);
    expect(() => expandirRegex('^/x/.*$')).toThrow();
  });

  test('tem os mesmos 301 do nginx (lista do e2e/servidor.spec.ts)', () => {
    const r = gerarRedirects(conf);
    for (const de of ['/episodes', '/episodes/7', '/episodes/6', '/episodes/ESPECIAL', '/episodios/7', '/episodio/6', '/episodios/caso-lulu/', '/episodios/namoral', '/episodios/fraudes-digitais/']) {
      expect(r).toContain(`${de} /episodios/ 301`);
    }
    expect(r).toContain('/sitemap.xml /sitemap-index.xml 301');
  });

  test('headers: CSP do nginx no HTML, CORP cross-origin e áudio sem CSP', () => {
    const h = gerarHeaders(conf, comuns, publicos);
    const csp = conf.match(/set \$csp "([^"]*)"/)?.[1];
    expect(h).toContain(`Content-Security-Policy: ${csp}`);
    expect(h).toContain('Strict-Transport-Security: max-age=63072000; includeSubDomains');
    const audio = h.split('\n\n').find((b) => b.startsWith('/audio/*')) ?? '';
    expect(audio).toContain('! Content-Security-Policy');
    expect(audio).toContain('Cross-Origin-Resource-Policy: cross-origin');
    expect(audio).toContain('Content-Type: audio/mp4');
    expect(audio).toContain('Cache-Control: public, max-age=31536000, immutable');
    expect(h).toContain('https://:project.pages.dev/*\n  X-Robots-Tag: noindex');
  });
});
