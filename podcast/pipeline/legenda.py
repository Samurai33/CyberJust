"""Etapa 4: transcrição WebVTT, tempos dos capítulos e controle de qualidade do áudio.

Uso: python -m pipeline.legenda <pasta>
O texto da legenda é o do roteiro (grafia certa); o Whisper só dá o tempo de cada palavra, que é alinhado ao roteiro.
Saída em <pasta>: episodio.vtt, capitulos.json e qa.json. Custo: zero (Whisper local na CPU).
"""
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

from .comum import LOCUTORES, gravar, ler, log
from .tom import analisar

UNIDADES = "zero um dois três quatro cinco seis sete oito nove dez onze doze treze quatorze quinze dezesseis dezessete dezoito dezenove".split()


def normalizar(texto):
    t = re.sub(r"\[[^\]]+\]", " ", texto.lower())  # tags de emoção não são faladas
    t = unicodedata.normalize("NFKD", t)
    t = "".join(c for c in t if not unicodedata.combining(c))
    palavras = re.sub(r"[^a-z0-9 ]+", " ", t).split()
    # O Whisper escreve números pequenos em algarismos; o roteiro, por extenso.
    return [UNIDADES[int(p)] if p.isdigit() and int(p) < 20 else p for p in palavras]


def tempo_vtt(s):
    h, r = divmod(s, 3600)
    m, r = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{r:06.3f}"


def tempo_curto(s):
    h, r = divmod(int(s), 3600)
    m, s = divmod(r, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def medir(audio):
    info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(audio)],
                                     capture_output=True, text=True, check=True).stdout)
    saida = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(audio), "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    m = json.loads(saida[saida.rindex("{"):saida.rindex("}") + 1])
    cabeca = audio.read_bytes()[:500_000]
    moov, mdat = cabeca.find(b"moov"), cabeca.find(b"mdat")
    return {
        "duracao_s": round(float(info["format"]["duration"]), 1),
        "lufs": float(m["input_i"]),
        "pico_dbtp": float(m["input_tp"]),
        "faststart": moov >= 0 and (mdat < 0 or moov < mdat),
    }


def main():
    pasta = Path(sys.argv[1])
    roteiro = ler(pasta / "roteiro.json")
    audio = pasta / "episodio.m4a"
    falas = roteiro["falas"]

    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(audio), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    # O texto vem do roteiro; o Whisper só dá os tempos. Busca gulosa (beam 1) e uma thread por CPU do contêiner
    # (compose.yml: cpus 4): no episódio 2 (6:52), 285 s -> 119 s com a mesma cobertura (93,7% -> 93,8%). O modelo
    # "base" faz em 38 s, mas cai para 91%, e os tempos servem também para cortar o áudio (--refazer-fala) e para a QA.
    modelo = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=int(os.environ.get("WHISPER_THREADS", "4")))
    segs, _ = modelo.transcribe(np.frombuffer(pcm, dtype=np.float32), language="pt", beam_size=1, word_timestamps=True)
    ditas = []  # (palavra normalizada, início, fim)
    for s in segs:
        for w in s.words:
            for p in normalizar(w.word):
                ditas.append((p, w.start, w.end))

    roteiro_palavras, dono = [], []  # palavra do roteiro e o índice da fala a que pertence
    for i, f in enumerate(falas):
        for p in normalizar(f["texto"]):
            roteiro_palavras.append(p)
            dono.append(i)

    casamento = difflib.SequenceMatcher(None, roteiro_palavras, [d[0] for d in ditas], autojunk=False)
    inicio, fim = [None] * len(falas), [None] * len(falas)
    acertos = 0
    for a, b, n in casamento.get_matching_blocks():
        for k in range(n):
            i, (_, ini, fi) = dono[a + k], ditas[b + k]
            inicio[i] = ini if inicio[i] is None else min(inicio[i], ini)
            fim[i] = fi if fim[i] is None else max(fim[i], fi)
            acertos += 1
    cobertura = acertos / max(len(roteiro_palavras), 1)

    # Fala sem nenhuma palavra reconhecida: ocupa o intervalo entre a anterior e a seguinte.
    total = float(ditas[-1][2]) if ditas else 0.0
    for i in range(len(falas)):
        if inicio[i] is None:
            inicio[i] = fim[i - 1] if i and fim[i - 1] is not None else 0.0
        if fim[i] is None:
            prox = next((inicio[j] for j in range(i + 1, len(falas)) if inicio[j] is not None), total)
            fim[i] = max(prox, inicio[i] + 0.5)
    inicio[0] = 0.0

    def limpar(t):
        t = re.sub(r"\s*\[[^\]]+\]\s*", " ", t).strip()
        return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    linhas = ["WEBVTT", ""]
    for i, f in enumerate(falas):
        fim_cue = min(fim[i], inicio[i + 1]) if i + 1 < len(falas) else fim[i]
        linhas += [f"{tempo_vtt(inicio[i])} --> {tempo_vtt(max(fim_cue, inicio[i] + 0.3))}",
                   f"<v {LOCUTORES[f['quem']]}>{limpar(f['texto'])}", ""]
    (pasta / "episodio.vtt").write_text("\n".join(linhas), encoding="utf-8")

    capitulos = [{"inicio": tempo_curto(inicio[i]), "titulo": f["capitulo"][:80]} for i, f in enumerate(falas) if f.get("capitulo")]
    if capitulos:
        capitulos[0]["inicio"] = "0:00"
    gravar(pasta / "capitulos.json", capitulos)

    qa = medir(audio) | {"cobertura_alinhamento": round(cobertura, 3)}
    # Fala gritada ou eufórica (episódio 14, 4:03): voz bem mais aguda e brilhante que a mediana do locutor.
    qa["fora_do_tom"] = analisar(audio, pasta / "episodio.vtt")
    qa["aprovado"] = (qa["faststart"] and qa["pico_dbtp"] <= -1.0 and abs(qa["lufs"] + 16) <= 1.0 and cobertura >= 0.85
                      and not qa["fora_do_tom"])
    gravar(pasta / "qa.json", qa)
    log(json.dumps(qa, ensure_ascii=False))
    for c in capitulos:
        log(f"  {c['inicio']:>6}  {c['titulo']}")


if __name__ == "__main__":
    main()
