"""Painel web do pipeline (Estúdio): tudo o que o bot do Telegram faz, e mais, numa página atrás do Cloudflare Access.

Roda DENTRO do processo do bot (thread), para usar a mesma trava de etapa pesada: o painel e o Telegram nunca geram
áudio ao mesmo tempo, e um clique duplo não gasta créditos duas vezes. Cada mensagem que o bot manda ao Telegram também
entra na Atividade do painel (eventos.jsonl).

Acesso no padrão do SOC N3XUS: caminho escondido em www.cyberjus.org, coberto pelo app do Access "CyberJustiça Painel
(/dash)" (política "Somente o dono"). O Access não basta sozinho: quem estiver na rede da VM chega ao Traefik sem
passar pela Cloudflare. Por isso toda requisição precisa do JWT do Access (Cf-Access-Jwt-Assertion) com assinatura,
emissor, audiência (AUD do app) e validade conferidos, e o e-mail tem de estar em PAINEL_EMAILS
(developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/).

Ambiente: PAINEL_PORTA (sem ela o painel não sobe), ACCESS_EQUIPE (n3xusdev), ACCESS_AUD, PAINEL_EMAILS (separados por
vírgula), PAINEL_ORIGEM (https://www.cyberjus.org) e PAINEL_BASE (caminho público, sem barra no fim).
"""
import datetime as dt
import hashlib
import json
import mimetypes
import os
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import jwt

from .comum import DADOS, TRABALHO, gravar, ler, log

PORTA = int(os.environ.get("PAINEL_PORTA", "0"))
EQUIPE = os.environ.get("ACCESS_EQUIPE", "n3xusdev")
AUD = os.environ.get("ACCESS_AUD", "")
EMAILS = {e.strip().lower() for e in os.environ.get("PAINEL_EMAILS", "").split(",") if e.strip()}
ORIGEM = os.environ.get("PAINEL_ORIGEM", "https://www.cyberjus.org")
BASE = os.environ.get("PAINEL_BASE", "/dash-ac0584219dc1/estudio").rstrip("/")
ESTATICO = Path(__file__).resolve().parent.parent / "painel"
SITE = "https://www.cyberjus.org"
UA = "CyberJust-painel/1.0 (+https://www.cyberjus.org)"  # a Cloudflare do site dá 403 ao User-Agent do Python
EMISSOR = f"https://{EQUIPE}.cloudflareaccess.com"
_chaves = jwt.PyJWKClient(f"{EMISSOR}/cdn-cgi/access/certs", cache_keys=True, lifespan=3600, timeout=10)
NOME_PASTA = re.compile(r"^[a-z0-9][a-z0-9._-]{0,120}$")
ARQUIVO_PAUTA = re.compile(r"^\d{4}-\d{2}-\d{2}(-\d{4})?\.json$")
# Pastas de trabalho que não são episódios em produção (cópias de segurança feitas à mão nas correções).
ARQUIVADA = re.compile(r"(\.bak|backup|antes-|piloto)")

bot = None  # módulo pipeline.bot, entregue por iniciar(): evita import circular
EVENTOS = DADOS / "painel" / "eventos.jsonl"
eventos = deque(maxlen=400)
eventos_trava = threading.Lock()
_cache = {}


def cache(chave, segundos, func):
    """Resultado guardado por alguns segundos: o painel consulta a cada 5 s e a ElevenLabs/feed não precisam disso."""
    agora = time.time()
    if chave in _cache and agora - _cache[chave][0] < segundos:
        return _cache[chave][1]
    valor = func()
    _cache[chave] = (agora, valor)
    return valor


# ---------- atividade (espelho do Telegram + ações do painel) ----------


def registrar(aba, texto, origem="bot"):
    """Chamado pelo msg() do bot e pelas ações do painel. Guarda texto puro (sem HTML do Telegram)."""
    limpo = re.sub(r"<[^>]+>", "", texto).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    e = {"quando": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "aba": aba, "origem": origem,
         "texto": limpo[:2000]}
    with eventos_trava:
        eventos.append(e)
        try:
            EVENTOS.parent.mkdir(parents=True, exist_ok=True)
            if EVENTOS.exists() and EVENTOS.stat().st_size > 2_000_000:  # rotação simples: guarda só o arquivo anterior
                EVENTOS.replace(EVENTOS.with_suffix(".jsonl.1"))
            with EVENTOS.open("a", encoding="utf-8") as f:
                f.write(json.dumps(e, ensure_ascii=False) + "\n")
        except OSError as erro:
            log("painel: eventos.jsonl:", erro)


def carregar_eventos():
    if not EVENTOS.exists():
        return
    for linha in EVENTOS.read_text(encoding="utf-8").splitlines()[-eventos.maxlen:]:
        try:
            eventos.append(json.loads(linha))
        except ValueError:
            pass


# ---------- leitura do estado ----------


def creditos():
    def consultar():
        _, _, erro = bot.etapa("pipeline.audio", "--saldo")
        m = re.search(r"(\d+) livres de (\d+)", erro)
        return {"livre": int(m[1]), "limite": int(m[2])} if m else {"erro": erro.strip()[-200:] or "sem resposta"}
    return cache("creditos", 60, consultar)


def proxima_pauta():
    agora = dt.datetime.now(bot.BRT)
    for d in range(8):
        dia = (agora + dt.timedelta(days=d)).replace(hour=bot.HORA, minute=0, second=0, microsecond=0)
        if dia.weekday() in bot.DIAS and dia > agora:
            return dia.isoformat()
    return None


def baixar(url, metodo="GET", cabecalhos=None, limite=5_000_000):
    pedido = urllib.request.Request(url, method=metodo, headers={"User-Agent": UA, **(cabecalhos or {})})
    with urllib.request.urlopen(pedido, timeout=20) as r:
        return r.status, dict(r.headers), r.read(limite) if metodo == "GET" else b""


NS = {"itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd", "podcast": "https://podcastindex.org/namespace/1.0"}


def feed():
    """Episódios no ar, lidos do feed público (a fonte da verdade do que os agregadores veem)."""
    def ler_feed():
        try:
            _, _, corpo = baixar(f"{SITE}/podcast.xml")
        except Exception as e:
            return {"erro": repr(e)[:200], "itens": []}
        canal = ET.fromstring(corpo).find("channel")
        itens = []
        for it in canal.findall("item"):
            enc = it.find("enclosure")
            itens.append({"titulo": it.findtext("title", ""), "link": it.findtext("link", ""), "guid": it.findtext("guid", ""),
                          "data": it.findtext("pubDate", ""), "duracao": it.findtext("itunes:duration", "", NS),
                          "episodio": it.findtext("itunes:episode", "", NS),
                          "audio": enc.get("url") if enc is not None else None})
        return {"titulo": canal.findtext("title", ""), "itens": itens}
    return cache("feed", 300, ler_feed)


def publicados():
    """O que está no site: títulos e marcas de áudio (os 8 primeiros do sha256 no nome do arquivo, como faz o
    episodio.py), do feed no ar e do clone (o clone só anda na publicação, o feed pode atrasar)."""
    titulos, marcas = {}, set()
    for i in feed()["itens"]:
        titulos[i["titulo"].strip()] = i
        m = re.search(r"-([0-9a-f]{8})\.m4a$", i.get("audio") or "")
        if m:
            marcas.add(m[1])
    pasta = bot.REPO / "src" / "content" / "episodios"
    for md in sorted(pasta.glob("*.md")) if pasta.exists() else []:
        texto = md.read_text(encoding="utf-8")
        m = re.search(r'^titulo:\s*"?(.+?)"?\s*$', texto, re.M)
        if m and m[1].strip() not in titulos:
            titulos[m[1].strip()] = {"titulo": m[1].strip(), "link": f"{SITE}/episodios/{md.stem}/"}
        marcas.update(re.findall(r"-([0-9a-f]{8})\.m4a", texto))
    return {"titulos": titulos, "marcas": marcas}


def marca_audio(p):
    """sha256[:8] do episodio.m4a, guardado por data de modificação (o arquivo tem ~10 MB)."""
    a = p / "episodio.m4a"
    if not a.exists():
        return None
    chave = ("marca", str(a), a.stat().st_mtime)
    if chave not in _cache:
        _cache[chave] = (0, hashlib.sha256(a.read_bytes()).hexdigest()[:8])
    return _cache[chave][1]


def no_site(p, no_ar):
    """(publicado?, item do site com o mesmo título). Mesmo título com áudio diferente = versão nova de um episódio
    que já está no ar (ex.: o ep. 1 regerado com a voz nova): não é publicado, mas também não pode virar episódio novo."""
    if (p / "publicado.json").exists():
        return True, ler(p / "publicado.json")
    titulo = ler(p / "roteiro.json").get("titulo", "").strip()
    marca = marca_audio(p)
    if marca and marca in no_ar["marcas"]:
        return True, no_ar["titulos"].get(titulo, {})
    return False, no_ar["titulos"].get(titulo)


def pasta_valida(nome):
    if not NOME_PASTA.match(nome or "") or ".." in nome:
        raise Erro(404, "episódio não encontrado")
    p = (TRABALHO / nome).resolve()
    if p.parent != TRABALHO.resolve() or not (p / "roteiro.json").exists():
        raise Erro(404, "episódio não encontrado")
    return p


def estado_de(p, no_ar):
    if (p / "descartado").exists():
        return "descartado"
    if ARQUIVADA.search(p.name):
        return "arquivado"
    publicado, item = no_site(p, no_ar)
    if publicado:
        return "publicado"
    if item:  # mesmo título no ar com outro áudio: versão nova (ou cópia antiga) de um episódio publicado
        return "outra_versao"
    if (p / "qa.json").exists() and (p / "episodio.m4a").exists():
        return "audio"
    return "roteiro"


def resumo(p, no_ar):
    r = ler(p / "roteiro.json")
    chars = sum(len(f["texto"]) for f in r["falas"])
    palavras = sum(len(f["texto"].split()) for f in r["falas"])
    qa = ler(p / "qa.json") if (p / "qa.json").exists() else None
    est = estado_de(p, no_ar)
    publicado, pub = no_site(p, no_ar)
    pub = pub or {}
    avisos = ler(p / "modelos.json").get("avisos", []) if (p / "modelos.json").exists() else []
    return {"pasta": p.name, "titulo": r.get("titulo", p.name), "tema": r.get("tema") or (ler(p / "pauta.json").get("tema") if (p / "pauta.json").exists() else None),
            "status": r.get("status"), "estado": est, "falas": len(r["falas"]), "caracteres": chars, "palavras": palavras,
            "minutos": round(palavras / 160, 1), "custo_audio": int(chars * bot.CREDITO_POR_CARACTERE),
            "qa": qa, "avisos": len(avisos), "atualizado": int(max(f.stat().st_mtime for f in p.iterdir())),
            "criado": int((p / "roteiro.json").stat().st_mtime), "url": pub.get("url") or pub.get("link"),
            "versao_de": None if publicado or not pub else (pub.get("url") or pub.get("link"))}


def episodios():
    no_ar = publicados()
    lista = [resumo(p, no_ar) for p in TRABALHO.iterdir() if p.is_dir() and (p / "roteiro.json").exists()]
    return sorted(lista, key=lambda e: -e["atualizado"])


def episodio(nome):
    p = pasta_valida(nome)
    no_ar = publicados()
    det = resumo(p, no_ar)
    opcional = lambda arq, padrao=None: ler(p / arq) if (p / arq).exists() else padrao
    r = ler(p / "roteiro.json")
    cues = []
    if (p / "episodio.vtt").exists():
        from .tom import ler_vtt
        cues = [[round(a, 2), round(b, 2)] for a, b, _, _ in ler_vtt(p / "episodio.vtt")]
    tem_audio = (p / "episodio.m4a").exists()
    legenda_ok = tem_audio and (p / "episodio.vtt").exists() and (p / "episodio.vtt").stat().st_mtime >= (p / "episodio.m4a").stat().st_mtime
    det.update({
        "roteiro": {k: r.get(k) for k in ("titulo", "tituloSeo", "slug", "resumo", "descricao", "tags", "status", "periodo")},
        "falas": [{"quem": f["quem"], "texto": f["texto"], "capitulo": f.get("capitulo"),
                   "tempo": cues[i] if len(cues) == len(r["falas"]) else None,
                   "custo_refazer": int(len(re.sub(r"\s*\[[^\]]+\]\s*", " ", f["texto"]).strip()) * bot.CREDITO_FALA_AVULSA)}
                  for i, f in enumerate(r["falas"])],
        "revisao": opcional("revisao.json", []), "modelos": opcional("modelos.json", {"etapas": [], "avisos": []}),
        "capitulos": opcional("capitulos.json", []), "pauta": opcional("pauta.json"),
        "fontes": [{"titulo": f.get("titulo"), "url": f.get("url"), "fonte": f.get("fonte")} for f in opcional("fontes.json", [])],
        "ficha": (p / "ficha.md").read_text(encoding="utf-8") if (p / "ficha.md").exists() else "",
        "tem_audio": tem_audio, "tem_legenda": (p / "episodio.vtt").exists(), "legenda_em_dia": legenda_ok,
        "audio_bytes": (p / "episodio.m4a").stat().st_size if tem_audio else 0,
        "versao_audio": int((p / "episodio.m4a").stat().st_mtime) if tem_audio else 0,
        "blocos": len(list((p / "blocos").glob("[0-9][0-9].mp3"))) if (p / "blocos").exists() else 0,
        "copias": sorted(x.name for x in p.glob("roteiro.antes-edicao-*.json")),
        "texto_mudou": tem_audio and (p / "roteiro.json").stat().st_mtime > (p / "episodio.m4a").stat().st_mtime + 1,
    })
    return det


def pautas():
    arquivos = sorted((p for p in (DADOS / "pautas").glob("*.json") if ARQUIVO_PAUTA.match(p.name)),
                      key=lambda p: p.stat().st_mtime, reverse=True)
    usadas = {}
    for p in TRABALHO.glob("*/pauta.json"):
        try:
            usadas[ler(p)["titulo"]] = p.parent.name
        except (ValueError, KeyError):
            pass
    lista = []
    for a in arquivos[:30]:
        meta = ler(a.with_suffix(".meta.json")) if a.with_suffix(".meta.json").exists() else {}
        itens = ler(a)
        lista.append({"arquivo": a.name, "quando": int(a.stat().st_mtime), "repetidas": meta.get("repetidas", 0),
                      "noticias": meta.get("noticias"),
                      "pautas": [{"n": i, "titulo": p["titulo"], "tema": p.get("tema"), "nota": p.get("nota"),
                                  "por_que": p.get("por_que"), "pasta": usadas.get(p["titulo"]),
                                  "noticias": [{"titulo": n.get("titulo"), "data": n.get("data"),
                                                "fontes": [{"nome": f.get("nome"), "site": f.get("site")} for f in n.get("fontes", [])]}
                                               for n in p.get("noticias", [])]}
                                 for i, p in enumerate(itens, 1)]})
    return lista


def estado(usuario):
    a = bot.atual
    return {"usuario": usuario, "ocupado": bool(a["nome"]), "etapa": a["nome"], "etapa_nome": bot.NOMES.get(a["nome"], a["nome"]),
            "alvo": a.get("alvo"), "desde": a["desde"], "agora": time.time(), "creditos": creditos(),
            "proxima_pauta": proxima_pauta(), "dias": sorted(bot.DIAS), "hora": bot.HORA,
            "abas_telegram": (DADOS / "topicos.json").exists(), "modelo_tts": os.environ.get("MODELO_TTS"),
            "estabilidade": os.environ.get("ESTABILIDADE_TTS"), "custo_caractere": bot.CREDITO_POR_CARACTERE,
            "coapresentadora": os.environ.get("NOME_COAPRESENTADORA", "Sara")}


# ---------- verificação do feed (o que Apple, Spotify e Podcast Index olham) ----------


def verificar_feed():
    itens, canal_ok = [], []
    try:
        st, cab, corpo = baixar(f"{SITE}/podcast.xml")
        canal = ET.fromstring(corpo).find("channel")
    except Exception as e:
        return {"quando": time.time(), "erro": repr(e)[:300], "canal": [], "itens": []}

    def item(nome, ok, detalhe=""):
        return {"nome": nome, "ok": bool(ok), "detalhe": str(detalhe)[:200]}

    def tag(no, caminho):
        return no.find(caminho, NS)

    img = tag(canal, "itunes:image")
    capa = img.get("href") if img is not None else None
    capa_ok, capa_det = False, "sem itunes:image"
    if capa:
        try:
            s, c, _ = baixar(capa, "HEAD")
            capa_ok = s == 200 and c.get("Content-Type", "").startswith(("image/jpeg", "image/png"))
            capa_det = f"{c.get('Content-Type')} · {int(c.get('Content-Length', 0)) // 1024} KB (Apple: 1400 a 3000 px, até 512 KB recomendado)"
        except Exception as e:
            capa_det = repr(e)[:120]
    dono = tag(canal, "itunes:owner")
    canal_ok += [
        item("Content-Type do feed", "xml" in cab.get("Content-Type", ""), cab.get("Content-Type")),
        item("title", canal.findtext("title")),
        item("description", canal.findtext("description"), f"{len(canal.findtext('description') or '')} caracteres"),
        item("language", canal.findtext("language"), canal.findtext("language")),
        item("link", canal.findtext("link"), canal.findtext("link")),
        item("itunes:image (capa)", capa_ok, capa_det),
        item("itunes:category", tag(canal, "itunes:category") is not None,
             (tag(canal, "itunes:category").get("text") if tag(canal, "itunes:category") is not None else "")),
        item("itunes:explicit", canal.findtext("itunes:explicit", None, NS) in ("true", "false"), canal.findtext("itunes:explicit", "", NS)),
        item("itunes:author", canal.findtext("itunes:author", None, NS), canal.findtext("itunes:author", "", NS)),
        item("itunes:owner/email (verificação do Spotify e da Apple)", dono is not None and dono.findtext("itunes:email", None, NS)),
        item("itunes:type", canal.findtext("itunes:type", None, NS) in ("episodic", "serial"), canal.findtext("itunes:type", "", NS)),
        item("podcast:guid", canal.findtext("podcast:guid", None, NS), canal.findtext("podcast:guid", "", NS)),
        item("podcast:locked", canal.findtext("podcast:locked", None, NS), canal.findtext("podcast:locked", "", NS)),
        item("atom:link rel=self", canal.find("{http://www.w3.org/2005/Atom}link") is not None),
    ]
    guids = set()
    for it in canal.findall("item")[:20]:
        checks = []
        enc = it.find("enclosure")
        guid = it.findtext("guid")
        checks.append(item("guid único", guid and guid not in guids, guid))
        guids.add(guid)
        checks.append(item("pubDate", it.findtext("pubDate"), it.findtext("pubDate")))
        checks.append(item("itunes:duration", it.findtext("itunes:duration", None, NS), it.findtext("itunes:duration", "", NS)))
        if enc is None:
            checks.append(item("enclosure", False, "ausente"))
        else:
            url, tam = enc.get("url"), int(enc.get("length") or 0)
            try:
                s, c, _ = baixar(url, cabecalhos={"Range": "bytes=0-1"}, limite=2)
                total = int((c.get("Content-Range") or "/0").split("/")[-1] or 0)
                checks.append(item("áudio responde Range (206)", s == 206, f"HTTP {s} · {c.get('Content-Type')}"))
                checks.append(item("length do enclosure = tamanho real", total == tam, f"feed {tam} · arquivo {total}"))
                checks.append(item("type do enclosure", enc.get("type") in ("audio/mp4", "audio/x-m4a", "audio/mpeg"), enc.get("type")))
            except Exception as e:
                checks.append(item("áudio no ar", False, repr(e)[:120]))
        for nome, caminho in (("transcrição (podcast:transcript)", "podcast:transcript"), ("capítulos (podcast:chapters)", "podcast:chapters")):
            no = tag(it, caminho)
            if no is None:
                checks.append(item(nome, False, "ausente"))
                continue
            try:
                s, c, _ = baixar(no.get("url"), "HEAD")
                checks.append(item(nome, s == 200, f"{c.get('Content-Type')}"))
            except Exception as e:
                checks.append(item(nome, False, repr(e)[:120]))
        itens.append({"titulo": it.findtext("title"), "link": it.findtext("link"), "checks": checks})
    return {"quando": time.time(), "canal": canal_ok, "itens": itens}


# ---------- ações ----------


class Erro(Exception):
    def __init__(self, codigo, mensagem):
        super().__init__(mensagem)
        self.codigo, self.mensagem = codigo, mensagem


def disparar(acao, args, usuario, descricao):
    if bot.ocupado.locked():
        raise Erro(409, f"Ocupado: {bot.NOMES.get(bot.atual['nome'], bot.atual['nome'])}. Espere terminar.")
    registrar(bot.ABA_DA_ACAO.get(acao, "sistema"), f"Painel ({usuario}): {descricao}", origem="painel")
    log("painel:", acao, *args, "por", usuario)
    threading.Thread(target=bot.executar, args=(acao, tuple(args)), daemon=True).start()
    time.sleep(0.2)  # a etapa pega a trava; o próximo /api/estado já mostra "ocupado"
    return {"ok": True}


def editar_fala(p, n, texto, usuario):
    """Troca o texto de uma fala (grátis). Guarda uma cópia do roteiro antes. Com áudio já gerado, a fala só muda no
    áudio quando for refeita (o painel oferece "salvar e refazer")."""
    texto = re.sub(r"\s+", " ", texto or "").strip()
    if not 1 <= len(texto) <= 1500:
        raise Erro(400, "a fala precisa ter de 1 a 1.500 caracteres")
    if bot.ocupado.locked():
        raise Erro(409, "uma etapa está rodando; edite quando terminar")
    r = ler(p / "roteiro.json")
    if not 0 <= n < len(r["falas"]):
        raise Erro(404, "fala inexistente")
    if r["falas"][n]["texto"] == texto:
        return False
    gravar(p / f"roteiro.antes-edicao-{dt.datetime.now(bot.BRT):%Y%m%d-%H%M%S}.json", r)
    r["falas"][n]["texto"] = texto
    gravar(p / "roteiro.json", r)
    registrar("producao", f"Painel ({usuario}): fala {n + 1} editada em {p.name}", origem="painel")
    return True


def acao_episodio(nome, acao, corpo, usuario):
    p = pasta_valida(nome)
    est = estado_de(p, publicados())
    # Texto salvo depois do áudio sem refazer a fala: remontar regeraria o bloco inteiro (gasta créditos sem aviso) e
    # publicar sairia com página e legenda diferentes do áudio.
    texto_mudou = est in ("audio", "outra_versao") and (p / "roteiro.json").stat().st_mtime > (p / "episodio.m4a").stat().st_mtime + 1
    if texto_mudou and acao in ("audio", "publicar"):
        raise Erro(409, "uma fala foi editada depois do áudio e não foi refeita: use Refazer nela (ou volte o texto)")
    if acao == "audio":
        if est not in ("roteiro", "audio", "outra_versao"):
            raise Erro(409, f"episódio está em '{est}'")
        return disparar("audio", [p.name], usuario, f"gerar o áudio de {p.name}")
    if acao == "refazer":
        n = int(corpo.get("fala", -1))
        if est not in ("audio", "outra_versao"):
            raise Erro(409, "só dá para refazer fala de episódio com áudio e ainda não publicado")
        if not (p / "episodio.vtt").exists() or (p / "episodio.vtt").stat().st_mtime < (p / "episodio.m4a").stat().st_mtime:
            raise Erro(409, "a legenda está mais velha que o áudio: gere o áudio de novo (0 crédito, blocos reaproveitados)")
        if corpo.get("texto"):
            editar_fala(p, n, corpo["texto"], usuario)
        return disparar("refazer", [p.name, str(n)], usuario, f"refazer a fala {n + 1} de {p.name}")
    if acao == "publicar":
        qa = ler(p / "qa.json") if (p / "qa.json").exists() else {}
        if est != "audio" or not qa.get("aprovado"):
            raise Erro(409, "só publica episódio com áudio aprovado no controle de qualidade")
        if no_site(p, publicados())[1]:
            raise Erro(409, "já existe episódio com este título no site: publicar criaria um duplicado (troque o áudio por PR)")
        return disparar("publicar", [p.name], usuario, f"publicar {p.name}")
    if acao == "descartar":
        if est == "publicado":
            raise Erro(409, "episódio publicado não se descarta pelo painel")
        return disparar("descartar", [p.name], usuario, f"descartar {p.name}")
    if acao == "restaurar":
        (p / "descartado").unlink(missing_ok=True)
        registrar("producao", f"Painel ({usuario}): {p.name} restaurado", origem="painel")
        return {"ok": True}
    if acao == "fala":
        if est not in ("roteiro", "audio", "outra_versao"):
            raise Erro(409, f"episódio está em '{est}'")
        return {"ok": True, "mudou": editar_fala(p, int(corpo.get("fala", -1)), corpo.get("texto"), usuario)}
    raise Erro(404, "ação desconhecida")


# ---------- HTTP ----------


def validar_jwt(token):
    """Assinatura RS256 pelas chaves públicas do time, emissor, audiência do app e validade (exp/nbf/iat)."""
    if not token or not AUD:
        return None
    try:
        chave = _chaves.get_signing_key_from_jwt(token)
        dados = jwt.decode(token, chave.key, algorithms=["RS256"], audience=AUD, issuer=EMISSOR,
                           options={"require": ["exp", "iat", "aud", "iss"]}, leeway=30)
    except Exception as e:
        log("painel: JWT recusado:", type(e).__name__, str(e)[:120])
        return None
    email = (dados.get("email") or "").lower()
    return email if email and email in EMAILS else None


SEGURANCA = {
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; "
                               "media-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow, noarchive", "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


class Pedido(BaseHTTPRequestHandler):
    server_version = "estudio"
    sys_version = ""
    protocol_version = "HTTP/1.1"

    def log_message(self, *_):  # o acesso já é registrado pela Cloudflare e pelo Traefik
        pass

    def responder(self, codigo, corpo=b"", tipo="application/json; charset=utf-8", extra=None):
        if isinstance(corpo, (dict, list)):
            corpo = json.dumps(corpo, ensure_ascii=False).encode()
        self.send_response(codigo)
        for k, v in {**SEGURANCA, "Content-Type": tipo, "Content-Length": str(len(corpo)),
                     "Cache-Control": "no-store", **(extra or {})}.items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(corpo)

    def usuario(self):
        return validar_jwt(self.headers.get("Cf-Access-Jwt-Assertion"))

    def rota(self):
        caminho = urllib.parse.urlsplit(self.path).path
        if caminho == BASE:
            return None
        if not caminho.startswith(BASE + "/"):
            raise Erro(404, "não encontrado")
        return caminho[len(BASE):]

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        try:
            usuario = self.usuario()
            if not usuario:
                return self.responder(403, {"erro": "acesso negado"})
            r = self.rota()
            if r is None:
                return self.responder(308, b"", extra={"Location": BASE + "/"})
            if r == "/" or r.startswith("/estatico/"):
                return self.estatico("index.html" if r == "/" else r[len("/estatico/"):])
            if r == "/api/estado":
                return self.responder(200, estado(usuario))
            if r == "/api/episodios":
                return self.responder(200, episodios())
            if r == "/api/pautas":
                return self.responder(200, pautas())
            if r == "/api/atividade":
                with eventos_trava:
                    return self.responder(200, list(eventos)[::-1])
            if r == "/api/site":
                f = feed()
                try:
                    _, _, c = baixar(f"{SITE}/api/contador")
                    contador = json.loads(c)
                except Exception:
                    contador = None
                return self.responder(200, {"feed": f, "contador": contador, "verificacao": _cache.get("verificacao", (0, None))[1]})
            m = re.fullmatch(r"/api/episodios/([^/]+)(/audio|/legenda)?", r)
            if m:
                p = pasta_valida(urllib.parse.unquote(m[1]))
                if m[2] == "/audio":
                    return self.arquivo(p / "episodio.m4a", "audio/mp4")
                if m[2] == "/legenda":
                    return self.arquivo(p / "episodio.vtt", "text/vtt; charset=utf-8")
                return self.responder(200, episodio(p.name))
            raise Erro(404, "não encontrado")
        except Erro as e:
            self.responder(e.codigo, {"erro": e.mensagem})
        except Exception as e:
            log("painel: GET", self.path, "falhou:", repr(e))
            self.responder(500, {"erro": "falha interna; veja o log do bot"})

    def do_POST(self):
        try:
            usuario = self.usuario()
            if not usuario:
                return self.responder(403, {"erro": "acesso negado"})
            # CSRF: só fetch do próprio painel (cabeçalho próprio exige preflight, que não é respondido) e da mesma origem.
            if self.headers.get("X-Estudio") != "1" or self.headers.get("Origin", ORIGEM) != ORIGEM:
                return self.responder(403, {"erro": "origem recusada"})
            tamanho = int(self.headers.get("Content-Length") or 0)
            if tamanho > 20_000:
                raise Erro(413, "pedido grande demais")
            corpo = json.loads(self.rfile.read(tamanho) or b"{}") if tamanho else {}
            r = self.rota() or ""
            if r == "/api/pautas/buscar":
                return self.responder(202, disparar("sugerir", [], usuario, "buscar pautas agora"))
            m = re.fullmatch(r"/api/pautas/([^/]+)/(\d+)/produzir", r)
            if m:
                if not ARQUIVO_PAUTA.match(m[1]) or not (DADOS / "pautas" / m[1]).exists():
                    raise Erro(404, "arquivo de pautas não encontrado")
                if not 1 <= int(m[2]) <= len(ler(DADOS / "pautas" / m[1])):
                    raise Erro(404, "pauta inexistente")
                return self.responder(202, disparar("produzir", [m[1], m[2]], usuario, f"produzir a pauta {m[2]} de {m[1]}"))
            if r == "/api/feed/verificar":
                resultado = verificar_feed()
                _cache["verificacao"] = (time.time(), resultado)
                _cache.pop("feed", None)
                return self.responder(200, resultado)
            m = re.fullmatch(r"/api/episodios/([^/]+)/(audio|refazer|publicar|descartar|restaurar|fala)", r)
            if m:
                return self.responder(202, acao_episodio(urllib.parse.unquote(m[1]), m[2], corpo, usuario))
            raise Erro(404, "não encontrado")
        except Erro as e:
            self.responder(e.codigo, {"erro": e.mensagem})
        except (ValueError, KeyError) as e:
            self.responder(400, {"erro": f"pedido inválido: {e}"[:200]})
        except Exception as e:
            log("painel: POST", self.path, "falhou:", repr(e))
            self.responder(500, {"erro": "falha interna; veja o log do bot"})

    def estatico(self, nome):
        p = (ESTATICO / nome).resolve()
        if not str(p).startswith(str(ESTATICO.resolve()) + os.sep) or not p.is_file():
            raise Erro(404, "não encontrado")
        tipo = {".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".woff2": "font/woff2",
                ".svg": "image/svg+xml", ".html": "text/html; charset=utf-8", ".webmanifest": "application/manifest+json"}.get(
            p.suffix, mimetypes.guess_type(p.name)[0] or "application/octet-stream")
        self.responder(200, p.read_bytes(), tipo, {"Cache-Control": "no-cache"})

    def arquivo(self, p, tipo):
        """Áudio e legenda com Range (o <audio> do Safari exige 206 para tocar e pular)."""
        if not p.exists():
            raise Erro(404, "ainda não gerado")
        total = p.stat().st_size
        faixa = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        inicio, fim, codigo = 0, total - 1, 200
        if faixa and (faixa[1] or faixa[2]):
            if faixa[1]:
                inicio, fim = int(faixa[1]), min(int(faixa[2]) if faixa[2] else total - 1, total - 1)
            else:
                inicio = max(0, total - int(faixa[2]))
            if inicio > fim:
                return self.responder(416, b"", tipo, {"Content-Range": f"bytes */{total}"})
            codigo = 206
        tamanho = fim - inicio + 1
        self.send_response(codigo)
        for k, v in {**SEGURANCA, "Content-Type": tipo, "Content-Length": str(tamanho), "Accept-Ranges": "bytes",
                     "Cache-Control": "private, no-cache", "Last-Modified": self.date_time_string(int(p.stat().st_mtime)),
                     **({"Content-Range": f"bytes {inicio}-{fim}/{total}"} if codigo == 206 else {})}.items():
            self.send_header(k, v)
        self.end_headers()
        if self.command == "HEAD":
            return
        with p.open("rb") as f:
            f.seek(inicio)
            restante = tamanho
            while restante:
                bloco = f.read(min(256 * 1024, restante))
                if not bloco:
                    break
                self.wfile.write(bloco)
                restante -= len(bloco)


class Servidor(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def iniciar(modulo_bot):
    global bot
    bot = modulo_bot
    if not PORTA:
        return log("painel desligado (sem PAINEL_PORTA)")
    if not AUD or not EMAILS:
        return log("painel NÃO subiu: falta ACCESS_AUD ou PAINEL_EMAILS (sem eles ninguém entraria)")
    carregar_eventos()
    servidor = Servidor(("0.0.0.0", PORTA), Pedido)
    threading.Thread(target=servidor.serve_forever, daemon=True, name="painel").start()
    log(f"painel no ar na porta {PORTA}, caminho {BASE}/")
