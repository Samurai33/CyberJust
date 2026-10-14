"""Etapa 2: baixa as matérias da pauta, apura uma ficha de fatos, escreve o roteiro e revisa contra a ficha.

Uso: python -m pipeline.roteiro <pautas.json> <n_da_pauta>
Saída em trabalho/<slug>/: pauta.json, fontes.json, ficha.md, roteiro.json (já revisado) e revisao.json.
Custo: zero (sites públicos + plano gratuito do Gemini). Nenhum áudio é gerado aqui.
"""
import json
import sys

import trafilatura
from googlenewsdecoder import gnewsdecoder

from .comum import LOCUTORES, TEMAS, USADOS, gravar, ler, llm, log, pasta_episodio, slug

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
- Números e valores por extenso ("dois milhões de reais"); siglas soletradas com hífens ("O-A-B", "cê-pê-éfe");
  "cyberjus ponto org" para o site.
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

REVISAR = """Você é o revisor de fatos e de tom do CyberJustiça. Compare o ROTEIRO com a FICHA DE FATOS e com as regras
abaixo e corrija o mínimo necessário, mantendo o estilo e o protocolo de retenção.
Procure: número, data, cidade, órgão ou nome que não está na ficha ou diverge dela; detalhe inventado (distância,
idade, "exatamente", citação literal de pessoa real); status do caso diferente da ficha; suspeito não condenado
citado pelo nome; riso ou deboche sobre o prejuízo da vítima; tags de emoção demais (mais de uma a cada 3 falas);
tag [excited], [shouting], [angry] ou [yelling] em fala do Samurai, ou fala dele escrita para soar brava ou
eufórica (exclamações em sequência, caixa alta); siglas não soletradas e números não escritos por extenso; a apresentação "Eu sou o Samurai, e este é o
CyberJustiça." ausente ou dita pela coapresentadora; a coapresentadora chamada por outro nome que não Sara;
promessa do início não cumprida.
NÃO mude a extensão do roteiro (o tamanho já foi conferido pelo código): não acrescente nem remova falas além do
necessário para corrigir um problema. Devolva a lista de problemas (vazia se nenhum) e o roteiro completo corrigido."""

AJUSTAR = """Reescreva o roteiro (JSON) para ficar com cerca de {alvo} palavras somando todas as falas (agora tem {atual}).
{como} Mantenha o protocolo de retenção, a ordem dos capítulos, a promessa e o seu pagamento, a apresentação do Samurai,
os fatos (só os da ficha) e todos os outros campos. Devolva o roteiro completo."""

FAIXA = (1250, 1550)  # 8 a 9,5 minutos a ~160 palavras por minuto


def palavras(roteiro):
    return sum(len(f["texto"].split()) for f in roteiro["falas"])


def ajustar_tamanho(roteiro, ficha):
    """LLM conta palavras mal (a revisão chegou a 'ver' 950 onde havia 1.300): quem confere é o código."""
    for _ in range(2):
        atual = palavras(roteiro)
        if FAIXA[0] <= atual <= FAIXA[1]:
            return roteiro
        como = ("Encurte: tire repetições e falas que não acrescentam, sem cortar o mecanismo do crime nem o checklist."
                if atual > FAIXA[1] else "Alongue: aprofunde o mecanismo do crime e o que fazer, só com fatos da ficha.")
        log(f"roteiro com {atual} palavras, fora de {FAIXA}: ajustando")
        roteiro = llm(f"FICHA DE FATOS:\n{ficha}\n\nROTEIRO (JSON):\n{json.dumps(roteiro, ensure_ascii=False)}", tarefa="ajuste",
                         instrucao=AJUSTAR.format(alvo=1400, atual=atual, como=como) + "\n\n" + PROTOCOLO,
                         esquema=ESQUEMA, temperatura=0.4)
    return roteiro

ESQUEMA_REVISAO = {
    "type": "object",
    "properties": {
        "problemas": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "fala": {"type": "integer", "description": "índice da fala (0 = primeira), -1 se for de outro campo"},
                    "tipo": {"type": "string", "enum": ["fato", "inventado", "status", "nome", "tom", "voz", "protocolo"]},
                    "problema": {"type": "string"},
                    "correcao": {"type": "string"},
                },
                "required": ["fala", "tipo", "problema", "correcao"],
            },
        },
        "roteiro": ESQUEMA,
    },
    "required": ["problemas", "roteiro"],
}


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

    revisao = llm(f"FICHA DE FATOS:\n{ficha}\n\nROTEIRO (JSON):\n{json.dumps(roteiro, ensure_ascii=False)}", tarefa="revisão", instrucao=REVISAR + "\n\n" + PROTOCOLO,
                     esquema=ESQUEMA_REVISAO, temperatura=0.1)
    final = revisao["roteiro"]
    if not FAIXA[0] * 0.9 <= palavras(final) <= FAIXA[1] * 1.1:
        log(f"a revisão mudou o tamanho para {palavras(final)} palavras; mantendo o roteiro ajustado e as correções listadas")
        final = roteiro  # a lista de problemas fica em revisao.json para a aprovação humana
    final["tema"] = pauta["tema"] if pauta["tema"] in TEMAS else "fraudes"
    gravar(pasta / "revisao.json", revisao["problemas"])
    # "capitulo" é opcional no esquema e o modelo às vezes esquece (episódio 2): parar antes de gastar crédito de voz.
    if sum(1 for f in final["falas"] if f.get("capitulo")) < 3:
        gravar(pasta / "roteiro-sem-capitulos.json", final)
        raise SystemExit("O roteiro saiu com menos de 3 capítulos marcados; gere de novo antes do áudio.")
    gravar(pasta / "roteiro.json", final)
    # Para o resumo no Telegram: qual modelo fez cada etapa e o que ficou fora da meta.
    total = palavras(final)
    avisos = [f"tamanho fora da meta: {total} palavras (meta {FAIXA[0]} a {FAIXA[1]})"] if not FAIXA[0] <= total <= FAIXA[1] else []
    gravar(pasta / "modelos.json", {"etapas": [{"tarefa": t, "provedor": p, "modelo": m} for t, p, m in USADOS], "avisos": avisos})

    caracteres = sum(len(f["texto"]) for f in final["falas"])
    total = palavras(final)
    log(f"{len(final['falas'])} falas, {total} palavras (~{total / 160:.1f} min), {caracteres} caracteres; "
        f"{len(revisao['problemas'])} problema(s) corrigido(s) na revisão")
    print(pasta)


if __name__ == "__main__":
    main()
