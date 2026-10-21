// Range HTTP de um pedido de áudio, calculado pelo Worker (worker.js).

/** "bytes=a-b", "bytes=a-" ou "bytes=-n" -> { inicio, fim } dentro do arquivo; null se não houver Range válido. */
export function intervalo(cabecalho, tamanho) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((cabecalho ?? '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  if (m[1] === '') {
    const n = Math.min(Number(m[2]), tamanho);
    return n > 0 ? { inicio: tamanho - n, fim: tamanho - 1 } : null;
  }
  const inicio = Number(m[1]);
  const fim = m[2] === '' ? tamanho - 1 : Math.min(Number(m[2]), tamanho - 1);
  return inicio <= fim ? { inicio, fim } : null;
}
