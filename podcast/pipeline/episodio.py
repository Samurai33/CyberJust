"""Etapa 5: monta o episódio no formato do site (Markdown + transcrição) num clone do repositório.

Uso: python -m pipeline.episodio <pasta> <repo> [--publicar]
Sem --publicar: só grava os arquivos no clone e mostra o diff (nada sai da máquina).
Com --publicar: envia o áudio ao R2 (Worker worker/audio, segredo AUDIO_ENVIO), registra duração e tamanho em
src/data/audio.json, faz commit na main e push; o webhook do Coolify publica o site. O áudio vai antes do commit,
então o site nunca aponta para um arquivo que ainda não existe.
Regras do CLAUDE.md do repositório: nada de fato inventado, links conferidos (HTTP 200) e arquivo de áudio novo a
cada mudança (o cache é imutável).
"""
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

from .comum import TEMAS, ler, log, slug

BRT = dt.timezone(dt.timedelta(hours=-3))
AUDIO_BASE = os.environ.get("AUDIO_BASE", "https://www.cyberjus.org").rstrip("/")
SITE_CURTO = "CyberJustiça"  # src/data/site.ts SITE.curto: o título vira "<título> | CyberJustiça" se couber em 60
OFICIAIS = re.compile(r"\.gov\.br|\.jus\.br|\.mp\.br|oab|\.leg\.br|policiacivil|bcb\.gov|safernet", re.I)
GRANDES = re.compile(r"g1\.globo|folha|estadao|uol\.com|cnnbrasil|agenciabrasil|metropoles|band\.com|oglobo|bbc\.com|r7\.com|terra\.com", re.I)


def prioridade(f):
    return 0 if OFICIAIS.search(f["url"]) else 1 if GRANDES.search(f["url"]) else 2


def yaml(valor):
    # JSON é YAML válido: strings sempre entre aspas, sem ambiguidade com ":" ou "#".
    return json.dumps(valor, ensure_ascii=False)


def link_ok(url):
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "Mozilla/5.0 (CyberJust links)"})
    try:
        return urllib.request.urlopen(req, timeout=20).status == 200
    except Exception:
        return False


def recursos(fontes, maximo=4):
    """Oficiais primeiro, depois veículos; um por site; só links que respondem 200."""
    escolhidos, sites = [], set()
    for f in sorted(fontes, key=prioridade):
        site = f["url"].split("/")[2]
        if site in sites or not f["url"].startswith("https://"):
            continue
        if not link_ok(f["url"]):
            log("link fora do ar, ignorado:", f["url"])
            continue
        sites.add(site)
        escolhidos.append({"titulo": f["titulo"][:120], "url": f["url"], "fonte": f["fonte"], "tipo": "notícia"})
        if len(escolhidos) == maximo:
            break
    return escolhidos


def problemas_pagina(r):
    """Campos da página fora do esquema de src/content.config.ts. O roteiro.py mostra isto no Telegram ANTES do áudio:
    descobrir só na publicação, depois de gastar os créditos, obrigava a editar o roteiro.json à mão."""
    erros = []
    if not 10 <= len(r["titulo"]) <= 90:
        erros.append(f"titulo com {len(r['titulo'])} caracteres (10 a 90)")
    if not 50 <= len(r["resumo"]) <= 155:
        erros.append(f"resumo com {len(r['resumo'])} caracteres (50 a 155)")
    if len(r.get("periodo") or "") > 40:
        erros.append("periodo com mais de 40 caracteres")
    if r["tema"] not in TEMAS:
        erros.append(f"tema inválido: {r['tema']}")
    return erros


def validar(r, capitulos):
    """As mesmas regras do esquema em src/content.config.ts, para o build do site não quebrar depois do push."""
    erros = problemas_pagina(r)
    if not capitulos:
        erros.append("roteiro sem capítulos (o modelo não marcou o campo capitulo em nenhuma fala)")
    for c in capitulos:
        if not 2 <= len(c["titulo"]) <= 80:
            erros.append(f"capítulo com título inválido: {c['titulo']!r}")
    if erros:
        raise SystemExit("Episódio inválido para o site: " + "; ".join(erros))


def enviar_audio(arquivo, caminho):
    """PUT no Worker do áudio, que confere o faststart e o hash do nome; reenviar o mesmo arquivo é idempotente."""
    dados = arquivo.read_bytes()
    # User-Agent próprio em TODOS os pedidos: a Cloudflare devolve 403 para o "Python-urllib" padrão (a 1ª publicação
    # pelo R2, em 21/10/2026, enviou o áudio e caiu no HEAD de conferência por isso).
    ua = {"User-Agent": "cyberjust-pipeline/1"}
    req = urllib.request.Request(AUDIO_BASE + caminho, data=dados, method="PUT", headers={
        "Authorization": f"Bearer {os.environ['AUDIO_ENVIO']}", "Content-Type": "audio/mp4", **ua})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            info = json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"O R2 recusou o áudio ({e.code}): {e.read().decode(errors='replace')[:300]}")
    try:
        with urllib.request.urlopen(urllib.request.Request(AUDIO_BASE + caminho, method="HEAD", headers=ua), timeout=30) as r:
            tamanho = r.headers.get("Content-Length")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"O áudio foi enviado, mas a conferência em {AUDIO_BASE + caminho} deu {e.code}; nada foi publicado.")
    if tamanho != str(len(dados)):
        raise SystemExit(f"{caminho}: o HEAD depois do envio não bate com o tamanho do arquivo")
    log(f"áudio no R2: {caminho} ({len(dados) / 1048576:.1f} MB, {info['segundos']} s)")
    return {"segundos": info["segundos"], "bytes": info["bytes"]}


def registrar_audio(repo, caminho, info):
    """Duração e tamanho em src/data/audio.json: é de onde o build lê (o áudio não fica no Git)."""
    manifesto = repo / "src" / "data" / "audio.json"
    dados = json.loads(manifesto.read_text(encoding="utf-8"))
    dados[caminho] = info
    manifesto.write_text(json.dumps(dict(sorted(dados.items())), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return str(manifesto.relative_to(repo))


def git(repo, *args, check=True):
    return subprocess.run(["git", "-C", str(repo), *args], check=check)


def sincronizar(repo):
    """Deixa o clone igual à origin/main. Um ensaio anterior deixava o .md no clone, e o número do episódio
    seguinte saía pulado (o ensaio contava como publicado); um commit cujo push falhou travava o pull --ff-only."""
    git(repo, "fetch", "-q", "origin", "main")
    git(repo, "checkout", "-q", "main")
    git(repo, "reset", "-q", "--hard", "origin/main")
    git(repo, "clean", "-q", "-fd")


def montar(pasta, repo, r, capitulos, rec):
    """Grava .md e VTT no clone; devolve (número, slug, caminho do áudio, arquivos)."""
    episodios = repo / "src" / "content" / "episodios"
    nome = slug(r.get("slug") or r["titulo"], 50)
    numeros = [int(m) for p in episodios.glob("*.md") for m in re.findall(r"^numero:\s*(\d+)", p.read_text(encoding="utf-8"), re.M)]
    numero = max(numeros, default=0) + 1
    if (episodios / f"{nome}.md").exists():  # outro caso com o mesmo slug: não sobrescreve o episódio publicado
        nome = f"{nome}-{numero}"

    audio = (pasta / "episodio.m4a").read_bytes()
    marca = hashlib.sha256(audio).hexdigest()[:8]  # arquivo novo a cada versão: o cache do áudio é imutável
    arq_audio = f"/audio/{nome}-{marca}.m4a"
    arq_vtt = f"/transcricoes/{nome}-{marca}.vtt"
    (repo / "public" / "transcricoes").mkdir(exist_ok=True)
    shutil.copyfile(pasta / "episodio.vtt", repo / "public" / arq_vtt.lstrip("/"))

    fm = [
        "---",
        f"numero: {numero}",
        f"titulo: {yaml(r['titulo'])}",
    ]
    # Base.astro usa "<título> | CyberJustiça" se couber em 60; senão o título sozinho. Título longo ganha versão SEO.
    seo = (r.get("tituloSeo") or "").strip()
    if len(f"{r['titulo']} | {SITE_CURTO}") > 60 and 20 <= len(seo) <= 60:
        fm.append(f"tituloSeo: {yaml(seo)}")
    fm += [
        f"resumo: {yaml(r['resumo'])}",
        # Data de Brasília: em UTC, um episódio publicado depois das 21h saía com a data do dia seguinte.
        f"data: {yaml(dt.datetime.now(BRT).date().isoformat())}",
        *([f"periodo: {yaml(r['periodo'])}"] if r.get("periodo") else []),
        f"status: {r['status']}",
        f"ameaca: {r['ameaca']}",
        f"tema: {r['tema']}",
        f"tags: {yaml(r['tags'][:8])}",
        f"audio: {arq_audio}",
        f"transcricao: {arq_vtt}",
        # "capitulos:" sem itens vira null no YAML e o esquema do site recusa (deploy do episódio 2 quebrou assim).
        "capitulos:" if capitulos else "capitulos: []",
        *[f"  - inicio: {yaml(c['inicio'])}\n    titulo: {yaml(c['titulo'])}" for c in capitulos],
        "pontos:",
        *[f"  - {yaml(p)}" for p in r["pontos"]],
        "alertas:",
        *[f"  - {yaml(a)}" for a in r["alertas"]],
    ]
    if rec:
        fm.append("recursos:")
        for x in rec:
            fm += [f"  - titulo: {yaml(x['titulo'])}", f"    url: {x['url']}", f"    fonte: {yaml(x['fonte'])}", f"    tipo: {x['tipo']}"]
    fm.append("---")
    md = "\n".join(fm) + "\n\n" + r["descricao"].strip() + "\n"
    destino = episodios / f"{nome}.md"
    destino.write_text(md, encoding="utf-8")
    log(f"episódio {numero}: {destino.relative_to(repo)} | {arq_audio} | {len(capitulos)} capítulos | {len(rec)} recursos")
    return numero, nome, arq_audio, [str(destino.relative_to(repo)), "public" + arq_vtt]


def main():
    pasta, repo = Path(sys.argv[1]), Path(sys.argv[2])
    publicar = "--publicar" in sys.argv
    r = ler(pasta / "roteiro.json")
    capitulos = ler(pasta / "capitulos.json")
    qa = ler(pasta / "qa.json")
    if not qa.get("aprovado"):
        raise SystemExit(f"O controle de qualidade reprovou o áudio: {qa}")
    validar(r, capitulos)
    rec = recursos(ler(pasta / "fontes.json"))

    for tentativa in range(2):
        sincronizar(repo)
        numero, nome, arq_audio, arquivos = montar(pasta, repo, r, capitulos, rec)
        if not publicar:
            git(repo, "status", "--short")
            log(f"ENSAIO: nada foi enviado ({arq_audio} iria para o R2). Use --publicar para enviar, commit e push na main.")
            return
        arquivos.append(registrar_audio(repo, arq_audio, enviar_audio(pasta / "episodio.m4a", arq_audio)))
        git(repo, "add", *arquivos)
        git(repo, "commit", "-q", "-m", f"content: episódio {numero}, {r['titulo']}")
        # Push recusado = alguém publicou na main no meio (o painel, outro episódio): refaz em cima da main nova,
        # com o número recalculado.
        if git(repo, "push", "-q", "origin", "HEAD:main", check=False).returncode == 0:
            print(json.dumps({"numero": numero, "url": f"https://www.cyberjus.org/episodios/{nome}/"}))
            return
        log(f"push recusado (tentativa {tentativa + 1}/2); sincronizando com a main e montando de novo")
    raise SystemExit("O push para a main falhou duas vezes; nada foi publicado.")


if __name__ == "__main__":
    main()
