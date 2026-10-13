// Leitura mínima de MP4/M4A no build: duração (mvhd), tamanho e se o arquivo serve para streaming.
// O navegador só toca por HTTP Range sem baixar tudo se o índice ("moov") vier antes dos dados ("mdat"):
// é o que o `ffmpeg -movflags +faststart` faz. Sem isso, o build falha com a instrução de correção.
import { closeSync, fstatSync, openSync, readSync } from 'node:fs';

export interface InfoAudio {
  segundos: number;
  bytes: number;
}

function ler(fd: number, pos: number, n: number): Buffer {
  const b = Buffer.alloc(n);
  readSync(fd, b, 0, n, pos);
  return b;
}

/** Percorre as caixas (atoms) de [inicio, fim) e devolve [tipo, posição, tamanho] de cada uma. */
function caixas(fd: number, inicio: number, fim: number): [string, number, number][] {
  const lista: [string, number, number][] = [];
  let pos = inicio;
  while (pos + 8 <= fim) {
    const h = ler(fd, pos, 16);
    let tam = h.readUInt32BE(0);
    const tipo = h.toString('latin1', 4, 8);
    if (tam === 1) tam = Number(h.readBigUInt64BE(8));
    else if (tam === 0) tam = fim - pos;
    if (tam < 8) break;
    lista.push([tipo, pos, tam]);
    pos += tam;
  }
  return lista;
}

export function lerInfoAudio(caminho: string): InfoAudio {
  const fd = openSync(caminho, 'r');
  try {
    const bytes = fstatSync(fd).size;
    const topo = caixas(fd, 0, bytes);
    const tipos = topo.map(([t]) => t);
    const moov = topo.find(([t]) => t === 'moov');
    if (tipos[0] !== 'ftyp' || !moov) throw new Error(`${caminho}: não é um MP4/M4A válido (caixas: ${tipos.join(', ')})`);
    if (tipos.indexOf('mdat') !== -1 && tipos.indexOf('mdat') < tipos.indexOf('moov')) {
      throw new Error(
        `${caminho}: o índice (moov) está no fim do arquivo e o áudio não toca por streaming. ` +
          'Corrija com: ffmpeg -i entrada.m4a -map 0:a -c copy -movflags +faststart saida.m4a',
      );
    }
    const mvhd = caixas(fd, moov[1] + 8, moov[1] + moov[2]).find(([t]) => t === 'mvhd');
    if (!mvhd) throw new Error(`${caminho}: MP4 sem cabeçalho mvhd`);
    const c = ler(fd, mvhd[1] + 8, 32);
    const versao = c.readUInt8(0);
    const escala = versao === 1 ? c.readUInt32BE(20) : c.readUInt32BE(12);
    const duracao = versao === 1 ? Number(c.readBigUInt64BE(24)) : c.readUInt32BE(16);
    if (!escala || !duracao) throw new Error(`${caminho}: duração ausente no mvhd`);
    return { segundos: Math.round((duracao / escala) * 10) / 10, bytes };
  } finally {
    closeSync(fd);
  }
}
