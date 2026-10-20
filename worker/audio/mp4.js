// Leitura mínima de MP4/M4A: duração (mvhd), tamanho e se o arquivo serve para streaming.
// Usado pelo Worker na hora do envio (nada sem faststart entra no R2) e pelo scripts/audio-r2.mjs.
// O navegador só toca por HTTP Range sem baixar tudo se o índice ("moov") vier antes dos dados ("mdat"):
// é o que o `ffmpeg -movflags +faststart` faz.

/** Percorre as caixas (atoms) de [inicio, fim) e devolve [tipo, posição, tamanho] de cada uma. */
function caixas(v, inicio, fim) {
  const lista = [];
  let pos = inicio;
  while (pos + 8 <= fim) {
    let tam = v.getUint32(pos);
    const tipo = String.fromCharCode(v.getUint8(pos + 4), v.getUint8(pos + 5), v.getUint8(pos + 6), v.getUint8(pos + 7));
    if (tam === 1) tam = pos + 16 <= fim ? Number(v.getBigUint64(pos + 8)) : 0;
    else if (tam === 0) tam = fim - pos;
    if (tam < 8) break;
    lista.push([tipo, pos, tam]);
    pos += tam;
  }
  return lista;
}

/**
 * @param {Uint8Array} bytes o arquivo inteiro
 * @returns {{ segundos: number, bytes: number }}
 */
export function infoMp4(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const topo = caixas(v, 0, bytes.byteLength);
  const tipos = topo.map(([t]) => t);
  const moov = topo.find(([t]) => t === 'moov');
  if (tipos[0] !== 'ftyp' || !moov) throw new Error(`não é um MP4/M4A válido (caixas: ${tipos.join(', ')})`);
  if (tipos.indexOf('mdat') !== -1 && tipos.indexOf('mdat') < tipos.indexOf('moov')) {
    throw new Error(
      'o índice (moov) está no fim do arquivo e o áudio não toca por streaming. ' +
        'Corrija com: ffmpeg -i entrada.m4a -map 0:a -c copy -movflags +faststart saida.m4a',
    );
  }
  if (moov[1] + moov[2] > bytes.byteLength) throw new Error('arquivo cortado (moov incompleto)');
  const mvhd = caixas(v, moov[1] + 8, moov[1] + moov[2]).find(([t]) => t === 'mvhd');
  if (!mvhd) throw new Error('MP4 sem cabeçalho mvhd');
  const c = mvhd[1] + 8;
  const versao = v.getUint8(c);
  const escala = versao === 1 ? v.getUint32(c + 20) : v.getUint32(c + 12);
  const duracao = versao === 1 ? Number(v.getBigUint64(c + 24)) : v.getUint32(c + 16);
  if (!escala || !duracao) throw new Error('duração ausente no mvhd');
  return { segundos: Math.round((duracao / escala) * 10) / 10, bytes: bytes.byteLength };
}
