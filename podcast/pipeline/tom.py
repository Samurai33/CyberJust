"""Detector de fala fora do tom: compara cada fala com a mediana do próprio locutor.

No episódio 14, a fala com [excited] em 4:03 saiu quase gritada. O volume (RMS) não denunciou, porque a
masterização nivela tudo; o que denunciou foi a voz mais aguda (F0 +68%) e mais brilhante (centroide espectral
+41%) que a mediana do Samurai. Nenhuma outra fala passou de +30%. Limites abaixo com folga para a emoção normal.
"""
import re
import statistics
import subprocess

import numpy as np

SR = 16000
LIMITE_F0 = 0.40       # voz 40% mais aguda que a mediana do locutor
LIMITE_BRILHO = 0.35   # 35% mais energia nas frequências altas


def tempo(t):
    h, m, s = t.split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def ler_vtt(caminho):
    """Uma entrada por fala: (início, fim, locutor, texto)."""
    texto = open(caminho, encoding="utf-8").read()
    return [(tempo(a), tempo(b), quem, fala) for a, b, quem, fala in
            re.findall(r"([\d:.]+) --> ([\d:.]+)\n<v ([^>]+)>(.*)", texto)]


def pcm(audio):
    bruto = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(audio), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                           capture_output=True, check=True).stdout
    return np.frombuffer(bruto, dtype=np.float32)


def _f0(quadro):
    q = quadro - quadro.mean()
    ac = np.correlate(q, q, "full")[len(q) - 1:]
    lo, hi = SR // 400, SR // 70  # 70 a 400 Hz cobre voz masculina e feminina
    if ac[0] <= 0:
        return None
    k = lo + int(np.argmax(ac[lo:hi]))
    return SR / k if ac[k] / ac[0] > 0.4 else None


def medir_fala(x):
    """F0 e centroide medianos dos quadros com voz (os 40% mais fortes) de um trecho."""
    n = 512
    quadros = [x[i:i + n] for i in range(0, len(x) - n, n)]
    if len(quadros) < 8:
        return None
    energia = [float(np.sqrt(np.mean(q ** 2))) for q in quadros]
    corte = np.percentile(energia, 60)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    f0s, centros = [], []
    for q, e in zip(quadros, energia):
        if e < corte:
            continue
        espectro = np.abs(np.fft.rfft(q * np.hanning(n)))
        centros.append(float((espectro * freqs).sum() / (espectro.sum() + 1e-9)))
        p = _f0(q)
        if p:
            f0s.append(p)
    return {"f0": float(np.median(f0s)) if f0s else None, "brilho": float(np.median(centros))}


def analisar(audio, vtt):
    """Lista as falas fora do tom: [{fala, inicio, locutor, f0, brilho, texto}] com variação relativa à mediana."""
    sinal, falas = pcm(audio), ler_vtt(vtt)
    medidas = []
    for i, (a, b, quem, texto) in enumerate(falas):
        m = medir_fala(sinal[int(a * SR):int(b * SR)])
        if m:
            medidas.append((i, a, quem, texto, m))
    fora = []
    for quem in {m[2] for m in medidas}:
        do_locutor = [m for m in medidas if m[2] == quem]
        mf0 = statistics.median([m[4]["f0"] for m in do_locutor if m[4]["f0"]])
        mbr = statistics.median([m[4]["brilho"] for m in do_locutor])
        for i, a, _, texto, m in do_locutor:
            df0 = (m["f0"] / mf0 - 1) if m["f0"] else 0.0
            dbr = m["brilho"] / mbr - 1
            if df0 > LIMITE_F0 or dbr > LIMITE_BRILHO:
                fora.append({"fala": i, "inicio": round(a, 2), "locutor": quem, "f0": round(df0, 2),
                             "brilho": round(dbr, 2), "texto": texto[:80]})
    return sorted(fora, key=lambda f: f["inicio"])
