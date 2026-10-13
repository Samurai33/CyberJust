// <cj-player>: player global de episódios, sem framework.
//
// - Um único <audio> nativo para a sessão inteira. Os arquivos são AAC em MP4 com o índice (moov)
//   no início, então o navegador toca por HTTP Range: começa em poucos KB e pula direto ao ponto.
//   No iPhone, só um <audio> iniciado por toque do usuário pode tocar; por isso ele é reaproveitado.
// - O elemento persiste entre páginas (transition:persist + <ClientRouter />): o áudio não para.
// - Media Session API: título e capa na tela de bloqueio, Central de Controle (iOS), notificação
//   (Android), teclas de mídia (Mac/PC) e fones; com barra de posição (setPositionState).
// - Continua de onde parou (posição por episódio no localStorage) e lembra velocidade e volume.
// - Qualquer botão com [data-tocar] na página controla o player (delegação de eventos).

import { formatarTempo, tempoPorExtenso, proximaVelocidade, posicaoParaRetomar } from '../lib/tempo';

interface Faixa {
  id: string;
  src: string;
  titulo: string;
  url: string;
  rotulo: string;
  segundos: number;
}

const VOLTAR = 15;
const AVANCAR = 30;
const ARTE: MediaImage[] = [
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
];

// localStorage pode lançar exceção (Safari em modo privado, cota, bloqueio): nunca quebra o player.
const guardar = {
  ler(chave: string): string | null {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  },
  gravar(chave: string, valor: string | null): void {
    try {
      if (valor === null) localStorage.removeItem(chave);
      else localStorage.setItem(chave, valor);
    } catch {
      /* sem armazenamento: segue sem lembrar */
    }
  },
};
const chavePosicao = (id: string) => `cj:posicao:${id}`;

function faixaDoBotao(el: HTMLElement): Faixa | null {
  const d = el.dataset;
  if (!d['id'] || !d['src']) return null;
  return {
    id: d['id'],
    src: d['src'],
    titulo: d['titulo'] ?? 'Episódio',
    url: d['url'] ?? '/episodios/',
    rotulo: d['rotulo'] ?? '',
    segundos: Number(d['segundos']) || 0,
  };
}

class CjPlayer extends HTMLElement {
  #iniciado = false;
  #faixa: Faixa | null = null;
  #arrastando = false;
  #ultimoSalvo = 0;
  #quadro = 0;
  #pendente = 0; // posição a aplicar quando os metadados chegarem

  #audio!: HTMLAudioElement;
  #painel!: HTMLElement;
  #titulo!: HTMLAnchorElement;
  #sub!: HTMLElement;
  #trilha!: HTMLInputElement;
  #atual!: HTMLElement;
  #total!: HTMLElement;
  #vel!: HTMLButtonElement;
  #play!: HTMLButtonElement;
  #vol!: HTMLElement;
  #volume!: HTMLInputElement;

  // Com transition:persist o elemento é movido entre documentos e connectedCallback roda de novo.
  connectedCallback(): void {
    if (this.#iniciado) return;
    this.#iniciado = true;

    const ref = <T extends HTMLElement>(nome: string) => this.querySelector<T>(`[data-ref="${nome}"]`)!;
    this.#audio = ref<HTMLAudioElement>('audio');
    this.#painel = this.querySelector<HTMLElement>('.pl')!;
    this.#titulo = ref<HTMLAnchorElement>('titulo');
    this.#sub = ref('sub');
    this.#trilha = ref<HTMLInputElement>('trilha');
    this.#atual = ref('atual');
    this.#total = ref('total');
    this.#vol = ref('vol');
    this.#volume = ref<HTMLInputElement>('volume');
    this.#vel = this.querySelector<HTMLButtonElement>('[data-acao="velocidade"]')!;
    this.#play = this.querySelector<HTMLButtonElement>('[data-acao="tocar"]')!;

    this.#configurarVolume();
    this.#ligarAudio();
    this.#ligarControles();
    this.#ligarMediaSession();

    // Salva a posição quando a aba some (fechar, trocar de app no celular).
    addEventListener('pagehide', () => this.#salvarPosicao(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.#salvarPosicao(true);
    });
  }

  get faixaAtual(): Faixa | null {
    return this.#faixa;
  }

  get tocando(): boolean {
    return !this.#audio.paused && !this.#audio.ended;
  }

  /**
   * Toca a faixa; se já é a atual, alterna tocar/pausar. Com `inicio` (capítulo), toca a partir dali.
   * Chamado direto do clique (exigência do iOS).
   */
  tocar(faixa: Faixa, inicio?: number): void {
    if (this.#faixa?.id === faixa.id) {
      if (inicio === undefined) return this.alternar();
      this.#irPara(inicio);
      if (this.#audio.paused) this.#retomar();
      return;
    }
    this.#salvarPosicao(true);
    this.#faixa = faixa;
    this.#erro(null);

    this.#pendente = inicio ?? posicaoParaRetomar(Number(guardar.ler(chavePosicao(faixa.id))), faixa.segundos);
    this.#audio.preload = 'auto';
    this.#audio.src = faixa.src;
    this.#audio.playbackRate = Number(guardar.ler('cj:velocidade')) || 1;

    this.#titulo.textContent = faixa.titulo;
    this.#titulo.href = faixa.url;
    this.#sub.textContent = this.#pendente
      ? `${faixa.rotulo} · ${inicio === undefined ? 'continuando de' : 'a partir de'} ${formatarTempo(this.#pendente)}`
      : faixa.rotulo;
    this.#desenharTempo(this.#pendente, faixa.segundos);
    this.#trilha.max = String(Math.round(faixa.segundos));
    this.hidden = false;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: faixa.titulo,
        artist: 'CyberJustiça Brasil',
        album: faixa.rotulo,
        artwork: ARTE,
      });
    }
    this.#retomar();
    this.#anunciar();
  }

  alternar(): void {
    if (!this.#faixa) return;
    if (this.#audio.paused) this.#retomar();
    else this.#audio.pause();
  }

  pular(segundos: number): void {
    if (!this.#faixa) return;
    this.#irPara(this.#audio.currentTime + segundos);
  }

  fechar(): void {
    this.#salvarPosicao(true);
    this.#audio.pause();
    this.#audio.removeAttribute('src');
    this.#audio.load();
    this.#faixa = null;
    this.hidden = true;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
    this.#anunciar();
  }

  #retomar(): void {
    this.#audio.play().catch((e: unknown) => {
      // AbortError: um load()/pause() mais novo cancelou este play(). NotAllowedError: sem gesto do usuário.
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        this.#estado('parado');
        return;
      }
      this.#erro('Não foi possível tocar o episódio. Tente de novo.');
    });
  }

  #irPara(segundos: number): void {
    const a = this.#audio;
    const duracao = Number.isFinite(a.duration) ? a.duration : (this.#faixa?.segundos ?? 0);
    const alvo = Math.min(Math.max(0, segundos), Math.max(0, duracao - 0.5));
    if (a.readyState < HTMLMediaElement.HAVE_METADATA) {
      this.#pendente = alvo;
      this.#desenharTempo(alvo, duracao);
      return;
    }
    a.currentTime = alvo;
    this.#desenharTempo(alvo, duracao);
    this.#posicaoNoSistema();
  }

  #ligarAudio(): void {
    const a = this.#audio;
    a.addEventListener('loadedmetadata', () => {
      if (this.#pendente) {
        a.currentTime = this.#pendente;
        this.#pendente = 0;
      }
      this.#trilha.max = String(Math.round(a.duration));
      this.#desenharTempo(a.currentTime, a.duration);
      this.#posicaoNoSistema();
    });
    a.addEventListener('waiting', () => this.#estado('carregando'));
    a.addEventListener('seeking', () => a.paused || this.#estado('carregando'));
    a.addEventListener('playing', () => this.#estado('tocando'));
    a.addEventListener('pause', () => {
      this.#estado('parado');
      this.#salvarPosicao(true);
    });
    a.addEventListener('ended', () => {
      this.#estado('parado');
      if (this.#faixa) guardar.gravar(chavePosicao(this.#faixa.id), null);
    });
    a.addEventListener('timeupdate', () => {
      if (this.#arrastando) return;
      // Desenha no próximo quadro (timeupdate dispara ~4x/s; evita trabalho com a aba escondida).
      cancelAnimationFrame(this.#quadro);
      this.#quadro = requestAnimationFrame(() => this.#desenharTempo(a.currentTime, a.duration));
      this.#salvarPosicao(false);
    });
    a.addEventListener('progress', () => this.#desenharBuffer());
    a.addEventListener('ratechange', () => {
      this.#vel.textContent = `${a.playbackRate}x`;
      this.#vel.setAttribute('aria-label', `Velocidade de reprodução: ${a.playbackRate}x`);
      this.#posicaoNoSistema();
    });
    a.addEventListener('volumechange', () => {
      this.#volume.value = String(a.muted ? 0 : a.volume);
      this.#vol.toggleAttribute('data-mudo', a.muted || a.volume === 0);
    });
    a.addEventListener('error', () => {
      // Limpar o src (fechar) também dispara "error": ignora.
      if (!a.getAttribute('src') || !this.#faixa) return;
      this.#erro('Não foi possível carregar o áudio. Verifique sua conexão e tente de novo.');
    });
  }

  #ligarControles(): void {
    this.addEventListener('click', (ev) => {
      const botao = (ev.target as Element).closest<HTMLButtonElement>('[data-acao]');
      switch (botao?.dataset['acao']) {
        case 'tocar':
          return this.alternar();
        case 'voltar':
          return this.pular(-VOLTAR);
        case 'avancar':
          return this.pular(AVANCAR);
        case 'velocidade': {
          const v = proximaVelocidade(this.#audio.playbackRate);
          this.#audio.playbackRate = v;
          guardar.gravar('cj:velocidade', String(v));
          return;
        }
        case 'mudo':
          this.#audio.muted = !this.#audio.muted;
          return;
        case 'fechar':
          return this.fechar();
      }
    });

    // Trilha: enquanto arrasta, só mostra o tempo; ao soltar, pula (evita dezenas de pedidos Range).
    this.#trilha.addEventListener('input', () => {
      this.#arrastando = true;
      this.#desenharTempo(Number(this.#trilha.value), Number(this.#trilha.max));
    });
    this.#trilha.addEventListener('change', () => {
      this.#arrastando = false;
      this.#irPara(Number(this.#trilha.value));
    });

    this.#volume.addEventListener('input', () => {
      const v = Number(this.#volume.value);
      this.#audio.volume = v;
      this.#audio.muted = v === 0;
      guardar.gravar('cj:volume', String(v));
    });

    // Atalhos com o foco dentro do player (padrão do YouTube): K tocar/pausar, J voltar, L avançar.
    this.addEventListener('keydown', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const tecla = ev.key.toLowerCase();
      if (tecla === 'k') this.alternar();
      else if (tecla === 'j') this.pular(-VOLTAR);
      else if (tecla === 'l') this.pular(AVANCAR);
      else return;
      ev.preventDefault();
    });
  }

  #ligarMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    const acoes: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => this.#retomar()],
      ['pause', () => this.#audio.pause()],
      ['stop', () => this.fechar()],
      ['seekbackward', (d) => this.pular(-(d.seekOffset ?? VOLTAR))],
      ['seekforward', (d) => this.pular(d.seekOffset ?? AVANCAR)],
      [
        'seekto',
        (d) => {
          if (d.seekTime === undefined) return;
          if (d.fastSeek && 'fastSeek' in this.#audio) this.#audio.fastSeek(d.seekTime);
          else this.#irPara(d.seekTime);
        },
      ],
    ];
    for (const [acao, fn] of acoes) {
      try {
        navigator.mediaSession.setActionHandler(acao, fn);
      } catch {
        /* ação não suportada neste navegador */
      }
    }
  }

  // O iPhone/iPad ignora volume via JavaScript (só os botões do aparelho): esconde o controle lá.
  #configurarVolume(): void {
    const a = this.#audio;
    a.volume = 0.5;
    const ajustavel = a.volume === 0.5;
    a.volume = Number(guardar.ler('cj:volume') ?? 1);
    this.#vol.toggleAttribute('data-ok', ajustavel);
    this.#volume.value = String(a.volume);
  }

  #posicaoNoSistema(): void {
    const a = this.#audio;
    if (!('mediaSession' in navigator) || !Number.isFinite(a.duration) || a.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: a.duration,
        playbackRate: a.playbackRate,
        position: Math.min(a.currentTime, a.duration),
      });
    } catch {
      /* valores fora do intervalo durante a troca de faixa */
    }
  }

  #salvarPosicao(agora: boolean): void {
    const f = this.#faixa;
    if (!f || !this.#audio.getAttribute('src')) return;
    const t = this.#audio.currentTime;
    if (!agora && Math.abs(t - this.#ultimoSalvo) < 5) return;
    this.#ultimoSalvo = t;
    guardar.gravar(chavePosicao(f.id), t >= 10 ? String(Math.floor(t)) : null);
  }

  #desenharTempo(t: number, duracao: number): void {
    const total = Number.isFinite(duracao) && duracao > 0 ? duracao : (this.#faixa?.segundos ?? 0);
    const p = total ? Math.min(100, (t / total) * 100) : 0;
    if (!this.#arrastando) this.#trilha.value = String(Math.floor(t));
    this.#trilha.style.setProperty('--p', `${p}%`);
    this.#trilha.setAttribute('aria-valuetext', `${tempoPorExtenso(t)} de ${tempoPorExtenso(total)}`);
    this.#atual.textContent = formatarTempo(t);
    this.#total.textContent = formatarTempo(total);
    if (this.#sub.dataset['erro'] === undefined && this.#faixa && t > 0 && !this.#audio.paused) {
      this.#sub.textContent = this.#faixa.rotulo;
    }
  }

  #desenharBuffer(): void {
    const a = this.#audio;
    if (!a.buffered.length || !Number.isFinite(a.duration)) return;
    const fim = a.buffered.end(a.buffered.length - 1);
    this.#trilha.style.setProperty('--b', `${Math.min(100, (fim / a.duration) * 100)}%`);
  }

  #estado(e: 'parado' | 'tocando' | 'carregando'): void {
    this.#painel.dataset['estado'] = e;
    this.#play.setAttribute('aria-label', e === 'tocando' ? 'Pausar' : 'Tocar');
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = e === 'parado' ? 'paused' : 'playing';
    this.#anunciar();
  }

  #erro(msg: string | null): void {
    if (msg) {
      this.#sub.textContent = msg;
      this.#sub.dataset['erro'] = '';
      this.#estado('parado');
    } else {
      delete this.#sub.dataset['erro'];
    }
  }

  // Avisa a página (botões "Ouvir") sobre o estado atual.
  #anunciar(): void {
    sincronizarBotoes(this);
  }
}

// Os botões [data-tocar] refletem o estado: o do episódio em reprodução vira "Pausar".
function sincronizarBotoes(player: CjPlayer): void {
  const id = player.faixaAtual?.id;
  const tocando = player.tocando;
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-tocar]:not([data-inicio])')) {
    const ativo = b.dataset['id'] === id && tocando;
    b.toggleAttribute('data-tocando', ativo);
    const texto = b.querySelector('[data-texto]');
    if (texto) texto.textContent = ativo ? 'Pausar' : b.dataset['id'] === id ? 'Continuar' : (b.dataset['textoOriginal'] ?? 'Ouvir');
  }
}

if (!customElements.get('cj-player')) customElements.define('cj-player', CjPlayer);

const obterPlayer = () => document.querySelector<CjPlayer>('cj-player');

// Delegação: um ouvinte no documento serve todas as páginas (o documento persiste com o ClientRouter).
document.addEventListener('click', (ev) => {
  const botao = (ev.target as Element).closest<HTMLButtonElement>('[data-tocar]');
  if (!botao) return;
  const faixa = faixaDoBotao(botao);
  const player = obterPlayer();
  const inicio = botao.dataset['inicio'];
  if (faixa && player) player.tocar(faixa, inicio === undefined ? undefined : Number(inicio));
});

// A cada navegação, os botões da página nova mostram o estado do player.
document.addEventListener('astro:page-load', () => {
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-tocar]')) {
    b.dataset['textoOriginal'] ??= b.querySelector('[data-texto]')?.textContent ?? 'Ouvir';
  }
  const player = obterPlayer();
  if (player) sincronizarBotoes(player);
});
