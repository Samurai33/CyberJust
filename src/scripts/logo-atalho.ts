// Atalho do dono (mesmo padrão do SOC do n3xus.dev): 3 cliques/toques rápidos no logo abrem o painel.
// Conveniência, não segurança: o painel exige Cloudflare Access e login no GitHub.
//
// - Ouvinte na fase de CAPTURA: roda antes do <ClientRouter /> (que também escuta cliques no documento),
//   então o roteador vê o preventDefault e não navega sozinho no primeiro clique.
// - Clique simples: espera ~350 ms para contar os cliques e navega pelo roteador (o áudio continua tocando).
// - Teclado (Enter, detail 0) e cliques com modificador seguem o comportamento normal do link.
import { navigate } from 'astro:transitions/client';
import { DASH_PATH } from '../data/dash';

let n = 0;
let timer = 0;
document.addEventListener(
  'click',
  (e) => {
    const logo = (e.target as Element).closest<HTMLAnchorElement>('.site-header .logo');
    if (!logo || e.detail === 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    clearTimeout(timer);
    n += 1;
    if (n >= 3) {
      n = 0;
      location.assign(DASH_PATH); // navegação completa: o painel é outro app (sem o roteador do site)
      return;
    }
    timer = window.setTimeout(() => {
      n = 0;
      void navigate(logo.href);
    }, 350);
  },
  { capture: true },
);
