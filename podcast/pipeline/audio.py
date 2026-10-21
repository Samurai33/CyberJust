"""Etapa 3: gera o áudio do roteiro aprovado com o Text to Dialogue da ElevenLabs e faz o acabamento.

Uso:
  python -m pipeline.audio <pasta>           ensaio: confere vozes e saldo e mostra o custo (grátis)
  python -m pipeline.audio <pasta> --gerar   gera de verdade (GASTA CRÉDITOS)

Ambiente: ELEVENLABS_API_KEY, VOZ_SAMURAI, VOZ_COAPRESENTADORA, MODELO_TTS (padrão eleven_v3, validado no piloto).
Saída em <pasta>: blocos/NN.mp3 (cada bloco salvo assim que chega e reaproveitado se o texto não mudou) e episodio.m4a.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from .comum import ler, log

API = "https://api.elevenlabs.io/v1"
LIMITE_BLOCO = 1900  # a doc do Text to Dialogue pede no máximo 2.000 caracteres somando os inputs de um pedido
MODELO = os.environ.get("MODELO_TTS", "eleven_v3")
# No Text to Dialogue a estabilidade é a única configuração de voz lida: menor = mais expressivo (0 pode alucinar).
ESTABILIDADE = float(os.environ.get("ESTABILIDADE_TTS", "0.5"))
VOZES = {"samurai": os.environ["VOZ_SAMURAI"], "coapresentadora": os.environ["VOZ_COAPRESENTADORA"]}


def api(caminho, corpo=None):
    req = urllib.request.Request(
        f"{API}/{caminho}",
        data=json.dumps(corpo).encode() if corpo is not None else None,
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"},
        method="POST" if corpo is not None else "GET",
    )
    # 429 (fila cheia) e 5xx voltam sem áudio: espera e tenta de novo. Timeout NÃO é repetido, porque o pedido
    # pode ter sido gerado e cobrado do lado de lá (o bloco pago não pode ser pago de novo).
    for tentativa in range(4):
        try:
            r = urllib.request.urlopen(req, timeout=300)
            return r.read(), r.headers
        except urllib.error.HTTPError as e:
            erro = f"ElevenLabs {e.code} em {caminho.split('?')[0]}: {e.read()[:400].decode(errors='replace')}"
            if e.code not in (429, 500, 502, 503, 504) or tentativa == 3:
                raise SystemExit(erro)
            log(f"{erro}; nova tentativa em {30 * (tentativa + 1)} s")
            time.sleep(30 * (tentativa + 1))


# Rede de segurança do tom (episódio 14, 4:03: [excited] no Samurai saiu quase gritado). Mesmo que o roteiro traga
# essas tags, elas não chegam à ElevenLabs; a Sara pode usar [excited], o Samurai não.
PROIBIDAS = {"samurai": re.compile(r"\[(excited|shouting|angry|yelling|shouts|furious)\]\s*", re.I),
             "coapresentadora": re.compile(r"\[(shouting|angry|yelling|shouts|furious)\]\s*", re.I)}


def texto_seguro(fala):
    return PROIBIDAS[fala["quem"]].sub("", fala["texto"]).replace("!!", "!").strip()


def saldo():
    a = json.loads(api("user/subscription")[0])
    return a["character_limit"] - a["character_count"], a["character_limit"]


def blocos(falas, pasta=None):
    """Falas inteiras agrupadas até o limite: nunca corta uma fala no meio.

    Se o episódio já foi gerado, usa a divisão gravada em blocos/grupos.json: editar uma fala depois (por exemplo,
    tirar uma tag) não pode redistribuir as falas, senão os blocos já pagos deixariam de ser reaproveitados."""
    if pasta and (pasta / "blocos" / "grupos.json").exists():
        indices = json.loads((pasta / "blocos" / "grupos.json").read_text())
        return [[falas[i] for i in g] for g in indices]
    saida, atual = [], []
    for f in falas:
        if atual and sum(len(x["texto"]) for x in atual) + len(f["texto"]) > LIMITE_BLOCO:
            saida.append(atual)
            atual = []
        atual.append(f)
    return saida + [atual]


def acabamento(partes, destino):
    """Junta os blocos e normaliza em duas passadas: -16 LUFS e pico abaixo de -1 dBTP (Apple e Spotify pedem até -1).

    O encoder AAC cria picos entre amostras depois do limitador (no piloto, -0,89 dBTP com limite em -1,5 dBFS),
    então a margem antes do encoder é maior."""
    lista = destino.parent / "blocos" / "lista.txt"
    lista.write_text("".join(f"file '{p.resolve()}'\n" for p in partes))
    entrada = ["-f", "concat", "-safe", "0", "-i", str(lista)]
    alvo = "I=-16:TP=-2:LRA=11"
    medida = subprocess.run(["ffmpeg", "-hide_banner", *entrada, "-af", f"loudnorm={alvo}:print_format=json", "-f", "null", "-"],
                            capture_output=True, text=True, check=True).stderr
    m = json.loads(medida[medida.rindex("{"):medida.rindex("}") + 1])
    normaliza = (f"loudnorm={alvo}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
                 f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    # O alimiter só vê a amostra digital; o AAC cria picos entre amostras (true peak). Limitar com sobreamostragem
    # de 4x aproxima o true peak. A conferência mede o arquivo final e ajusta ganho e limite até os dois baterem.
    ganho, limite = 0.0, 0.79  # 0,79 ≈ -2 dBFS
    for _ in range(5):
        cadeia = (f"{normaliza},volume={ganho:.2f}dB,aresample=176400,"
                  f"alimiter=limit={limite:.3f}:attack=1:release=50:level=false,aresample=44100")
        # AAC em MP4 com o índice no início (faststart): o build do site (src/lib/mp4.ts) falha sem isso.
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *entrada, "-af", cadeia, "-ac", "1", "-ar", "44100",
                        "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(destino)], check=True)
        saida = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(destino), "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                               capture_output=True, text=True).stderr
        f = json.loads(saida[saida.rindex("{"):saida.rindex("}") + 1])
        lufs, pico = float(f["input_i"]), float(f["input_tp"])
        if abs(lufs + 16) <= 0.5 and pico <= -1.0:
            log(f"acabamento: {lufs} LUFS, pico {pico} dBTP")
            return
        if pico > -1.0:
            limite *= 10 ** ((-1.3 - pico) / 20)  # baixa o teto o quanto o pico passou, com folga de 0,3 dB
        if abs(lufs + 16) > 0.5:
            ganho += -16 - lufs
        log(f"acabamento: {lufs} LUFS, pico {pico} dBTP; ajustando ganho {ganho:+.2f} dB, limite {limite:.3f}")
    raise SystemExit("Não consegui chegar a -16 LUFS com pico abaixo de -1 dBTP; revise o áudio.")


def duracao(arquivo):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(arquivo)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def silencios(arquivo, ini, fim):
    """Silêncios reais (pelo menos 0,12 s abaixo de -40 dB) entre ini e fim, em segundos do arquivo."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-ss", f"{ini:.3f}", "-t", f"{fim - ini:.3f}", "-i", str(arquivo),
                        "-af", "silencedetect=noise=-40dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True)
    comecos = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    fins = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    return [(ini + s, ini + e) for s, e in zip(comecos, fins)]


def no_silencio(arquivo, t, desde=0.0, ate=float("inf"), raio=0.8):
    """Leva o ponto de corte t para o meio do silêncio real mais perto (até raio segundos), entre desde e ate.

    Os tempos da legenda vêm do Whisper, que erra o fim e o começo de siglas e números: no episódio do Smart Sampa
    (21/10/2026) o corte caiu 0,4 s antes do silêncio e comeu o "U-B-S" do Samurai e o começo do "Quatrocentas".
    Sem silêncio por perto, fica o tempo da legenda."""
    perto = [(s, e) for s, e in silencios(arquivo, max(0.0, t - raio), t + raio) if desde <= (s + e) / 2 <= ate]
    if not perto:
        return t
    s, e = min(perto, key=lambda x: 0.0 if x[0] <= t <= x[1] else min(abs(t - x[0]), abs(t - x[1])))
    return (s + e) / 2


def refazer_fala(pasta, n, gerar):
    """Regenera só a fala n (índice 0) e a encaixa no bloco bruto, sem tocar no resto do episódio.

    Usa os tempos da legenda (uma entrada por fala) para achar a fala dentro do bloco; o corte cai no silêncio entre
    as falas vizinhas. A fala nova sai sem tags e com estabilidade 0,5 (neutra). Depois o acabamento roda de novo.
    """
    from .tom import ler_vtt

    roteiro = ler(pasta / "roteiro.json")
    if (pasta / "episodio.vtt").stat().st_mtime < (pasta / "episodio.m4a").stat().st_mtime:
        # Os tempos do corte vêm da legenda: legenda mais velha que o áudio (outra fala refeita depois dela) corta no lugar errado.
        raise SystemExit("A legenda é mais antiga que o áudio; rode python -m pipeline.legenda <pasta> antes de refazer outra fala.")
    falas, cues = roteiro["falas"], ler_vtt(pasta / "episodio.vtt")
    if len(cues) != len(falas):
        raise SystemExit("A legenda não tem uma entrada por fala; rode a etapa de legenda antes.")
    fala = falas[n]
    texto = re.sub(r"\s*\[[^\]]+\]\s*", " ", fala["texto"]).strip()
    log(f"fala {n} ({fala['quem']}, {cues[n][0]:.1f}s): {len(texto)} caracteres")
    if not gerar:
        return log("ENSAIO: nada foi gerado. Use --gerar para gastar os créditos.")

    grupos = blocos(falas, pasta)
    k = next(i for i, b in enumerate(grupos) if any(f is fala for f in b))
    partes = [pasta / "blocos" / f"{i:02d}.mp3" for i in range(1, len(grupos) + 1)]
    inicio_bloco = sum(duracao(p) for p in partes[:k])
    # Janela de corte: metade do silêncio antes e depois da fala, no tempo do bloco ATUAL (os tempos vêm da legenda do
    # áudio atual). Até 14/10/2026 o corte era feito no .orig.mp3: a segunda fala refeita no mesmo bloco apagava a
    # primeira e cortava fora do lugar (episódio 2: das 8 falas refeitas, as 5, 6, 10 e 29 ficaram de fora).
    a = (cues[n - 1][1] + cues[n][0]) / 2 if n else cues[n][0]
    b = (cues[n][1] + cues[n + 1][0]) / 2 if n + 1 < len(cues) else cues[n][1]
    # A janela pode passar da borda do bloco quando a fala é a primeira ou a última dele (o silêncio vizinho está no
    # bloco ao lado); o atrim com tempo negativo falha.
    a, b = max(0.0, a - inicio_bloco), min(duracao(partes[k]), b - inicio_bloco)
    # O corte vai para o silêncio real mais perto: a antes do fim da fala, b depois do começo dela (uma pausa no meio
    # da própria fala, como "gravíssimo... e nas escolas?", não pode virar ponto de corte).
    ini_fala, fim_fala = cues[n][0] - inicio_bloco, cues[n][1] - inicio_bloco
    a = no_silencio(partes[k], a, ate=min(ini_fala + 0.3, fim_fala))
    b = no_silencio(partes[k], b, desde=max(fim_fala - 0.3, ini_fala))
    log(f"corte no bloco {k + 1}: {a:.2f}s a {b:.2f}s")

    corpo = {"model_id": MODELO, "language_code": "pt", "inputs": [{"text": texto, "voice_id": VOZES[fala["quem"]]}],
             "seed": 2033, "settings": {"stability": float(os.environ.get("ESTABILIDADE_REFAZER", "0.5"))}}
    audio, cab = api("text-to-dialogue?output_format=mp3_44100_192", corpo)
    nova = pasta / "blocos" / f"fala-{n:03d}.mp3"
    nova.write_bytes(audio)
    log(f"fala nova: {cab.get('character-cost', '?')} créditos")

    alvo = partes[k]
    original = alvo.with_suffix(".orig.mp3")
    if not original.exists():
        shutil.copyfile(alvo, original)  # cópia de segurança do bloco como veio da ElevenLabs (não é usada no corte)
    meio = max(0.15, (b - a - duracao(nova)) / 2) if b - a > duracao(nova) else 0.15
    # antes do corte + silêncio + fala nova (sem silêncio nas pontas) + silêncio + depois do corte
    filtro = (f"[0:a]atrim=0:{a:.3f},asetpts=N/SR/TB[x];"
              f"[1:a]silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
              f"silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
              f"adelay={int(meio * 1000)},apad=pad_dur={meio:.3f},aresample=44100[y];"
              f"[0:a]atrim=start={b:.3f},asetpts=N/SR/TB[z];[x][y][z]concat=n=3:v=0:a=1[s]")
    tmp = alvo.with_suffix(".novo.mp3")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(alvo), "-i", str(nova), "-filter_complex", filtro,
                    "-map", "[s]", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k", str(tmp)], check=True)
    tmp.replace(alvo)

    fala["texto"] = texto
    (pasta / "roteiro.json").write_text(json.dumps(roteiro, ensure_ascii=False, indent=1), encoding="utf-8")
    marca = alvo.with_suffix(".json")  # o bloco continua válido para reaproveitamento com o texto novo
    assinatura = json.loads(marca.read_text(encoding="utf-8"))
    assinatura["falas"] = [[f["quem"], f["texto"]] for f in grupos[k]]
    marca.write_text(json.dumps(assinatura, ensure_ascii=False), encoding="utf-8")
    acabamento(partes, pasta / "episodio.m4a")
    log(f"fala {n} trocada no bloco {k + 1}; rode a etapa de legenda para conferir o tom")


def main():
    if sys.argv[1] == "--saldo":  # consulta grátis, usada pelo /status do bot
        livre, limite = saldo()
        pct = f"{100 * livre / limite:.1f}".replace(".", ",") if limite else "?"
        return log(f"créditos ElevenLabs: {livre} livres de {limite} ({pct}% livres)")
    pasta = Path(sys.argv[1])
    gerar = "--gerar" in sys.argv
    if "--refazer-fala" in sys.argv:  # --refazer-fala N: troca só uma fala que saiu fora do tom
        return refazer_fala(pasta, int(sys.argv[sys.argv.index("--refazer-fala") + 1]), gerar)
    # --so-bloco N: gera só esse bloco, para comparar modelo, texto ou voz gastando pouco (não monta o episódio).
    so = int(sys.argv[sys.argv.index("--so-bloco") + 1]) if "--so-bloco" in sys.argv else None
    roteiro = ler(pasta / "roteiro.json")
    grupos = blocos(roteiro["falas"], pasta)
    total = sum(len(f["texto"]) for f in (grupos[so - 1] if so else roteiro["falas"]))

    minhas = {v["voice_id"]: v["name"] for v in json.loads(api("voices")[0])["voices"]}
    for papel, vid in VOZES.items():
        log(f"{papel}: {minhas.get(vid, 'NÃO ESTÁ EM MY VOICES')} ({vid})")
    livre, limite = saldo()
    log(f"{MODELO}: {len(grupos)} blocos, {total} caracteres; saldo {livre} de {limite}")
    if not gerar:
        log("ENSAIO: nada foi gerado. Use --gerar para gastar os créditos.")
        return
    if any(vid not in minhas for vid in VOZES.values()):
        raise SystemExit("Adicione as vozes em My Voices antes de gerar.")
    if total > livre:
        raise SystemExit("Saldo insuficiente.")

    (pasta / "blocos").mkdir(exist_ok=True)
    posicao = {id(f): i for i, f in enumerate(roteiro["falas"])}
    (pasta / "blocos" / "grupos.json").write_text(json.dumps([[posicao[id(f)] for f in g] for g in grupos]))
    partes, custo = [], 0
    for i, b in enumerate(grupos, 1):
        if so and i != so:
            continue
        p = pasta / "blocos" / f"{i:02d}-{MODELO}.mp3" if so else pasta / "blocos" / f"{i:02d}.mp3"
        marca = p.with_suffix(".json")
        assinatura = {"modelo": MODELO, "estabilidade": ESTABILIDADE, "vozes": VOZES, "falas": [[f["quem"], f["texto"]] for f in b]}
        if p.exists() and marca.exists() and json.loads(marca.read_text(encoding="utf-8")) == assinatura:
            log(f"bloco {i}/{len(grupos)} reaproveitado")
            partes.append(p)
            continue
        corpo = {
            "model_id": MODELO,
            "language_code": "pt",
            "inputs": [{"text": texto_seguro(f), "voice_id": VOZES[f["quem"]]} for f in b],
            "seed": 1033,
            "settings": {"stability": ESTABILIDADE},
        }
        # Sem previous_request_ids: o eleven_v3 recusa com 400 (piloto de 13/10/2026).
        audio, cab = api("text-to-dialogue?output_format=mp3_44100_192", corpo)
        p.write_bytes(audio)
        marca.write_text(json.dumps(assinatura, ensure_ascii=False), encoding="utf-8")
        partes.append(p)
        custo += int(cab.get("character-cost") or 0)
        log(f"bloco {i}/{len(grupos)} ok ({len(audio) // 1024} KB, {cab.get('character-cost', '?')} créditos)")

    if so:
        livre, limite = saldo()
        log(f"bloco {so} pronto em {partes[0]}; {custo} créditos; saldo {livre} de {limite}")
        print(json.dumps({"custo": custo, "saldo": livre, "arquivo": str(partes[0])}))
        return
    acabamento(partes, pasta / "episodio.m4a")
    livre, limite = saldo()
    log(f"pronto: {pasta / 'episodio.m4a'}; {custo} créditos nesta execução; saldo {livre} de {limite}")
    print(json.dumps({"custo": custo, "saldo": livre}))


if __name__ == "__main__":
    main()
