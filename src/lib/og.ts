// Imagem de prévia de link por episódio (1200x630 JPEG), gerada no build por src/pages/og/[arquivo].ts.
// O nome leva um hash do conteúdo da arte: mudou o título, muda a URL (as redes e a Cloudflare cacheiam).
import { createHash } from 'node:crypto';
import { infoAudio, nomeTema, rotuloEpisodio, type Episodio } from './episodios';
import { formatarTempo } from './tempo';

export const VERSAO_ARTE = 2;

export function dadosOg(ep: Episodio) {
  const audio = infoAudio(ep);
  return {
    rotulo: rotuloEpisodio(ep),
    tema: nomeTema(ep.data.tema),
    titulo: ep.data.titulo,
    ameaca: ep.data.ameaca,
    duracao: audio ? formatarTempo(audio.segundos) : 'em produção',
  };
}

export function urlOg(ep: Episodio): string {
  const hash = createHash('sha256').update(JSON.stringify([VERSAO_ARTE, dadosOg(ep)])).digest('hex').slice(0, 8);
  return `/og/${ep.id}-${hash}.jpg`;
}
