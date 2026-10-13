// Leitura de transcrição WebVTT (https://www.w3.org/TR/webvtt1/) para exibir como texto na página.
// Agrupa as falas por locutor (tag <v Nome>), mantendo o tempo de início de cada bloco.

export interface Fala {
  inicio: string; // "mm:ss" ou "h:mm:ss"
  segundos: number;
  locutor?: string;
  texto: string;
}

const RE_TEMPO = /^(?:(\d+):)?(\d{2}):(\d{2})\.\d{3}\s+-->/;

export function lerVtt(conteudo: string): Fala[] {
  const blocos = conteudo.replace(/\r/g, '').split(/\n{2,}/);
  if (!blocos[0]?.startsWith('WEBVTT')) throw new Error('transcrição sem cabeçalho WEBVTT');
  const falas: Fala[] = [];
  for (const bloco of blocos.slice(1)) {
    const linhas = bloco.split('\n');
    const i = linhas.findIndex((l) => RE_TEMPO.test(l));
    if (i === -1) continue; // NOTE, STYLE, REGION
    const [, h, m, s] = linhas[i]!.match(RE_TEMPO)!;
    const segundos = Number(h ?? 0) * 3600 + Number(m) * 60 + Number(s);
    let texto = linhas.slice(i + 1).join(' ').trim();
    const voz = texto.match(/^<v(?:\.[\w.-]+)?\s+([^>]+)>/);
    const locutor = voz?.[1]?.trim();
    texto = texto.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if (!texto) continue;
    const anterior = falas.at(-1);
    if (anterior && anterior.locutor === locutor) {
      anterior.texto += ` ${texto}`;
    } else {
      const inicio = h ? `${Number(h)}:${m}:${s}` : `${Number(m)}:${s}`;
      falas.push({ inicio, segundos, ...(locutor ? { locutor } : {}), texto });
    }
  }
  return falas;
}
