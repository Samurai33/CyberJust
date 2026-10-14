"""Peças compartilhadas do pipeline: pastas de trabalho, JSON e chamadas ao Gemini com novas tentativas."""
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

DADOS = Path(os.environ.get("DADOS", "/dados"))
# Um episódio = uma pasta em trabalho/<slug>/ com todos os artefatos de cada etapa.
TRABALHO = DADOS / "trabalho"
TEMAS = ["fraudes", "dados-pessoais", "protecao-infantil", "corrupcao"]
LOCUTORES = {"samurai": "Samurai", "coapresentadora": os.environ.get("NOME_COAPRESENTADORA", "Sara")}


def log(*partes):
    print(*partes, file=sys.stderr, flush=True)


def ler(caminho):
    return json.loads(Path(caminho).read_text(encoding="utf-8"))


def gravar(caminho, dados):
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    tmp = caminho.with_suffix(caminho.suffix + ".tmp")
    tmp.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(caminho)  # escrita atômica: uma etapa interrompida não deixa JSON pela metade


def slug(texto, maximo=60):
    t = unicodedata.normalize("NFKD", texto.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    if len(t) <= maximo:
        return t
    return t[: maximo + 1].rsplit("-", 1)[0]  # corta entre palavras


def pasta_episodio(nome):
    p = TRABALHO / nome
    p.mkdir(parents=True, exist_ok=True)
    return p


# ---------- Gemini (plano gratuito) ----------
# O plano gratuito não inclui a busca no Google (429 com a ferramenta google_search) e devolve 503 em picos de uso.
MODELOS = os.environ.get("GEMINI_MODELOS", "gemini-flash-latest,gemini-3.5-flash,gemini-flash-lite-latest").split(",")
_cliente = None


def gemini(conteudo, *, instrucao=None, esquema=None, temperatura=0.2):
    """Gera texto (ou JSON, se houver esquema). Tenta de novo com espera e troca de modelo em 429/5xx."""
    global _cliente
    from google import genai
    from google.genai import types

    if _cliente is None:
        _cliente = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    config = types.GenerateContentConfig(
        system_instruction=instrucao,
        temperature=temperatura,
        **({"response_mime_type": "application/json", "response_json_schema": esquema} if esquema else {}),
    )
    for modelo in MODELOS:
        for espera in (0, 15, 45):
            time.sleep(espera)
            try:
                r = _cliente.models.generate_content(model=modelo, contents=conteudo, config=config)
            except genai.errors.APIError as e:
                log(f"gemini {modelo}: {e.code}")
                if e.code not in (429, 500, 503):
                    raise
                continue
            u = r.usage_metadata
            log(f"gemini {modelo}: {u.prompt_token_count} + {u.candidates_token_count} tokens")
            return json.loads(r.text) if esquema else r.text
    raise SystemExit("Gemini indisponível em todos os modelos; tente mais tarde.")
