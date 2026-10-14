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


# ---------- Modelos de linguagem (planos gratuitos, em cadeia) ----------
# Gemini (principal, vários modelos: a sobrecarga 503 costuma ser por modelo), NVIDIA NIM e Cloudflare Workers AI.
# Fora (verificado em 14/10/2026): Mistral (API só no plano pago), OpenCode (grátis só dentro do app), Groq e
# GitHub Models (8 mil tokens por pedido, e os nossos têm de 10 a 36 mil).
#
# Regra de qualidade: texto que vai ao ar (ficha, roteiro, ajuste, revisão) só sai de modelo FORTE. O flash-lite
# só entra na triagem de pautas. Sem modelo forte disponível, a etapa falha com PROVEDORES OCUPADOS e o bot tenta
# de novo mais tarde, em vez de entregar um roteiro pior (13/10/2026: o flash-lite estragou ajuste e reescrita).
# A Cloudflare fica por último: o plano grátis tem 10 mil neurons por dia (uns 2 episódios inteiros).
FORTES = [
    ("gemini", "gemini-flash-latest"), ("gemini", "gemini-3.8-flash"), ("gemini", "gemini-3.7-flash"),
    ("gemini", "gemini-3.6-flash"), ("gemini", "gemini-3.5-flash"),
    ("nvidia", "nvidia/nemotron-3-super-120b-a12b"),
    ("cloudflare", "@cf/openai/gpt-oss-120b"),
]
TRIAGEM = FORTES + [("gemini", "gemini-flash-lite-latest")]
USADOS = []  # (tarefa, provedor, modelo) de cada chamada que deu certo, para o resumo no Telegram


class ProvedoresOcupados(SystemExit):
    pass


class _Tentar(Exception):
    """Erro passageiro (429, 5xx, rede, resposta vazia ou modelo fora do ar): passa para o próximo modelo."""


_gemini = None


def _chamar_gemini(modelo, conteudo, instrucao, esquema, temperatura):
    global _gemini
    from google import genai
    from google.genai import types

    if _gemini is None:
        _gemini = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    config = types.GenerateContentConfig(
        system_instruction=instrucao, temperature=temperatura,
        **({"response_mime_type": "application/json", "response_json_schema": esquema} if esquema else {}),
    )
    try:
        r = _gemini.models.generate_content(model=modelo, contents=conteudo, config=config)
    except genai.errors.APIError as e:
        if e.code in (404, 429, 500, 502, 503, 504):  # 404: modelo indisponível para esta chave
            raise _Tentar(f"HTTP {e.code}") from e
        raise
    if not r.text:
        raise _Tentar("resposta vazia")
    return r.text


def _json_da_resposta(texto):
    """Modelos sem saída estruturada às vezes cercam o JSON com ```json ou texto: pega do primeiro { ao último }."""
    texto = texto.strip()
    if texto.startswith("```"):
        texto = texto.split("\n", 1)[1].rsplit("```", 1)[0]
    inicio, fim = texto.find("{"), texto.rfind("}")
    return texto[inicio:fim + 1] if inicio >= 0 and fim > inicio else texto


def _chamar_openai(url, chave, modelo, conteudo, instrucao, esquema, temperatura, extra=None):
    """API no formato da OpenAI (NVIDIA NIM e Cloudflare Workers AI). O esquema vai no prompt e a resposta é
    conferida depois: nem todo modelo desses provedores aceita response_format com JSON Schema."""
    import urllib.error
    import urllib.request

    sistema = instrucao or ""
    if esquema:
        sistema += ("\n\nResponda SOMENTE com um objeto JSON válido (sem texto antes ou depois, sem ```), que siga "
                    "exatamente este JSON Schema, com todos os campos obrigatórios:\n" + json.dumps(esquema, ensure_ascii=False))
    corpo = {"model": modelo, "temperature": temperatura, "max_tokens": 16000,
             "messages": ([{"role": "system", "content": sistema}] if sistema else []) + [{"role": "user", "content": conteudo}],
             **(extra or {})}
    req = urllib.request.Request(url, data=json.dumps(corpo).encode(),
                                 headers={"Authorization": f"Bearer {chave}", "Content-Type": "application/json"})
    try:
        r = json.loads(urllib.request.urlopen(req, timeout=600).read())
    except urllib.error.HTTPError as e:
        if e.code in (404, 410, 429, 500, 502, 503, 504):  # 410: modelo aposentado (aconteceu na NVIDIA)
            raise _Tentar(f"HTTP {e.code}") from e
        raise SystemExit(f"{url.split('/')[2]} {e.code}: {e.read()[:300].decode(errors='replace')}")
    except (urllib.error.URLError, TimeoutError) as e:
        raise _Tentar(str(e)) from e
    texto = (r.get("choices") or [{}])[0].get("message", {}).get("content") or ""
    if not texto.strip():
        raise _Tentar("resposta vazia")
    return _json_da_resposta(texto) if esquema else texto


def _chamar_nvidia(modelo, *args):
    # O Nemotron 3 "pensa" antes de responder e o pensamento vai para reasoning_content, consumindo os tokens: no
    # teste de 14/10/2026 os 400 tokens foram todos de raciocínio e o content voltou vazio. Sem pensamento, ele
    # responde direto (111 tokens para a mesma pergunta).
    return _chamar_openai("https://integrate.api.nvidia.com/v1/chat/completions", os.environ["NVIDIA_API_KEY"], modelo, *args,
                          extra={"chat_template_kwargs": {"enable_thinking": False}})


def _chamar_cloudflare(modelo, *args):
    conta = os.environ["CLOUDFLARE_ACCOUNT_ID"]
    return _chamar_openai(f"https://api.cloudflare.com/client/v4/accounts/{conta}/ai/v1/chat/completions",
                          os.environ["CLOUDFLARE_AI_TOKEN"], modelo, *args)


def _completo(saida, esquema):
    """Confere os campos obrigatórios (também nos objetos de listas): modelo sem saída estruturada pode esquecer um."""
    if not esquema:
        return True
    if esquema.get("type") == "object":
        if not isinstance(saida, dict) or any(c not in saida for c in esquema.get("required", [])):
            return False
        return all(_completo(saida[c], sub) for c, sub in esquema.get("properties", {}).items() if c in saida)
    if esquema.get("type") == "array":
        return isinstance(saida, list) and all(_completo(x, esquema.get("items", {})) for x in saida)
    return True


CHAMADAS = {"gemini": _chamar_gemini, "nvidia": _chamar_nvidia, "cloudflare": _chamar_cloudflare}
CHAVES = {"gemini": "GEMINI_API_KEY", "nvidia": "NVIDIA_API_KEY", "cloudflare": "CLOUDFLARE_AI_TOKEN"}


def llm(conteudo, *, instrucao=None, esquema=None, temperatura=0.2, tarefa="escrita"):
    """Gera texto (ou JSON, com esquema) na cadeia de provedores gratuitos.

    tarefa="triagem" aceita o flash-lite no fim; qualquer outra usa só modelos fortes. Cada modelo recebe uma
    tentativa por rodada (falha passageira passa ao próximo na hora); a cadeia inteira roda até 3 vezes, com 60 s
    de espera entre as rodadas."""
    cadeia = [(p, m) for p, m in (FORTES if tarefa != "triagem" else TRIAGEM) if os.environ.get(CHAVES[p])]
    if not cadeia:
        raise SystemExit("Nenhuma chave de provedor configurada.")
    for rodada in range(3):
        if rodada:
            log(f"todos os provedores ocupados; nova rodada em 60 s ({rodada + 1}/3)")
            time.sleep(60)
        for provedor, modelo in cadeia:
            try:
                texto = CHAMADAS[provedor](modelo, conteudo, instrucao, esquema, temperatura)
                saida = json.loads(texto) if esquema else texto
            except _Tentar as e:
                log(f"{provedor} {modelo}: {e}; próximo")
                continue
            except json.JSONDecodeError:
                log(f"{provedor} {modelo}: JSON inválido; próximo")
                continue
            if not _completo(saida, esquema):
                log(f"{provedor} {modelo}: JSON sem campos obrigatórios; próximo")
                continue
            USADOS.append((tarefa, provedor, modelo))
            log(f"ok: {provedor} {modelo}")
            return saida
    raise ProvedoresOcupados("PROVEDORES OCUPADOS: nenhum modelo forte respondeu; tente mais tarde.")


def gemini(*args, **kwargs):
    """Nome antigo, mantido para compatibilidade: agora passa pela cadeia de provedores."""
    return llm(*args, **kwargs)
