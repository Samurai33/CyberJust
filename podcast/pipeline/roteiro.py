"""Etapa 2: baixa as matérias da pauta, apura uma ficha de fatos, escreve o roteiro e revisa contra a ficha.

Uso: python -m pipeline.roteiro <pautas.json> <n_da_pauta>
Saída em trabalho/<slug>/: pauta.json, fontes.json, ficha.md, roteiro.json (já revisado) e revisao.json.
Custo: zero (sites públicos + plano gratuito do Gemini). Nenhum áudio é gerado aqui.
"""
import json
import re
import sys

import trafilatura
from googlenewsdecoder import gnewsdecoder

from .comum import LOCUTORES, TEMAS, USADOS, gravar, ler, llm, log, pasta_episodio, slug
from .episodio import problemas_pagina

# ---------- fontes ----------


def baixar_fontes(pauta):
    """Troca os links do Google Notícias pelos originais e extrai o texto de cada matéria."""
    materias = []
    for n in pauta["noticias"]:
        for f in n["fontes"]:
            try:
                d = gnewsdecoder(f["link"], interval=1)
            except Exception as e:
                log("decodificação falhou:", f["nome"], e)
                continue
            url = d.get("decoded_url") if (d.get("success") or d.get("status")) else None  # 0.2.x usa "success"
            if not url:
                continue
            pagina = trafilatura.fetch_url(url)
            texto = trafilatura.extract(pagina, favor_precision=True) if pagina else None
            log(f"{len(texto or ''):>6} {f['nome'][:25]:25} {url[:80]}")
            if texto and len(texto) > 400:  # vídeo ou página sem texto não serve de fonte
                materias.append({"fonte": f["nome"], "url": url, "data": n["data"], "titulo": n["titulo"], "texto": texto[:12000]})
    return materias


# ---------- apuração ----------

APURAR = """Apure o caso para um episódio do podcast CyberJustiça a partir das MATÉRIAS fornecidas. Monte uma FICHA DE
FATOS em português, só com o que as matérias dizem, citando o número da FONTE em cada fato. Dê preferência a fontes
oficiais (polícia, MP, Justiça, gov.br, OAB). Inclua: o que aconteceu, quando e onde, números (presos, mandados,
valores, vítimas), COMO o crime funcionava passo a passo, quem investigou, situação atual (o caso ainda está em
andamento?) e orientações de prevenção e do que fazer se a pessoa for vítima. Quando as fontes divergirem, aponte a
divergência e diga qual fonte é mais confiável. Marque como "não confirmado" o que aparece só numa fonte fraca. Não
cite pelo nome suspeitos que não foram condenados. Não inclua distâncias, idades, datas ou números que as fontes não
trazem."""

# ---------- roteiro ----------

PROTOCOLO = """Você é roteirista do CyberJustiça, podcast brasileiro sobre crimes digitais e os direitos das vítimas.
Apresentadores: SAMURAI (especialista em cibersegurança, voz masculina, firme, didático, um pouco irônico com
golpistas) e a coapresentadora SARA (curiosa, faz as perguntas que o ouvinte faria). O Samurai chama a Sara pelo
nome de vez em quando, como numa conversa real (2 a 4 vezes no episódio); ela nunca se apresenta nem é apresentada.
Português do Brasil coloquial, frases curtas, como conversa real (interrupções, "pera", "nossa").

PROTOCOLO DE RETENÇÃO (obrigatório):
1. COLD OPEN (primeiras 2 a 4 falas, ~20 s): comece no meio de uma cena concreta, sem vinheta nem apresentação.
   Se a cena for dramatizada, deixe claro ("imagina a cena...").
2. PROMESSA + LOOP ABERTO (logo depois): diga o que o ouvinte vai saber até o fim, com um item guardado para o final.
   Em seguida o SAMURAI diz exatamente: "Eu sou o Samurai, e este é o CyberJustiça."
3. A DICA DE SEGURANÇA PRINCIPAL aparece já no primeiro terço (o gancho segura pela história, nunca escondendo
   informação que protege).
4. QUEBRA DE PADRÃO a cada 60 a 90 s: número surpreendente, pergunta, mudança de ritmo, pausa (...), tag de emoção.
5. CAPÍTULOS (4 a 5): cada um termina com MICROGANCHO para o próximo.
6. A coapresentadora faz as perguntas "ingênuas" do ouvinte; o Samurai explica o MECANISMO do crime passo a passo.
7. CLÍMAX: a virada e a resolução do caso real, só com fatos da ficha. Se o caso não terminou, diga que não terminou.
8. FECHAMENTO: cumpre a promessa, checklist prático (banco + MED quando houver Pix, boletim de ocorrência, canais
   oficiais; "o passo a passo está em cyberjus ponto org, na página Fui vítima"), callback à cena do início e CTA
   ("manda este episódio para alguém que...").

LIMITES ÉTICOS (obrigatórios):
- Só fatos da FICHA: números, datas, cidades e órgãos exatamente como nela. Nada que a ficha não traga (nem
  distâncias, nem idades, nem "exatamente"). Fato "não confirmado" não entra, ou entra como "segundo a reportagem".
- Status do caso fiel à ficha: investigação em andamento, foragidos e bloqueio de bens não são caso resolvido.
- Cena dramatizada é anunciada como tal; fala de golpista ou vítima só como exemplo ("algo como...").
- Não cite pelo nome suspeitos não condenados. Casos com crianças: nada gráfico, nada que identifique a vítima.
- Tom: urgência sem pânico; nunca rir do prejuízo ou do sofrimento de vítima. Sem política partidária.

TOM DO SAMURAI (regra fixa, sem exceção): firme, calmo e confiante, como apresentador experiente. NUNCA bravo,
gritado, eufórico ou empolgado demais, nem nos momentos de clímax (prisões, números da operação, valores). A energia
vem do ritmo, das pausas e das palavras, nunca do volume. Nas falas do Samurai são PROIBIDAS as tags [excited],
[shouting], [angry] e [yelling] e pontos de exclamação em sequência ("!!"). No episódio 14 uma fala dele com
[excited] saiu quase gritada e soou brava. A Sara pode se surpreender ([surprised], "Sério?!"), sem gritar.

ESTILO DE APRESENTADOR (soar falado, nunca lido; o modelo de voz segue o texto e a pontuação):
- Escreva como brasileiro fala: "tá", "pra", "né", "a gente", "olha", "sabe?", "então"; frases curtas, às vezes
  incompletas; repetição de ênfase ("dois milhões. Dois milhões!").
- A Sara reage curto e espontâneo ("Sério?", "Pera...", "Hum.", "Não acredito.") e às vezes interrompe com travessão
  (—). O Samurai responde à reação dela antes de seguir, chama a Sara pelo nome de vez em quando e fala direto com
  o ouvinte ("você aí que tá ouvindo").
- Nada de construção de texto escrito: em vez de "Segundo a Delegacia de Estelionatos, a vítima...", diga "e quem
  conta isso é a própria polícia: a vítima...". Checklist em conversa, não em lista lida ("primeiro passo...").
- Pausas antes do dado importante (reticências) e variação de ritmo: pergunta, resposta curta, explicação.

ESCRITA PARA VOZ (ElevenLabs):
- Números e valores por extenso ("dois milhões de reais"), inclusive em nomes ("Operação Disque cento e cinquenta e
  um"). Sigla lida letra por letra vai soletrada com hífens ("O-A-B", "cê-pê-éfe"); sigla lida como palavra vai como
  palavra comum ("Deic", "Procon", "Gedec"); estado por extenso ("Procon de São Paulo"). Nada em CAIXA ALTA.
  "cyberjus ponto org" para o site.
- Título de capítulo vai só no campo "capitulo", nunca falado ("Capítulo um: ..." não entra no texto).
- Tags de entrega em inglês entre colchetes, no início da fala, no máximo uma a cada 3 falas: [chuckles], [sighs],
  [curious], [sarcastic], [serious], [surprised], [whispers], [short pause], [clears throat]; [excited] só para a
  Sara e no máximo uma vez no episódio.
  Reticências e travessões para pausas. Sem SSML.
- Falas de 1 a 4 frases. Duração alvo: 8 a 9 minutos (1.300 a 1.450 palavras no total).

ESCRITA PARA A PÁGINA (titulo, tituloSeo, resumo, descricao, pontos, alertas, tags): texto normal de site, com
algarismos e siglas comuns ("32 mandados", "R$ 2 milhões", "OAB", "Pix"); nada de "por extenso" nem hífens de
soletrar, que são só para as falas. A descricao tem 2 ou 3 parágrafos curtos, só com fatos da ficha."""

FALAS = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "quem": {"type": "string", "enum": list(LOCUTORES)},
            "texto": {"type": "string"},
            "capitulo": {"type": "string", "description": "título do capítulo, só na 1ª fala de cada capítulo"},
        },
        "required": ["quem", "texto"],
    },
}

ESQUEMA = {
    "type": "object",
    "properties": {
        "titulo": {"type": "string", "description": "10 a 90 caracteres, frase normal (não Title Case), com gancho e sem clickbait mentiroso"},
        "tituloSeo": {"type": "string", "description": "versão de 20 a 45 caracteres do título, completa (sem cortar frase)"},
        "slug": {"type": "string", "description": "3 a 6 palavras do caso, minúsculas, sem acento, separadas por hífen (ex.: falso-advogado-ceara)"},
        "resumo": {"type": "string", "description": "50 a 155 caracteres"},
        "descricao": {"type": "string", "description": "2 ou 3 parágrafos em Markdown para a página do episódio, só com fatos da ficha"},
        "ameaca": {"type": "string", "enum": ["CRÍTICO", "ALTO", "MÉDIO", "BAIXO"]},
        "status": {"type": "string", "enum": ["ATIVO", "ARQUIVADO", "RESOLVIDO"]},
        "periodo": {"type": "string", "description": "quando o caso aconteceu, até 40 caracteres"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "pontos": {"type": "array", "items": {"type": "string"}, "description": "4 a 6 pontos do episódio"},
        "alertas": {"type": "array", "items": {"type": "string"}, "description": "4 a 6 alertas práticos"},
        "promessa": {"type": "string", "description": "o loop aberto do início e onde ele é pago"},
        "falas": FALAS,
    },
    "required": ["titulo", "tituloSeo", "slug", "resumo", "descricao", "ameaca", "status", "tags", "pontos", "alertas", "promessa", "falas"],
}

# ---------- revisão ----------

REVISAR = """Você é o revisor de fatos e de tom do CyberJustiça. Compare o ROTEIRO (falas numeradas) com a FICHA DE
FATOS e com as regras abaixo e aponte só o que precisa mudar.
Procure: número, data, cidade, órgão ou nome que não está na ficha ou diverge dela; detalhe inventado (distância,
idade, "exatamente", citação literal de pessoa real); status do caso diferente da ficha; suspeito não condenado
citado pelo nome; riso ou deboche sobre o prejuízo da vítima; tags de emoção demais (mais de uma a cada 3 falas);
tag [excited], [shouting], [angry] ou [yelling] em fala do Samurai, ou fala dele escrita para soar brava ou
eufórica (exclamações em sequência, caixa alta); siglas não soletradas e números não escritos por extenso; a
apresentação "Eu sou o Samurai, e este é o CyberJustiça." ausente ou dita pela coapresentadora; a coapresentadora
chamada por outro nome que não Sara; promessa do início não cumprida. Confira também os campos da página.
Os PROBLEMAS DETECTADOS PELO CÓDIGO (se houver) são certos: corrija cada um que estiver numa fala.
Para cada problema devolva a CORREÇÃO PRONTA: em fala, o texto completo da fala corrigida (mesmo locutor, tamanho
parecido, mesmo estilo, mudando o mínimo); em campo da página, o valor novo. UM item por fala: se a mesma fala tem
vários problemas, junte as correções num só item (o código troca a fala inteira pelo texto_novo). Não mexa em falas que estão certas e
não acrescente nem remova falas (o tamanho já foi conferido pelo código). Lista vazia se não houver problema."""

FAIXA = (1250, 1550)  # 8 a 9,5 minutos a ~160 palavras por minuto
ALVO = 1400

# Ajuste de tamanho por CONTAGEM DE FALAS, não de palavras: modelo conta palavras mal (Gemini viu 950 onde havia 1.300;
# no teste de 14/10/2026 o Nemotron devolveu 1.023 -> 1.023 e o gpt-oss 1.023 -> 906 ao pedir "alongue para 1.400").
# Pedir "exatamente N falas novas, cada uma depois da fala X" funciona, e quem insere e remove é o código.
EXPANDIR = """O roteiro está curto: {atual} palavras, a meta é {alvo}. Escreva EXATAMENTE {n} falas NOVAS para inserir no
roteiro, espalhadas pelos capítulos (não todas no mesmo lugar). Elas aprofundam o mecanismo do crime, o contexto do caso e
o que a pessoa deve fazer, SÓ com fatos da FICHA. PROIBIDO acrescentar o que a ficha não traz: endereços, tipo de imóvel,
e-mails, telefones, sites, valores, motivos ou justificativas dos criminosos, e afirmações sobre o que bancos, polícia ou
Justiça podem ou não fazer (ex.: nunca diga que o Pix não pode ser revertido; o MED existe). Na dúvida, não escreva o
detalhe. Cada fala nova tem de 25 a 45 palavras, segue o estilo
de apresentador e as regras de tom, e encaixa na conversa: a Sara pergunta ou reage, o Samurai explica. Para cada uma,
diga depois de qual fala existente ela entra ("depois" = índice da fala, 0 = primeira). Não altere as falas existentes."""

CORTAR = """O roteiro está longo: {atual} palavras, a meta é {alvo}. Indique EXATAMENTE {n} falas para REMOVER (índices, 0 =
primeira): as mais repetitivas ou que menos acrescentam. NÃO remova: abertura, apresentação do Samurai, falas que abrem
capítulo, a promessa e o seu pagamento, o checklist do que fazer e o fechamento. A conversa precisa continuar fazendo
sentido sem elas."""

ESQUEMA_EXPANDIR = {
    "type": "object",
    "properties": {"insercoes": {"type": "array", "items": {"type": "object", "properties": {
        "depois": {"type": "integer"}, "quem": {"type": "string", "enum": list(LOCUTORES)}, "texto": {"type": "string"}},
        "required": ["depois", "quem", "texto"]}}},
    "required": ["insercoes"],
}
ESQUEMA_CORTAR = {"type": "object", "properties": {"remover": {"type": "array", "items": {"type": "integer"}}},
                  "required": ["remover"]}


def sem_prefixo(texto):
    """Os modelos veem as falas como "[3] samurai: texto" e às vezes devolvem o texto com esse começo (Nemotron,
    14/10/2026); o prefixo iria para o áudio."""
    return re.sub(rf"^\s*(\[\d+\]\s*)?({'|'.join(LOCUTORES)}|{'|'.join(LOCUTORES.values())})\s*:\s*", "", texto.strip(), flags=re.I)


def palavras(roteiro):
    return sum(len(f["texto"].split()) for f in roteiro["falas"])


def protegidas(falas):
    """Falas que o corte não pode tirar: começo (cold open e apresentação), capítulos, site e as 3 últimas."""
    fixas = set(range(min(8, len(falas)))) | set(range(max(0, len(falas) - 3), len(falas)))
    return fixas | {i for i, f in enumerate(falas) if f.get("capitulo") or "cyberjus" in f["texto"].lower()}


def ajustar_tamanho(roteiro, ficha):
    """Leva o roteiro para dentro da FAIXA inserindo ou removendo falas inteiras; o código confere a cada passo."""
    roteiro = json.loads(json.dumps(roteiro))  # cópia: o original fica em roteiro-bruto.json
    for _ in range(3):
        falas, atual = roteiro["falas"], palavras(roteiro)
        if FAIXA[0] <= atual <= FAIXA[1]:
            break
        media = max(15, atual / max(1, len(falas)))
        n = max(1, round(abs(ALVO - atual) / (35 if atual < ALVO else media)))
        numeradas = "\n".join(f"[{i}] {f['quem']}: {f['texto']}" for i, f in enumerate(falas))
        log(f"roteiro com {atual} palavras, fora de {FAIXA}: {'acrescentando' if atual < ALVO else 'removendo'} {n} falas")
        if atual < ALVO:
            r = llm(f"FICHA DE FATOS:\n{ficha}\n\nROTEIRO (falas numeradas):\n{numeradas}", tarefa="ajuste",
                    instrucao=EXPANDIR.format(atual=atual, alvo=ALVO, n=n) + "\n\n" + PROTOCOLO, esquema=ESQUEMA_EXPANDIR,
                    temperatura=0.5)
            # de trás para a frente, para os índices das inserções seguintes continuarem valendo
            for ins in sorted(r["insercoes"], key=lambda x: x["depois"], reverse=True):
                pos = min(max(int(ins["depois"]), 0), len(falas) - 1) + 1
                if ins["quem"] in LOCUTORES and len(ins["texto"].split()) >= 8:
                    falas.insert(pos, {"quem": ins["quem"], "texto": sem_prefixo(ins["texto"])})
        else:
            r = llm(f"ROTEIRO (falas numeradas):\n{numeradas}", tarefa="ajuste", esquema=ESQUEMA_CORTAR, temperatura=0.2,
                    instrucao=CORTAR.format(atual=atual, alvo=ALVO, n=n))
            fora = {i for i in r["remover"] if 0 <= i < len(falas)} - protegidas(falas)
            roteiro["falas"] = [f for i, f in enumerate(falas) if i not in fora]
    log(f"tamanho final: {palavras(roteiro)} palavras")
    return roteiro


CAMPOS_REVISAVEIS = ["titulo", "tituloSeo", "resumo", "descricao", "status", "ameaca", "periodo"]
ESQUEMA_REVISAO = {
    "type": "object",
    "properties": {
        "problemas": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "fala": {"type": "integer", "description": "índice da fala (0 = primeira), -1 se for campo da página"},
                    "campo": {"type": "string", "enum": ["fala", *CAMPOS_REVISAVEIS]},
                    "tipo": {"type": "string", "enum": ["fato", "inventado", "status", "nome", "tom", "voz", "protocolo"]},
                    "problema": {"type": "string"},
                    "texto_novo": {"type": "string", "description": "a fala inteira já corrigida, ou o valor novo do campo"},
                },
                "required": ["fala", "campo", "tipo", "problema", "texto_novo"],
            },
        },
    },
    "required": ["problemas"],
}


def aplicar_revisao(roteiro, problemas):
    """Aplica as correções pontuais da revisão. Até 14/10/2026 o revisor devolvia o roteiro inteiro: mexia em falas
    certas, às vezes mudava o tamanho (e a revisão toda era descartada) e gastava ~10 mil tokens de saída."""
    roteiro = json.loads(json.dumps(roteiro))
    falas, aplicadas = roteiro["falas"], []
    for p in problemas:
        novo = sem_prefixo(p.get("texto_novo") or "")
        if not novo:
            continue
        if p["campo"] == "fala":
            i = p["fala"]
            if not 0 <= i < len(falas):
                log(f"revisão: a fala {i} não existe; correção ignorada")
                continue
            antes, depois = len(falas[i]["texto"].split()), len(novo.split())
            if not 0.4 * antes <= depois <= 2.5 * antes + 10:  # correção, não reescrita
                log(f"revisão: a fala {i} iria de {antes} para {depois} palavras; correção ignorada")
                continue
            if novo == falas[i]["texto"]:
                log(f"revisão: a correção da fala {i} veio igual ao original; ignorada")
                continue
            falas[i]["texto"] = novo
        elif p["campo"] in ("status", "ameaca") and novo not in ESQUEMA["properties"][p["campo"]]["enum"]:
            log(f"revisão: {p['campo']} inválido ({novo!r}); correção ignorada")
            continue
        else:
            roteiro[p["campo"]] = novo
        aplicadas.append(p)
    return roteiro, aplicadas


# ---------- conferências do código (sem modelo) ----------

TAG = re.compile(r"\[[^\]]+\]")
PROIBIDAS_SAMURAI = re.compile(r"\[(excited|shouting|angry|yelling|shouts|furious)\]", re.I)
SIGLA = re.compile(r"\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}\b")


def conferir(roteiro):
    """Regras que o código confere melhor que o modelo. Devolve [(fala, problema)]; fala -1 = roteiro todo."""
    falas, nome = roteiro["falas"], LOCUTORES["coapresentadora"]
    achados = []
    apresentacao = [i for i, f in enumerate(falas) if "eu sou o samurai" in f["texto"].lower()]
    if not apresentacao:
        achados.append((-1, 'falta a apresentação "Eu sou o Samurai, e este é o CyberJustiça."'))
    achados += [(i, "a apresentação do Samurai está numa fala da coapresentadora") for i in apresentacao
                if falas[i]["quem"] != "samurai"]
    if not any("cyberjus ponto org" in f["texto"].lower() for f in falas):
        achados.append((-1, 'falta "cyberjus ponto org" no fechamento'))
    capitulos = sum(1 for f in falas if f.get("capitulo"))
    if not 3 <= capitulos <= 6:
        achados.append((-1, f"{capitulos} capítulos marcados (o protocolo pede 4 a 5)"))
    tags = sum(len(TAG.findall(f["texto"])) for f in falas)
    if tags > len(falas) / 3 + 1:
        achados.append((-1, f"{tags} tags de emoção em {len(falas)} falas (no máximo uma a cada 3)"))
    for i, f in enumerate(falas):
        texto = TAG.sub("", f["texto"])
        if f["quem"] == "samurai" and (PROIBIDAS_SAMURAI.search(f["texto"]) or "!!" in texto):
            achados.append((i, "fala do Samurai com tag ou pontuação de grito (o tom dele é calmo)"))
        if f["quem"] == "coapresentadora" and re.search(rf"\b{re.escape(nome)}\b", texto, re.I):
            achados.append((i, f"a {nome} diz o próprio nome"))
        if re.match(r"\s*cap[ií]tulo\s+\w+\s*:", texto, re.I):
            achados.append((i, "título de capítulo lido em voz alta (vai só no campo capitulo)"))
        if re.search(r"\d", texto):
            achados.append((i, "número em algarismos (na fala vai por extenso)"))
        siglas = set(SIGLA.findall(texto)) - {"MED"}  # MED se fala como palavra
        if siglas:
            achados.append((i, f"caixa alta: escreva como palavra (Deic) se a sigla é lida como palavra, ou soletrada (cê-pê-éfe): {', '.join(sorted(siglas))}"))
    if not any(re.search(rf"\b{re.escape(nome)}\b", f["texto"], re.I) for f in falas if f["quem"] == "samurai"):
        achados.append((-1, f"o Samurai nunca chama a {nome} pelo nome"))
    return achados


def formatar(achados):
    return "\n".join(f"- {'roteiro' if i < 0 else f'fala {i}'}: {p}" for i, p in achados)


MARCAR_CAPITULOS = """Divida o ROTEIRO (falas numeradas) em 4 ou 5 CAPÍTULOS, nos pontos em que a conversa muda de
assunto (abertura, como o crime funciona, o caso real, o que fazer, fechamento). O primeiro começa na fala 0. Para
cada capítulo dê o índice da fala em que ele começa e um título curto (3 a 8 palavras, frase normal, sem "Capítulo
1"). Use só índices que existem."""

ESQUEMA_CAPITULOS = {"type": "object", "properties": {"capitulos": {"type": "array", "items": {"type": "object", "properties": {
    "fala": {"type": "integer"}, "titulo": {"type": "string"}}, "required": ["fala", "titulo"]}}}, "required": ["capitulos"]}


def marcar_capitulos(roteiro):
    """O "capitulo" é opcional no esquema e o modelo às vezes não marca nenhum (episódio 2). Em vez de parar e gerar
    tudo de novo, uma chamada pequena escolhe onde cortar e o código grava os títulos."""
    falas = roteiro["falas"]
    numeradas = "\n".join(f"[{i}] {f['quem']}: {f['texto']}" for i, f in enumerate(falas))
    r = llm(f"ROTEIRO (falas numeradas):\n{numeradas}", instrucao=MARCAR_CAPITULOS, esquema=ESQUEMA_CAPITULOS,
            temperatura=0.2, tarefa="capítulos")
    marcas = {c["fala"]: c["titulo"].strip()[:80] for c in r["capitulos"]
              if 0 <= c["fala"] < len(falas) and len(c["titulo"].strip()) >= 2}
    if len(marcas) < 3:
        return False
    if 0 not in marcas:  # o primeiro capítulo começa no 0:00 do áudio
        marcas[0] = marcas.pop(min(marcas)) if min(marcas) <= 3 else "Abertura"
    for f in falas:
        f.pop("capitulo", None)
    for i, titulo in marcas.items():
        falas[i]["capitulo"] = titulo
    log(f"capítulos marcados à parte, nas falas {sorted(marcas)}")
    return True


NATURALIZAR = """Reescreva só o campo "texto" de cada fala no ESTILO DE APRESENTADOR, para soar como dois apresentadores
conversando e não como leitura. Mantenha: a mesma quantidade e ordem de falas, quem fala, os capítulos, todos os fatos
e números (só os da ficha), a apresentação "Eu sou o Samurai, e este é o CyberJustiça.", a promessa e o seu
pagamento, e o tamanho total (no máximo 5% a mais ou a menos de palavras). Devolva o roteiro completo."""


def naturalizar(pasta):
    """Passa um roteiro já aprovado para o estilo de apresentador (uso: python -m pipeline.roteiro --naturalizar <pasta>)."""
    roteiro, ficha = ler(pasta / "roteiro.json"), (pasta / "ficha.md").read_text(encoding="utf-8")
    novo = llm(f"FICHA DE FATOS:\n{ficha}\n\nROTEIRO (JSON):\n{json.dumps(roteiro, ensure_ascii=False)}",
                  instrucao=NATURALIZAR + "\n\n" + PROTOCOLO, esquema=ESQUEMA, temperatura=0.7)
    if len(novo["falas"]) != len(roteiro["falas"]) or any(a["quem"] != b["quem"] for a, b in zip(novo["falas"], roteiro["falas"])):
        raise SystemExit("A reescrita mudou a estrutura das falas; roteiro mantido.")
    nome = LOCUTORES["coapresentadora"]
    if any(f["quem"] == "coapresentadora" and nome.lower() in f["texto"].lower() for f in novo["falas"]):
        raise SystemExit(f"A reescrita pôs a {nome} chamando o próprio nome; roteiro mantido.")
    for campo in ("tema", "descricao", "slug", "tituloSeo"):  # campos que a reescrita não deve tocar
        if campo in roteiro:
            novo[campo] = roteiro[campo]
    gravar(pasta / "roteiro-antes-naturalizar.json", roteiro)
    gravar(pasta / "roteiro.json", novo)
    log(f"naturalizado: {palavras(roteiro)} -> {palavras(novo)} palavras")


def main():
    if sys.argv[1] == "--naturalizar":
        return naturalizar(pasta_episodio(sys.argv[2].rstrip("/").split("/")[-1]))
    pautas, n = ler(sys.argv[1]), int(sys.argv[2])
    pauta = pautas[n - 1]
    pasta = pasta_episodio(slug(pauta["titulo"]))
    gravar(pasta / "pauta.json", pauta)

    materias = baixar_fontes(pauta)
    if len(materias) < 2:
        raise SystemExit(f"Só {len(materias)} matéria(s) com texto: fontes insuficientes para apurar com segurança.")
    gravar(pasta / "fontes.json", materias)

    textos = "\n\n".join(f"=== FONTE {i}: {m['fonte']} ({m['data']}) {m['url']}\n{m['texto']}" for i, m in enumerate(materias, 1))
    ficha = llm(f"Pauta: {pauta['titulo']}\n\n{textos}", instrucao=APURAR, temperatura=0.1, tarefa="ficha")
    (pasta / "ficha.md").write_text(ficha, encoding="utf-8")

    roteiro = llm(f"TEMA DO SITE: {pauta['tema']}\nPAUTA: {pauta['titulo']}\n\nFICHA DE FATOS:\n{ficha}", tarefa="roteiro",
                     instrucao=PROTOCOLO, esquema=ESQUEMA, temperatura=0.8)
    gravar(pasta / "roteiro-bruto.json", roteiro)
    roteiro = ajustar_tamanho(roteiro, ficha)
    if sum(1 for f in roteiro["falas"] if f.get("capitulo")) < 3 and not marcar_capitulos(roteiro):
        gravar(pasta / "roteiro-sem-capitulos.json", roteiro)
        raise SystemExit("O roteiro saiu com menos de 3 capítulos e a marcação à parte falhou; gere de novo antes do áudio.")

    achados = conferir(roteiro)
    detectados = f"\n\nPROBLEMAS DETECTADOS PELO CÓDIGO:\n{formatar(achados)}" if achados else ""
    pagina = {c: roteiro.get(c) for c in CAMPOS_REVISAVEIS}
    numeradas = "\n".join(f"[{i}] {f['quem']}: {f['texto']}" for i, f in enumerate(roteiro["falas"]))
    revisao = llm(f"FICHA DE FATOS:\n{ficha}\n\nCAMPOS DA PÁGINA:\n{json.dumps(pagina, ensure_ascii=False)}\n\n"
                  f"ROTEIRO (falas numeradas):\n{numeradas}{detectados}", tarefa="revisão",
                  instrucao=REVISAR + "\n\n" + PROTOCOLO, esquema=ESQUEMA_REVISAO, temperatura=0.1)
    final, aplicadas = aplicar_revisao(roteiro, revisao["problemas"])
    final["tema"] = pauta["tema"] if pauta["tema"] in TEMAS else "fraudes"
    gravar(pasta / "revisao.json", aplicadas)
    gravar(pasta / "roteiro.json", final)
    # Para o resumo no Telegram: qual modelo fez cada etapa e o que continua fora das regras depois da revisão
    # (o áudio.py ainda tira as tags proibidas, mas número em algarismo ou sigla a pessoa precisa ver antes de aprovar).
    total = palavras(final)
    avisos = [f"tamanho fora da meta: {total} palavras (meta {FAIXA[0]} a {FAIXA[1]})"] if not FAIXA[0] <= total <= FAIXA[1] else []
    avisos += [f"{'roteiro' if i < 0 else f'fala {i + 1}'}: {p}" for i, p in conferir(final)]
    avisos += [f"página: {p} (corrija no roteiro.json antes de publicar)" for p in problemas_pagina(final)]
    gravar(pasta / "modelos.json", {"etapas": [{"tarefa": t, "provedor": p, "modelo": m} for t, p, m in USADOS], "avisos": avisos})

    caracteres = sum(len(f["texto"]) for f in final["falas"])
    log(f"{len(final['falas'])} falas, {total} palavras (~{total / 160:.1f} min), {caracteres} caracteres; "
        f"{len(achados)} achado(s) do código, {len(aplicadas)} correção(ões) da revisão, {len(avisos)} aviso(s) restantes")
    print(pasta)


if __name__ == "__main__":
    main()
