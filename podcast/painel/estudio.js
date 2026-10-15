// Estúdio CyberJustiça: SPA sem build. Tudo vem de api/* (mesma origem, atrás do Cloudflare Access).
// Regras: nada de innerHTML com dado da API (só textContent), estilo só por CSSOM (CSP sem 'unsafe-inline').

const $ = (s, r = document) => r.querySelector(s);
const ESTADOS = {
  roteiro: { nome: 'Roteiro para aprovar', st: 'warn' },
  audio: { nome: 'Áudio para publicar', st: 'warn' },
  publicado: { nome: 'Publicado', st: 'ok' },
  outra_versao: { nome: 'No ar com outro áudio', st: 'man' },
  descartado: { nome: 'Descartado', st: 'off' },
  arquivado: { nome: 'Cópias e testes', st: 'off' },
};
const ETAPAS = [
  ['sugerir', 'Pautas', 'notícias + ranking, grátis'],
  ['produzir', 'Roteiro', 'fontes, ficha, diálogo, revisão'],
  ['aprovar', 'Aprovação', 'você confere o roteiro'],
  ['audio', 'Áudio', 'ElevenLabs, gasta créditos'],
  ['legenda', 'Legenda e QA', 'Whisper, LUFS, tom'],
  ['publicar', 'Publicação', 'commit + deploy Coolify'],
];
const estado = { api: null, eps: [], filtro: 'ativos', ep: null, sub: 'roteiro', ultimaAtividade: '' };

// ---------- utilitários ----------
function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) el.append(f instanceof Node ? f : String(f));
  return el;
}
const icone = (id) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('aria-hidden', 'true');
  const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  u.setAttribute('href', `#i-${id}`);
  s.append(u);
  return s;
};
const st = () => h('i', { class: 'st' });
const num = (n) => (n ?? 0).toLocaleString('pt-BR');
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const quando = (t) => new Date(typeof t === 'number' ? t * 1000 : t);
const hora = (t) => quando(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const data = (t) => quando(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
function relativo(t) {
  const s = (Date.now() - quando(t).getTime()) / 1000;
  if (s < 90) return 'agora';
  if (s < 3600) return `há ${Math.round(s / 60)} min`;
  if (s < 86400) return `há ${Math.round(s / 3600)} h`;
  return `há ${Math.round(s / 86400)} d`;
}

function aviso(texto, tom = 'man') {
  const el = h('p', { class: 'aviso', dataset: { st: tom }, text: texto });
  $('#avisos').append(el);
  setTimeout(() => el.remove(), 7000);
}

async function api(caminho, corpo) {
  const opcoes = corpo === undefined ? {} : {
    method: 'POST', body: JSON.stringify(corpo),
    headers: { 'Content-Type': 'application/json', 'X-Estudio': '1' },
  };
  const r = await fetch(`api/${caminho}`, { credentials: 'same-origin', cache: 'no-store', ...opcoes });
  if (r.status === 403 || r.redirected) {
    aviso('Sessão do Access expirou. Recarregue a página para entrar de novo.', 'crit');
    throw new Error('acesso');
  }
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.erro || `HTTP ${r.status}`);
  return json;
}

// Confirmação em dois toques (padrão do SOC): o 1º arma o botão por 6 s, o 2º executa.
function botaoAcao({ rotulo, icon, classe = '', confirmar, acao }) {
  const b = h('button', { type: 'button', class: `botao ${classe}` }, icon ? icone(icon) : null, h('span', { text: rotulo }));
  let timer;
  b.addEventListener('click', async () => {
    if (confirmar && !b.dataset.armado) {
      b.dataset.armado = '1';
      b.lastElementChild.textContent = confirmar;
      timer = setTimeout(() => { delete b.dataset.armado; b.lastElementChild.textContent = rotulo; }, 6000);
      return;
    }
    clearTimeout(timer);
    delete b.dataset.armado;
    b.lastElementChild.textContent = rotulo;
    b.disabled = true;
    try {
      const r = await acao();
      if (r !== false) aviso('Pedido enviado. Acompanhe na Atividade (e no Telegram).', 'ok');
      await atualizar();
    } catch (e) {
      if (e.message !== 'acesso') aviso(e.message, 'crit');
    } finally {
      b.disabled = false;
    }
  });
  return b;
}

// ---------- navegação (hash) ----------
function rota() {
  const [, sec = '', arg] = location.hash.replace(/^#/, '').split('/');
  const aba = sec === 'episodios' && arg ? 'episodio' : sec || 'geral';
  document.querySelectorAll('[data-sec]').forEach((s) => { s.hidden = s.dataset.sec !== aba; });
  document.querySelectorAll('.vista a').forEach((a) => {
    const atual = a.dataset.aba === (aba === 'episodio' ? 'episodios' : aba);
    if (atual) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (aba === 'episodio') abrirEpisodio(decodeURIComponent(arg));
  else estado.ep = null;
  if (aba === 'pautas') carregarPautas();
  if (aba === 'site') carregarSite();
  if (aba === 'atividade' || aba === 'geral') carregarAtividade();
  if (aba === 'episodios' || aba === 'geral') carregarEpisodios();
  window.scrollTo(0, 0);
}

// ---------- estado geral (a cada 5 s) ----------
async function atualizar() {
  let e;
  try {
    e = await api('estado');
  } catch (err) {
    $('#geral').dataset.st = 'crit';
    $('#geral-txt').textContent = 'sem conexão com o bot';
    return;
  }
  const antes = estado.api;
  estado.api = e;
  $('#usuario').textContent = e.usuario;
  const cred = e.creditos || {};
  const pct = cred.limite ? (100 * cred.livre) / cred.limite : null;
  $('#cred-txt').textContent = pct == null ? 'indisponível' : `${num(cred.livre)} (${pct.toFixed(0)}%)`;
  $('#pill-cred').dataset.st = pct == null ? 'warn' : pct < 10 ? 'crit' : pct < 25 ? 'warn' : 'ok';
  $('#pill-etapa').dataset.st = e.ocupado ? 'man' : 'ok';
  $('#etapa-txt').textContent = e.ocupado ? `${e.etapa_nome} · ${Math.floor((e.agora - e.desde) / 60)} min` : 'livre';
  const geral = $('#geral');
  geral.dataset.st = pct != null && pct < 10 ? 'crit' : e.ocupado ? 'man' : 'ok';
  $('#geral-txt').textContent = e.ocupado ? 'etapa em andamento' : 'bot no ar';
  // terminou uma etapa: recarrega o que pode ter mudado
  if (antes && antes.ocupado && !e.ocupado) {
    aviso(`Terminou: ${antes.etapa_nome}.`, 'ok');
    carregarEpisodios();
    carregarAtividade();
    if (estado.ep) abrirEpisodio(estado.ep, true);
    if (!$('[data-sec="pautas"]').hidden) carregarPautas();
  }
  desenharGeral();
}

function kpi(rotulo, valor, extra, stv) {
  return h('div', {}, h('dt', { dataset: stv ? { st: stv } : {} }, stv ? st() : null, rotulo), h('dd', { text: valor }), extra);
}

function desenharGeral() {
  const e = estado.api;
  if (!e) return;
  const cred = e.creditos || {};
  const pct = cred.limite ? (100 * cred.livre) / cred.limite : 0;
  const barra = h('div', { class: 'barra' }, h('i'));
  barra.firstChild.style.setProperty('--p', `${pct.toFixed(1)}%`);
  barra.firstChild.style.setProperty('--c', pct < 10 ? 'var(--crit)' : pct < 25 ? 'var(--warn)' : 'var(--ok)');
  const conta = (s) => estado.eps.filter((x) => x.estado === s).length;
  const prox = e.proxima_pauta ? quando(e.proxima_pauta) : null;
  $('#kpis').replaceChildren(
    kpi('Créditos ElevenLabs', cred.limite ? num(cred.livre) : 'indisponível',
      h('small', {}, cred.limite ? `de ${num(cred.limite)} · ~${num(Math.floor(cred.livre / (e.custo_caractere * 6000)))} episódios de 6 mil caracteres` : cred.erro || '', barra),
      cred.limite ? (pct < 10 ? 'crit' : pct < 25 ? 'warn' : 'ok') : 'warn'),
    kpi('Esperando você', String(conta('roteiro') + conta('audio')),
      h('small', { text: `${conta('roteiro')} roteiro(s) · ${conta('audio')} áudio(s)` }), conta('roteiro') + conta('audio') ? 'warn' : 'ok'),
    kpi('Publicados', String(conta('publicado')), h('small', { text: 'gerados por este pipeline' })),
    kpi('Próximas pautas', prox ? prox.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '-',
      h('small', { text: prox ? `às ${e.hora}h (seg, qua e sex)` : '' })),
  );

  const fila = estado.eps.filter((x) => x.estado === 'roteiro' || x.estado === 'audio');
  $('#fila').replaceChildren(...(fila.length ? fila.map((x) => h('li', {},
    h('a', { href: `#/episodios/${encodeURIComponent(x.pasta)}` }, h('strong', { text: x.titulo })),
    h('span', { class: 'tag', dataset: { st: x.estado === 'audio' && x.qa && !x.qa.aprovado ? 'crit' : 'warn' },
      text: x.estado === 'roteiro' ? `aprovar roteiro · ~${num(x.custo_audio)} créditos` : x.qa && x.qa.aprovado ? 'ouvir e publicar' : 'QA reprovou' }),
  )) : [h('li', { class: 'vazio', text: 'Nada pendente.' })]));

  const ativa = e.ocupado ? (e.etapa === 'refazer' ? 'audio' : e.etapa) : null;
  $('#fluxo').replaceChildren(...ETAPAS.map(([id, nome, desc]) => h('li', { dataset: { st: ativa === id ? 'man' : '' } },
    nome, h('small', { text: ativa === id ? `rodando: ${e.alvo || ''}` : desc }))));
  $('#config').textContent = `TTS ${e.modelo_tts} · estabilidade ${e.estabilidade} · ${e.custo_caractere} crédito/caractere · ` +
    `coapresentadora ${e.coapresentadora} · abas do Telegram ${e.abas_telegram ? 'ligadas' : 'desligadas (Threaded Mode)'}`;
}

// ---------- atividade ----------
const ABAS = { pautas: 'pautas', producao: 'produção', publicacao: 'publicação', sistema: 'sistema' };
function linhaLog(ev) {
  return h('li', {}, h('time', { datetime: ev.quando, title: data(ev.quando), text: hora(ev.quando) }),
    h('span', { class: 'lv', dataset: { o: ev.origem }, text: ev.origem === 'painel' ? 'painel' : ABAS[ev.aba] || ev.aba }),
    h('p', { text: ev.texto }));
}
async function carregarAtividade() {
  const lista = await api('atividade').catch(() => null);
  if (!lista) return;
  const vazio = h('li', { class: 'vazio', text: 'Sem atividade registrada ainda.' });
  $('#log-curto').replaceChildren(...(lista.length ? lista.slice(0, 8).map(linhaLog) : [vazio.cloneNode(true)]));
  $('#log-todo').replaceChildren(...(lista.length ? lista.map(linhaLog) : [vazio]));
}

// ---------- pautas ----------
async function carregarPautas() {
  const lotes = await api('pautas').catch((e) => { aviso(e.message, 'crit'); return null; });
  if (!lotes) return;
  $('#lotes').replaceChildren(...(lotes.length ? lotes.map((l, i) => h('details', { class: 'painel lote', open: i === 0 },
    h('summary', {}, h('strong', { text: data(l.quando) }), h('span', { text: `${l.pautas.length} pautas` }),
      l.noticias ? h('span', { text: `${num(l.noticias)} notícias lidas` }) : null,
      l.repetidas ? h('span', { class: 'tag', text: `${l.repetidas} repetida(s) fora` }) : null),
    h('div', { class: 'cards' }, l.pautas.map((p) => h('article', { class: 'card' },
      h('div', { class: 'meta' }, h('span', { class: 'nota-pauta', text: `${p.nota}/10` }), h('span', { class: 'tag', text: p.tema }),
        p.pasta ? h('span', { class: 'tag', dataset: { st: 'ok' }, text: 'já produzida' }) : null),
      h('h3', { text: `${p.n}. ${p.titulo}` }),
      h('p', { text: p.por_que }),
      h('details', {}, h('summary', { text: `${p.noticias.length} notícia(s), ${p.noticias.reduce((a, n) => a + n.fontes.length, 0)} fonte(s)` }),
        h('ul', {}, p.noticias.map((n) => h('li', {}, `${n.data || ''} ${n.titulo} `,
          h('small', { text: `(${n.fontes.map((f) => f.nome).join(', ')})` }))))),
      h('div', { class: 'rodape' },
        p.pasta ? h('a', { class: 'botao fantasma mini', href: `#/episodios/${encodeURIComponent(p.pasta)}`, text: 'Ver episódio' }) : h('span'),
        botaoAcao({ rotulo: p.pasta ? 'Produzir de novo' : 'Produzir roteiro', icon: 'mic', classe: 'mini', confirmar: 'Confirmar (grátis)',
          acao: () => api(`pautas/${l.arquivo}/${p.n}/produzir`, {}) })),
    ))))) : [h('p', { class: 'nota', text: 'Nenhuma pauta ainda. Use "Buscar pautas agora".' })]));
}

// ---------- episódios ----------
async function carregarEpisodios() {
  const eps = await api('episodios').catch(() => null);
  if (!eps) return;
  estado.eps = eps;
  desenharGeral();
  const grupos = estado.filtro === 'ativos' ? ['roteiro', 'audio', 'publicado'] : ['outra_versao', 'descartado', 'arquivado'];
  $('#filtros').replaceChildren(...[['ativos', 'Em produção e no ar'], ['outros', 'Outras versões, descartes e cópias']].map(([id, nome]) =>
    h('button', { type: 'button', role: 'radio', 'aria-checked': String(estado.filtro === id),
      onclick: () => { estado.filtro = id; carregarEpisodios(); } }, nome)));
  $('#quadro').replaceChildren(...grupos.map((g) => {
    const lista = eps.filter((x) => x.estado === g);
    return h('section', { class: 'coluna' },
      h('h2', { class: 'col-titulo', dataset: { st: ESTADOS[g].st } }, st(), ESTADOS[g].nome, h('span', { text: `(${lista.length})` })),
      ...(lista.length ? lista.map(cartaoEp) : [h('p', { class: 'vazio', text: 'Nenhum.' })]));
  }));
}

function cartaoEp(x) {
  const qa = x.qa;
  return h('a', { class: 'ep', href: `#/episodios/${encodeURIComponent(x.pasta)}` },
    h('strong', { text: x.titulo }),
    h('div', { class: 'meta' },
      x.tema ? h('span', { class: 'tag', text: x.tema }) : null,
      h('span', { class: 'tag', text: qa ? mmss(qa.duracao_s) : `~${x.minutos} min` }),
      qa ? h('span', { class: 'tag', dataset: { st: qa.aprovado ? 'ok' : 'crit' }, text: qa.aprovado ? 'QA ok' : 'QA reprovou' }) : null,
      x.avisos ? h('span', { class: 'tag', dataset: { st: 'warn' }, text: `${x.avisos} aviso(s)` }) : null,
      x.versao_de ? h('span', { class: 'tag', dataset: { st: 'warn' }, text: 'versão nova' }) : null),
    h('small', { text: `${relativo(x.atualizado)} · ${num(x.caracteres)} caracteres` }));
}

async function abrirEpisodio(pasta, recarga = false) {
  estado.ep = pasta;
  let ep;
  try {
    ep = await api(`episodios/${encodeURIComponent(pasta)}`);
  } catch (e) {
    aviso(e.message, 'crit');
    return;
  }
  if (estado.ep !== pasta) return;
  estado.epTempos = ep.falas.map((f) => f.tempo);
  const info = ESTADOS[ep.estado];
  $('#ep-estado').replaceChildren(h('span', { class: 'tag', dataset: { st: info.st } }, st(), info.nome));
  $('#t-ep').textContent = ep.titulo;
  $('#ep-meta').textContent = [ep.tema, ep.status && `status ${ep.status}`, `${ep.falas.length} falas`, `${num(ep.palavras)} palavras (~${ep.minutos} min)`,
    `${num(ep.caracteres)} caracteres`, `pasta ${ep.pasta}`].filter(Boolean).join(' · ');
  desenharAcoes(ep);
  desenharPlayer(ep, recarga);
  desenharFalas(ep);
  $('#ep-pagina').replaceChildren(...[['Título', ep.roteiro.titulo], ['Título SEO', ep.roteiro.tituloSeo], ['Slug', ep.roteiro.slug],
    ['Resumo', ep.roteiro.resumo], ['Descrição', ep.roteiro.descricao], ['Tags', (ep.roteiro.tags || []).join(', ')],
    ['Período', ep.roteiro.periodo], ['Status do caso', ep.roteiro.status], ['Endereço', ep.url]]
    .flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v || '-' })]));
  $('#ep-ficha').textContent = ep.ficha || 'Sem ficha.';
  $('#ep-fontes').replaceChildren(...(ep.fontes.length ? ep.fontes.map((f) => h('li', {},
    h('a', { href: f.url, target: '_blank', rel: 'noopener noreferrer', text: f.titulo || f.url }), ' ', h('small', { text: f.fonte || '' })))
    : [h('li', { class: 'vazio', text: 'Sem fontes salvas.' })]));
  const rev = ep.revisao.length ? h('ul', { class: 'checks' }, ep.revisao.map((p) => h('li', { dataset: { st: 'warn' } }, st(),
    h('span', {}, h('strong', { text: p.tipo || 'correção' }), h('small', { text: p.problema || JSON.stringify(p) })))))
    : h('p', { class: 'nota', text: 'A revisão automática não corrigiu nada.' });
  $('#ep-revisao').replaceChildren(
    h('h2', { class: 'painel-titulo', text: 'Revisão automática' }), rev,
    h('h2', { class: 'painel-titulo', text: 'Avisos da conferência' }),
    ep.modelos.avisos.length ? h('ul', { class: 'checks' }, ep.modelos.avisos.map((a) => h('li', { dataset: { st: 'warn' } }, st(), h('span', { text: a }))))
      : h('p', { class: 'nota', text: 'Nenhum.' }),
    h('h2', { class: 'painel-titulo', text: 'Modelos usados' }),
    h('p', { class: 'nota', text: ep.modelos.etapas.map((m) => `${m.tarefa}: ${m.modelo}`).join(' · ') || '-' }),
    ep.copias.length ? h('p', { class: 'nota', text: `Cópias do roteiro antes de edições: ${ep.copias.join(', ')}` }) : null);
  mostrarSub(estado.sub);
}

function desenharAcoes(ep) {
  const a = [];
  const livre = !estado.api?.ocupado;
  const ir = (acao, corpo = {}) => api(`episodios/${encodeURIComponent(ep.pasta)}/${acao}`, corpo);
  if (ep.estado === 'roteiro') {
    a.push(botaoAcao({ rotulo: `Aprovar roteiro e gerar áudio (~${num(ep.custo_audio)} créditos)`, icon: 'mic', classe: 'gasta',
      confirmar: `Confirmar: gastar ~${num(ep.custo_audio)} créditos`, acao: () => ir('audio') }));
  }
  if (ep.versao_de) a.push(h('span', { class: 'tag', dataset: { st: 'warn' } }, st(), 'versão nova de um episódio no ar: troque o áudio por PR'));
  if (ep.texto_mudou) a.push(h('span', { class: 'tag', dataset: { st: 'warn' } }, st(), 'fala editada sem refazer: refaça para publicar'));
  if (['audio', 'outra_versao'].includes(ep.estado) && !ep.texto_mudou) {
    if (ep.qa?.aprovado && !ep.versao_de) a.push(botaoAcao({ rotulo: 'Publicar no site', icon: 'envio', classe: 'publica', confirmar: 'Confirmar publicação', acao: () => ir('publicar') }));
    a.push(botaoAcao({ rotulo: 'Remontar áudio, legenda e QA (0 crédito)', icon: 'refazer', classe: 'fantasma',
      confirmar: 'Confirmar (blocos reaproveitados)', acao: () => ir('audio') }));
  }
  if (['roteiro', 'audio', 'outra_versao'].includes(ep.estado)) a.push(botaoAcao({ rotulo: 'Descartar', icon: 'lixo', classe: 'perigo', confirmar: 'Confirmar descarte', acao: () => ir('descartar') }));
  if (ep.estado === 'descartado') a.push(botaoAcao({ rotulo: 'Restaurar', icon: 'refazer', acao: () => ir('restaurar') }));
  if (ep.url) a.push(h('a', { class: 'botao fantasma', href: ep.url, target: '_blank', rel: 'noopener noreferrer' }, icone('link'), 'Ver no site'));
  if (!livre) a.forEach((b) => { if (b.tagName === 'BUTTON') b.disabled = true; });
  if (!livre) a.push(h('span', { class: 'tag', dataset: { st: 'man' } }, st(), `ocupado: ${estado.api.etapa_nome}`));
  $('#ep-acoes').replaceChildren(...a);
}

function desenharPlayer(ep, recarga) {
  const caixa = $('#ep-player');
  caixa.hidden = !ep.tem_audio;
  if (!ep.tem_audio) return;
  const audio = $('#audio');
  const src = `api/episodios/${encodeURIComponent(ep.pasta)}/audio?v=${ep.versao_audio}`;
  if (audio.getAttribute('src') !== src) {
    audio.setAttribute('src', src);
    audio.replaceChildren();
    if (ep.tem_legenda) audio.append(h('track', { kind: 'captions', srclang: 'pt-BR', label: 'Português', default: true,
      src: `api/episodios/${encodeURIComponent(ep.pasta)}/legenda?v=${ep.versao_audio}` }));
  }
  const seg = (t) => t.split(':').reduce((a, n) => a * 60 + Number(n), 0);
  $('#ep-caps').replaceChildren(...ep.capitulos.map((c) => h('li', {}, h('button', { type: 'button',
    onclick: () => { audio.currentTime = seg(c.inicio); audio.play(); } }, `${c.inicio} ${c.titulo}`))));
  const qa = ep.qa || {};
  const item = (k, v, ok) => h('div', { dataset: { st: ok ? 'ok' : 'crit' } }, st(), h('dt', { text: k }), h('dd', { text: v }));
  $('#ep-qa').replaceChildren(
    item('QA', qa.aprovado ? 'aprovado' : 'reprovado', qa.aprovado),
    item('duração', qa.duracao_s ? mmss(qa.duracao_s) : '-', true),
    item('loudness', `${qa.lufs} LUFS`, Math.abs(qa.lufs + 16) <= 1),
    item('pico', `${qa.pico_dbtp} dBTP`, qa.pico_dbtp <= -1),
    item('faststart', qa.faststart ? 'ok' : 'falhou', qa.faststart),
    item('alinhamento', `${Math.round((qa.cobertura_alinhamento || 0) * 100)}%`, qa.cobertura_alinhamento >= 0.85),
    item('fora do tom', String((qa.fora_do_tom || []).length), !(qa.fora_do_tom || []).length),
    h('div', {}, h('dt', { text: 'arquivo' }), h('dd', { text: `${(ep.audio_bytes / 1048576).toFixed(1)} MB · ${ep.blocos} blocos` })));
  if (!ep.legenda_em_dia) aviso('A legenda está mais velha que o áudio: use "Remontar áudio, legenda e QA" antes de refazer falas.', 'warn');
}

function desenharFalas(ep) {
  const fora = new Map((ep.qa?.fora_do_tom || []).map((f) => [f.fala, f]));
  const podeEditar = ['roteiro', 'audio', 'outra_versao'].includes(ep.estado);
  const comAudio = ['audio', 'outra_versao'].includes(ep.estado) && ep.legenda_em_dia;
  $('#ep-falas').replaceChildren(...ep.falas.map((f, i) => {
    const li = h('li', { class: 'fala', dataset: { quem: f.quem, i: String(i) } });
    if (fora.has(i)) li.dataset.fora = '1';
    if (f.capitulo) li.append(h('p', { class: 'cap', text: `Capítulo: ${f.capitulo}` }));
    const lado = h('div', { class: 'lado' }, h('span', { class: 'quem', text: f.quem === 'samurai' ? 'Samurai' : estado.api?.coapresentadora || 'Sara' }));
    if (f.tempo) lado.append(h('button', { type: 'button', class: 'tempo', title: 'Tocar desta fala',
      onclick: () => { const a = $('#audio'); a.currentTime = f.tempo[0]; a.play(); } }, mmss(f.tempo[0])));
    const texto = h('p', { class: 'texto', text: f.texto });
    const ferramentas = h('div', { class: 'ferramentas' });
    if (fora.has(i)) {
      const x = fora.get(i);
      ferramentas.append(h('span', { class: 'tag', dataset: { st: 'warn' }, title: `voz ${Math.round(x.f0 * 100)}%, brilho ${Math.round(x.brilho * 100)}%`, text: 'fora do tom' }));
    }
    if (podeEditar) {
      ferramentas.append(h('button', { type: 'button', class: 'botao fantasma mini', title: 'Editar a fala', 'aria-label': `Editar fala ${i + 1}`,
        onclick: () => editarFala(li, ep, f, i, comAudio) }, icone('editar')));
    }
    if (comAudio) {
      ferramentas.append(botaoAcao({ rotulo: `Refazer ~${f.custo_refazer}`, icon: 'refazer', classe: 'gasta mini',
        confirmar: `Gastar ~${f.custo_refazer}`, acao: () => api(`episodios/${encodeURIComponent(ep.pasta)}/refazer`, { fala: i }) }));
    }
    li.append(lado, texto, ferramentas);
    return li;
  }));
}

function editarFala(li, ep, f, i, comAudio) {
  if (li.querySelector('.editor')) return;
  const area = h('textarea', { 'aria-label': `Texto da fala ${i + 1}`, maxlength: '1500' });
  area.value = f.texto;
  const fechar = () => editor.remove();
  const salvar = (refazer) => async () => {
    const corpo = { fala: i, texto: area.value };
    const r = await api(`episodios/${encodeURIComponent(ep.pasta)}/${refazer ? 'refazer' : 'fala'}`, corpo);
    fechar();
    if (!refazer) { aviso(r.mudou ? 'Fala salva (uma cópia do roteiro anterior foi guardada).' : 'Nada mudou.', 'ok'); abrirEpisodio(ep.pasta, true); return false; }
    return r;
  };
  const botoes = h('div', {},
    botaoAcao({ rotulo: comAudio ? 'Salvar só o texto' : 'Salvar', icon: 'ok', acao: salvar(false) }),
    comAudio ? botaoAcao({ rotulo: `Salvar e refazer no áudio (~${f.custo_refazer})`, icon: 'refazer', classe: 'gasta',
      confirmar: `Gastar ~${f.custo_refazer} créditos`, acao: salvar(true) }) : null,
    h('button', { type: 'button', class: 'botao fantasma', onclick: fechar }, 'Cancelar'));
  const editor = h('div', { class: 'editor' }, area,
    h('p', { class: 'nota', text: comAudio ? 'Com o áudio pronto, o texto novo só entra no áudio se a fala for refeita. Tags como [laughs] são tiradas ao refazer.'
      : 'Grátis: o áudio ainda não foi gerado. Siglas lidas letra a letra vão soletradas (cê-pê-éfe); números por extenso.' }), botoes);
  li.append(editor);
  area.focus();
}

function mostrarSub(nome) {
  estado.sub = nome;
  document.querySelectorAll('#ep-abas [role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.sub === nome)));
  document.querySelectorAll('[data-sec="episodio"] .sub').forEach((s) => { s.hidden = s.dataset.sub !== nome; });
}

// legenda atual: destaca a fala que está tocando
function seguirAudio() {
  const t = $('#audio').currentTime;
  let atual = null;
  document.querySelectorAll('#ep-falas .fala').forEach((li) => {
    const f = Number(li.dataset.i);
    li.removeAttribute('data-atual');
    if (estado.epTempos?.[f] && t >= estado.epTempos[f][0] && t < estado.epTempos[f][1]) atual = li;
  });
  if (atual) atual.dataset.atual = '1';
}

// ---------- site ----------
function listaChecks(checks) {
  return checks.map((c) => h('li', { dataset: { st: c.ok ? 'ok' : 'crit' } }, st(), h('span', {}, c.nome, c.detalhe ? h('small', { text: c.detalhe }) : null)));
}
function desenharVerificacao(v) {
  if (!v) return;
  if (v.erro) { $('#feed-canal').replaceChildren(h('li', { dataset: { st: 'crit' } }, st(), h('span', { text: v.erro }))); return; }
  $('#feed-canal').replaceChildren(...listaChecks(v.canal));
  $('#feed-itens').replaceChildren(...v.itens.map((it) => {
    const ruins = it.checks.filter((c) => !c.ok).length;
    return h('details', { class: 'feed-item' }, h('summary', { dataset: { st: ruins ? 'crit' : 'ok' } }, st(), it.titulo,
      h('span', { class: 'tag', dataset: { st: ruins ? 'crit' : 'ok' }, text: ruins ? `${ruins} problema(s)` : 'ok' })),
    h('ul', { class: 'checks' }, listaChecks(it.checks)));
  }));
}
async function carregarSite() {
  const s = await api('site').catch(() => null);
  if (!s) return;
  const total = s.contador && typeof s.contador.total === 'number' ? s.contador.total : null;
  const v = s.verificacao;
  const ruins = v && !v.erro ? [...v.canal, ...v.itens.flatMap((i) => i.checks)].filter((c) => !c.ok).length : null;
  $('#site-kpis').replaceChildren(
    kpi('Episódios no feed', String(s.feed.itens.length), h('small', { text: s.feed.erro || s.feed.titulo })),
    kpi('Pessoas informadas', total == null ? '-' : num(total), h('small', { text: total == null ? 'contador indisponível' : `desde ${s.contador.desde} (aparece no site a partir de 100)` })),
    kpi('Verificação do feed', ruins == null ? 'não rodou' : ruins ? `${ruins} problema(s)` : 'tudo ok',
      h('small', { text: v ? `${relativo(v.quando)}` : 'use o botão acima' }), ruins == null ? null : ruins ? 'crit' : 'ok'));
  $('#no-ar').replaceChildren(...s.feed.itens.map((i) => h('li', {}, h('a', { href: i.link, target: '_blank', rel: 'noopener noreferrer', text: i.titulo }),
    h('small', { text: ` ${i.duracao ? `${mmss(Number(i.duracao))} · ` : ''}${i.data ? new Date(i.data).toLocaleDateString('pt-BR') : ''}` }))));
  desenharVerificacao(v);
}

// ---------- início ----------
function relogio() { $('#relogio').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }

$('#buscar-pautas').replaceWith(botaoAcao({ rotulo: 'Buscar pautas agora', icon: 'busca', confirmar: 'Confirmar (grátis)', acao: () => api('pautas/buscar', {}) }));
$('#verificar-feed').replaceWith(botaoAcao({ rotulo: 'Verificar feed agora', icon: 'ok', acao: async () => {
  aviso('Verificando o feed e cada áudio no ar (uns segundos)...');
  await api('feed/verificar', {});
  await carregarSite();
  return false;
} }));
$('#ep-abas').addEventListener('click', (e) => { const b = e.target.closest('[role="tab"]'); if (b) mostrarSub(b.dataset.sub); });
$('#audio').addEventListener('timeupdate', seguirAudio);
window.addEventListener('hashchange', rota);
document.addEventListener('visibilitychange', () => { if (!document.hidden) atualizar(); });
setInterval(() => { if (!document.hidden) atualizar(); }, 5000);
setInterval(() => { if (!document.hidden && !$('[data-sec="atividade"]').hidden) carregarAtividade(); }, 10000);
setInterval(relogio, 10000);
relogio();
atualizar().then(rota);
