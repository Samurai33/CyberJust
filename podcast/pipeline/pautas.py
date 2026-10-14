"""Etapa 1: raspa casos reais recentes no Google Notícias e ranqueia as melhores pautas com o Gemini.

Uso: python -m pipeline.pautas [--dias 14] [--quantas 15]
Saída: pautas/<data>.json (lista ranqueada, cada pauta com as notícias e os links do Google Notícias).
Custo: zero (RSS público + plano gratuito do Gemini).
"""
import argparse
import datetime as dt
import html
import re
import time
import urllib.parse
import urllib.request
from email.utils import parsedate_to_datetime

from .comum import DADOS, TEMAS, gemini, gravar, log

# Consultas específicas por tipo de crime, agrupadas pelos temas do site (src/data/temas.ts).
CONSULTAS = {
    "fraudes": [
        '"golpe do falso parente"', '"falso advogado" golpe', '"falsa central" banco golpe',
        'golpe Pix presos OR operação', '"golpe do Pix"', 'phishing golpe mensagem',
        '"engenharia social" golpe', 'deepfake golpe', 'golpe WhatsApp clonado',
        '"falso leilão" OR "loja falsa" golpe', 'golpe investimento OR pirâmide cripto',
        '"Mecanismo Especial de Devolução" Pix', 'estelionato digital operação polícia',
    ],
    "dados-pessoais": [
        'vazamento de dados', 'ANPD multa OR sanção OR fiscalização', 'ataque hacker OR ransomware empresa',
        '"dados pessoais" LGPD decisão', 'invasão sistema hacker preso',
    ],
    "protecao-infantil": [
        'aliciamento online criança OR adolescente', 'sextorsão', 'abuso sexual infantil internet operação',
        'cyberbullying escola', '"ECA Digital"', 'SaferNet denúncias',
    ],
    "corrupcao": [
        'lavagem de dinheiro criptomoeda operação', 'bets lavagem OR fraude operação',
        'fraude bancária operação Polícia Federal',
    ],
}

# Filtro barato antes do Gemini: política partidária, eleições e esporte ("golpe" de luta ou de Estado).
FORA = re.compile(
    r"bolsonaro|\blula\b|flávio|valdemar|eleiç|eleitor|\burna|\bTSE\b|impeachment|anistia|candidat|senador|"
    r"deputad|vereador|prefeito eleito|jiu-jitsu|luta livre|árbitro|futebol|\bUFC\b|golpe de estado|8 de janeiro",
    re.I,
)

INSTRUCAO = """Você é o editor de pauta do CyberJustiça, podcast brasileiro sobre crimes digitais e os direitos de quem
é vítima. Temas: fraudes (golpes, Pix, phishing, engenharia social), dados-pessoais (vazamentos, LGPD, ataques),
protecao-infantil (aliciamento, sextorsão, cyberbullying) e corrupcao (lavagem com cripto, bets, fraudes bancárias
organizadas).

Escolha as melhores pautas na lista de notícias (índice, data, tema, fontes, título). Critérios:
- caso REAL e concreto no Brasil (operação policial, prisão, decisão judicial ou da ANPD, golpe novo com vítimas,
  dado oficial novo), não opinião nem matéria genérica de dicas;
- utilidade para o ouvinte: dá para explicar como o crime funciona e como se proteger ou agir;
- relevância e novidade; prefira casos com várias fontes ou com fonte oficial (gov.br, MP, PF, polícia civil);
- junte num só item as notícias que falam do mesmo caso.
EXCLUA SEMPRE: política partidária, eleições, casos que envolvem políticos ou partidos, esporte, celebridades sem
relação com crime digital, casos fora do Brasil sem impacto aqui, e casos cuja graça é expor o nome de um suspeito
ainda não condenado. Use só os índices da lista. Não invente fatos além dos títulos."""

ESQUEMA = {
    "type": "object",
    "properties": {
        "pautas": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "titulo": {"type": "string", "description": "título curto da pauta em pt-BR"},
                    "tema": {"type": "string", "enum": TEMAS},
                    "indices": {"type": "array", "items": {"type": "integer"}},
                    "por_que": {"type": "string", "description": "uma frase: por que rende um bom episódio"},
                    "nota": {"type": "integer", "description": "1 a 10"},
                },
                "required": ["titulo", "tema", "indices", "por_que", "nota"],
            },
        }
    },
    "required": ["pautas"],
}


def rss(consulta, dias):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": f"{consulta} when:{dias}d", "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419"}
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (CyberJust pautas)"})
    return urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")


def chave(titulo):
    # O mesmo título publicado por veículos diferentes vira um caso só.
    return " ".join(re.findall(r"[a-zà-ú0-9]{4,}", titulo.lower())[:8])


def raspar(dias):
    casos = {}
    for tema, consultas in CONSULTAS.items():
        for c in consultas:
            try:
                xml = rss(c, dias)
            except Exception as e:  # uma consulta com erro não derruba a raspagem
                log("rss falhou:", c, e)
                continue
            for item in re.findall(r"<item>(.*?)</item>", xml, re.S):
                bruto = html.unescape(re.search(r"<title>(.*?)</title>", item, re.S)[1]).strip()
                if FORA.search(bruto):
                    continue
                titulo = re.sub(r"\s+-\s+[^-]+$", "", bruto)  # tira o " - Veículo" do fim
                fonte = re.search(r'<source url="([^"]+)">(.*?)</source>', item)
                data = parsedate_to_datetime(re.search(r"<pubDate>(.*?)</pubDate>", item)[1]).date().isoformat()
                caso = casos.setdefault(chave(titulo), {"titulo": titulo, "tema": tema, "data": data, "fontes": []})
                nome = html.unescape(fonte[2]) if fonte else "?"
                if nome not in [f["nome"] for f in caso["fontes"]]:
                    caso["fontes"].append({"nome": nome, "site": fonte[1] if fonte else "", "link": re.search(r"<link>(.*?)</link>", item)[1]})
                caso["data"] = max(caso["data"], data)
            time.sleep(1)  # educado com o Google
    return sorted(casos.values(), key=lambda c: (c["data"], len(c["fontes"])), reverse=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dias", type=int, default=14)
    ap.add_argument("--quantas", type=int, default=15)
    a = ap.parse_args()

    casos = raspar(a.dias)
    log(f"{len(casos)} notícias únicas em {a.dias} dias")
    linhas = "\n".join(
        f"{i}\t{c['data']}\t{c['tema']}\t{', '.join(f['nome'] for f in c['fontes'])}\t{c['titulo']}" for i, c in enumerate(casos)
    )
    r = gemini(linhas, instrucao=INSTRUCAO + f"\nDevolva as {a.quantas} melhores.", esquema=ESQUEMA)
    pautas = []
    for p in sorted(r["pautas"], key=lambda p: p["nota"], reverse=True):
        p["noticias"] = [casos[i] for i in p.pop("indices") if 0 <= i < len(casos)]
        if p["noticias"]:
            pautas.append(p)
    saida = DADOS / "pautas" / f"{dt.date.today().isoformat()}.json"
    gravar(saida, pautas)
    log(f"{len(pautas)} pautas em {saida}")
    print(saida)


if __name__ == "__main__":
    main()
