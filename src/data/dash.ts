// Caminho do painel de episódios (Sveltia CMS). Não é segredo (aparece no JS do atalho):
// a proteção é o Cloudflare Access neste caminho + login no GitHub com token de escopo mínimo.
export const DASH_PATH = '/dash-ac0584219dc1/';
// Estúdio: painel do pipeline de episódios (podcast/pipeline/painel.py), servido pelo contêiner do bot na VM 520 e
// roteado pelo Traefik só neste caminho. Fica dentro de DASH_PATH, então o mesmo app do Access cobre os dois.
export const ESTUDIO_PATH = `${DASH_PATH}estudio/`;
