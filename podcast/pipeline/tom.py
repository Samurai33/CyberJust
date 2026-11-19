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
# Sussurro (episódio 11): sem vibração das cordas vocais, some a energia grave (80-500 Hz) em relação à de 1-5 kHz.
# Também quase não há quadros com F0 (tom de voz). Janela de 0,5 s suspeita = grave LIMITE_GRAVE_DB abaixo da mediana
# do locutor E menos de LIMITE_VOZ dos quadros com F0. O sussurro do Samurai (ep. 11, 2:54) deu 6 janelas seguidas
# com voz 0,00 a 0,19; fala normal fica acima de 0,5, e sons de "s" e "ch" dão janelas soltas.
LIMITE_GRAVE_DB = 6.0
LIMITE_VOZ = 0.3
JANELAS_SUSSURRO = 3


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
        f0s = [m[4]["f0"] for m in do_locutor if m[4]["f0"]]
        mf0 = statistics.median(f0s) if f0s else None  # sem F0 medido (áudio ruim): compara só o brilho
        mbr = statistics.median([m[4]["brilho"] for m in do_locutor])
        for i, a, _, texto, m in do_locutor:
            df0 = (m["f0"] / mf0 - 1) if m["f0"] and mf0 else 0.0
            dbr = m["brilho"] / mbr - 1
            if df0 > LIMITE_F0 or dbr > LIMITE_BRILHO:
                fora.append({"fala": i, "inicio": round(a, 2), "locutor": quem, "f0": round(df0, 2),
                             "brilho": round(dbr, 2), "texto": texto[:80]})
    ja = {f["fala"] for f in fora}
    fora += [s for s in sussurros(sinal, falas) if s["fala"] not in ja]
    return sorted(fora, key=lambda f: f["inicio"])


def _grave_agudo(w):
    n = 1024
    fr = np.fft.rfftfreq(n, 1 / SR)
    grave, agudo = (fr >= 80) & (fr < 500), (fr >= 1000) & (fr < 5000)
    g = h = 0.0
    for k in range(0, len(w) - n, n // 2):
        e = np.abs(np.fft.rfft(w[k:k + n] * np.hanning(n))) ** 2
        g += e[grave].sum()
        h += e[agudo].sum()
    return 10 * np.log10((g + 1e-12) / (h + 1e-12))


def _voz(w, piso):
    quadros = [w[k:k + 512] for k in range(0, len(w) - 512, 512)]
    fortes = [q for q in quadros if np.sqrt(np.mean(q ** 2)) >= piso]
    return sum(1 for q in fortes if _f0(q)) / len(fortes) if fortes else 1.0


def sussurros(sinal, falas):
    """Falas com trecho sussurrado: JANELAS_SUSSURRO janelas suspeitas seguidas (ver LIMITE_GRAVE_DB e LIMITE_VOZ).
    Mesmo formato de analisar(), com motivo "sussurro" e grave_db (a pior janela)."""
    passo, piso = SR // 2, 10 ** (-40 / 20)
    janelas = []  # (fala, inicio da janela, locutor, grave/agudo em dB ou None se for pausa, fração com F0)
    for i, (a, b, quem, _) in enumerate(falas):
        s = sinal[int(a * SR):int(b * SR)]
        for j in range(0, max(1, len(s) - passo), passo):
            w = s[j:j + passo]
            janelas.append((i, a + j / SR, quem, _grave_agudo(w) if np.sqrt(np.mean(w ** 2)) >= piso else None,
                            _voz(w, piso)))
    achados = {}
    for quem in {j[2] for j in janelas}:
        valores = [j[3] for j in janelas if j[2] == quem and j[3] is not None]
        if not valores:
            continue
        mediana, seguidas = statistics.median(valores), []
        def suspeita(q, r, v):
            return q == quem and r is not None and r < mediana - LIMITE_GRAVE_DB and v < LIMITE_VOZ

        for i, t, q, r, v in janelas + [(-1, 0, quem, None, 1.0)]:
            if suspeita(q, r, v) and (not seguidas or seguidas[-1][0] == i):
                seguidas.append((i, t, r))
                continue
            if len(seguidas) >= JANELAS_SUSSURRO and seguidas[0][0] not in achados:
                fala = seguidas[0][0]
                achados[fala] = {"fala": fala, "inicio": round(seguidas[0][1], 2), "locutor": quem, "f0": 0.0,
                                 "brilho": 0.0, "motivo": "sussurro",
                                 "grave_db": round(float(min(x[2] for x in seguidas) - mediana), 1), "texto": falas[fala][3][:80]}
            seguidas = [(i, t, r)] if suspeita(q, r, v) else []
    return list(achados.values())
