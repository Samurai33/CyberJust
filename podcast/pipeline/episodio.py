"""Etapa 5: monta o episódio no formato do site (Markdown + áudio + transcrição) num clone do repositório.

Uso: python -m pipeline.episodio <pasta> <repo> [--publicar]
Sem --publicar: só grava os arquivos no clone e mostra o diff (nada sai da máquina).
Com --publicar: commit na main e push; o webhook do Coolify publica o site.
Regras do CLAUDE.md do repositório: nada de fato inventado, links conferidos (HTTP 200) e arquivo de áudio novo a
cada mudança (o cache é imutável).
"""
import datetime as dt
import hashlib
import json
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

from .comum import TEMAS, ler, log, slug

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


def validar(r, capitulos):
    """As mesmas regras do esquema em src/content.config.ts, para o build do site não quebrar depois do push."""
    erros = []
    if not 10 <= len(r["titulo"]) <= 90:
        erros.append(f"titulo com {len(r['titulo'])} caracteres (10 a 90)")
    if not 50 <= len(r["resumo"]) <= 155:
        erros.append(f"resumo com {len(r['resumo'])} caracteres (50 a 155)")
    if len(r.get("periodo") or "") > 40:
        erros.append("periodo com mais de 40 caracteres")
    if r["tema"] not in TEMAS:
        erros.append(f"tema inválido: {r['tema']}")
    if not capitulos:
        erros.append("roteiro sem capítulos (o modelo não marcou o campo capitulo em nenhuma fala)")
    for c in capitulos:
        if not 2 <= len(c["titulo"]) <= 80:
            erros.append(f"capítulo com título inválido: {c['titulo']!r}")
    if erros:
        raise SystemExit("Episódio inválido para o site: " + "; ".join(erros))


def main():
    pasta, repo = Path(sys.argv[1]), Path(sys.argv[2])
    publicar = "--publicar" in sys.argv
    r = ler(pasta / "roteiro.json")
    capitulos = ler(pasta / "capitulos.json")
    qa = ler(pasta / "qa.json")
    if not qa.get("aprovado"):
        raise SystemExit(f"O controle de qualidade reprovou o áudio: {qa}")
    validar(r, capitulos)

    if publicar:
        subprocess.run(["git", "-C", str(repo), "pull", "--ff-only", "-q"], check=True)
    episodios = repo / "src" / "content" / "episodios"
    nome = slug(r.get("slug") or r["titulo"], 50)
    numeros = [int(m) for p in episodios.glob("*.md") for m in re.findall(r"^numero:\s*(\d+)", p.read_text(encoding="utf-8"), re.M)]
    numero = max(numeros, default=0) + 1

    audio = (pasta / "episodio.m4a").read_bytes()
    marca = hashlib.sha256(audio).hexdigest()[:8]  # arquivo novo a cada versão: o cache do áudio é imutável
    arq_audio = f"/audio/{nome}-{marca}.m4a"
    arq_vtt = f"/transcricoes/{nome}-{marca}.vtt"
    (repo / "public" / "transcricoes").mkdir(exist_ok=True)
    shutil.copyfile(pasta / "episodio.m4a", repo / "public" / arq_audio.lstrip("/"))
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
        f"data: {yaml(dt.date.today().isoformat())}",
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
    rec = recursos(ler(pasta / "fontes.json"))
    if rec:
        fm.append("recursos:")
        for x in rec:
            fm += [f"  - titulo: {yaml(x['titulo'])}", f"    url: {x['url']}", f"    fonte: {yaml(x['fonte'])}", f"    tipo: {x['tipo']}"]
    fm.append("---")
    md = "\n".join(fm) + "\n\n" + r["descricao"].strip() + "\n"
    destino = episodios / f"{nome}.md"
    destino.write_text(md, encoding="utf-8")
    log(f"episódio {numero}: {destino.relative_to(repo)} | {arq_audio} | {len(capitulos)} capítulos | {len(rec)} recursos")

    if not publicar:
        subprocess.run(["git", "-C", str(repo), "status", "--short"])
        log("ENSAIO: nada foi enviado. Use --publicar para commit e push na main.")
        return
    arquivos = [str(destino.relative_to(repo)), "public" + arq_audio, "public" + arq_vtt]
    subprocess.run(["git", "-C", str(repo), "add", *arquivos], check=True)
    subprocess.run(["git", "-C", str(repo), "commit", "-q", "-m", f"content: episódio {numero}, {r['titulo']}"], check=True)
    subprocess.run(["git", "-C", str(repo), "push", "-q", "origin", "HEAD:main"], check=True)
    print(json.dumps({"numero": numero, "url": f"https://www.cyberjus.org/episodios/{nome}/"}))


if __name__ == "__main__":
    main()
