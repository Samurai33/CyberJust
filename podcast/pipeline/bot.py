"""Bot do Telegram que conduz o pipeline com três aprovações: pauta, roteiro (antes de gastar créditos) e áudio.

Uso: python -m pipeline.bot      (contêiner sempre ligado; ver podcast/compose.yml)
Ambiente: TELEGRAM_TOKEN (bot só do podcast), TELEGRAM_CHAT (o único chat que o bot obedece), PAUTAS_DIAS (dias da
semana das sugestões, 0 = segunda; padrão "0,2,4"), PAUTAS_HORA (padrão 9, horário de Brasília) e as variáveis das
outras etapas. Long polling: não abre porta nem depende do túnel.

Abas: com o Threaded Mode do bot ligado (@BotFather › Bot Settings › Threads Settings, só pelo mini app), o chat
privado ganha tópicos e cada assunto vai para o seu (ABAS). Os ids ficam em topicos.json; aba apagada é recriada.
Sem Threaded Mode, tudo continua no chat normal.
"""
import datetime as dt
import hashlib
import json
import os
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from .comum import DADOS, TRABALHO, gravar, ler, log

TOKEN = os.environ["TELEGRAM_TOKEN"]
CHAT = int(os.environ["TELEGRAM_CHAT"])
DIAS = {int(d) for d in os.environ.get("PAUTAS_DIAS", "0,2,4").split(",")}
HORA = int(os.environ.get("PAUTAS_HORA", "9"))
REPO = Path(os.environ.get("REPO", "/dados/repo"))
BRT = dt.timezone(dt.timedelta(hours=-3))
CREDITO_POR_CARACTERE = 0.12  # medido no Eleven v4 (Text to Dialogue): 224 créditos para 1.852 caracteres
# Fala avulsa (--refazer-fala) sai bem mais cara: no episódio 2 (14/10/2026), 8 falas custaram de 0,41 a 0,44 crédito
# por caractere (63 créditos para 144 caracteres), e não os ~20 por fala que o botão prometia.
CREDITO_FALA_AVULSA = 0.45
ocupado = threading.Lock()  # uma etapa pesada por vez
atual = {"nome": None, "desde": None}  # o que está rodando, para o /status e o aviso de ocupado
# Cores aceitas pelo createForumTopic: azul 7322096, amarelo 16766590, violeta 13338331, verde 9367192, rosa 16749490,
# vermelho 16478047.
ABAS = {"pautas": ("🗞️ Pautas", 16766590), "producao": ("🎙️ Produção", 13338331),
        "publicacao": ("🚀 Publicação", 9367192), "sistema": ("⚙️ Sistema", 7322096)}
ABA_DA_ACAO = {"sugerir": "pautas", "produzir": "producao", "audio": "producao", "refazer": "producao",
               "publicar": "publicacao", "descartar": "producao"}
TOPICOS = DADOS / "topicos.json"
topicos_trava = threading.Lock()
sem_topicos_ate = [0.0]  # Threaded Mode desligado: não tenta criar aba de novo por 10 min
NOMES = {"sugerir": "buscando pautas", "produzir": "escrevendo o roteiro", "audio": "gerando o áudio",
         "refazer": "refazendo uma fala", "publicar": "publicando", "descartar": "descartando"}


def andamento():
    if not atual["nome"]:
        return "💤 Livre."
    minutos = int((time.time() - atual["desde"]) // 60)
    return f"⏳ {NOMES.get(atual['nome'], atual['nome'])} há {minutos} min."


class ErroTelegram(Exception):
    pass


def tg(metodo, **campos):
    dados = urllib.parse.urlencode({k: json.dumps(v) if isinstance(v, (dict, list)) else v for k, v in campos.items()}).encode()
    try:
        r = urllib.request.urlopen(f"https://api.telegram.org/bot{TOKEN}/{metodo}", data=dados, timeout=70)
    except urllib.error.HTTPError as e:  # o motivo vem no corpo ("message thread not found" etc.)
        raise ErroTelegram(f"{metodo}: {e.code} {e.read().decode(errors='replace')[:300]}") from None
    return json.loads(r.read())["result"]


def tg_arquivo(metodo, campo, caminho, **campos):
    """Envio multipart (documento ou áudio) só com a biblioteca padrão."""
    limite = uuid.uuid4().hex
    corpo = b""
    for k, v in campos.items():
        v = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
        corpo += f'--{limite}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    corpo += (f'--{limite}\r\nContent-Disposition: form-data; name="{campo}"; filename="{Path(caminho).name}"\r\n'
              f"Content-Type: application/octet-stream\r\n\r\n").encode() + Path(caminho).read_bytes() + f"\r\n--{limite}--\r\n".encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{TOKEN}/{metodo}", data=corpo,
                                 headers={"Content-Type": f"multipart/form-data; boundary={limite}"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=300).read())["result"]
    except urllib.error.HTTPError as e:
        raise ErroTelegram(f"{metodo}: {e.code} {e.read().decode(errors='replace')[:300]}") from None


def topico(aba, recriar=False):
    """message_thread_id da aba, criando o tópico na primeira vez. None = sem Threaded Mode (vai para o chat normal)."""
    with topicos_trava:
        ids = ler(TOPICOS) if TOPICOS.exists() else {}
        if aba in ids and not recriar:
            return ids[aba]
        if time.time() < sem_topicos_ate[0]:
            return None
        nome, cor = ABAS[aba]
        try:
            ids[aba] = tg("createForumTopic", chat_id=CHAT, name=nome, icon_color=cor)["message_thread_id"]
        except Exception as e:
            log("aba", aba, "não criada (Threaded Mode desligado?):", e)
            sem_topicos_ate[0] = time.time() + 600
            return None
        gravar(TOPICOS, ids)
        return ids[aba]


def na_aba(aba, enviar):
    """Chama enviar(extra) com o message_thread_id da aba; se a aba foi apagada no app, recria e manda de novo."""
    t = topico(aba)
    try:
        return enviar({"message_thread_id": t} if t else {})
    except ErroTelegram as e:
        if not t or "thread not found" not in str(e).lower():
            raise
        t = topico(aba, recriar=True)
        return enviar({"message_thread_id": t} if t else {})


def msg(texto, botoes=None, aba="sistema"):
    extra = {"reply_markup": {"inline_keyboard": botoes}} if botoes else {}
    return na_aba(aba, lambda t: tg("sendMessage", chat_id=CHAT, text=texto, parse_mode="HTML",
                                    link_preview_options={"is_disabled": True}, **extra, **t))


def enviar_arquivo(metodo, campo, caminho, aba, **campos):
    # Não chame de "arquivo": produzir() e sugerir_pautas() usam esse nome para o arquivo de pautas, e a variável
    # escondia a função ("'str' object is not callable" ao mandar o roteiro, 14/10/2026).
    return na_aba(aba, lambda t: tg_arquivo(metodo, campo, caminho, chat_id=CHAT, **campos, **t))


def etapa(*args, env=None):
    """Roda uma etapa do pipeline num processo separado e devolve (ok, última linha de stdout, fim do log)."""
    r = subprocess.run(["python", "-m", *args], capture_output=True, text=True, env={**os.environ, **(env or {})}, cwd=DADOS)
    saida = r.stdout.strip().splitlines()
    return r.returncode == 0, (saida[-1] if saida else ""), r.stderr[-1500:]


def chave(nome):
    """O Telegram aceita no máximo 64 bytes em callback_data: "publicar|" + nome de pasta de 60 caracteres passava
    disso e a mensagem com os botões era recusada. O botão leva um código curto do nome da pasta."""
    return hashlib.sha1(nome.encode()).hexdigest()[:10]


def pasta_da_chave(codigo):
    # Botões enviados antes desta mudança levam o nome inteiro da pasta.
    if "/" not in codigo and codigo not in (".", "..") and (TRABALHO / codigo).is_dir():
        return codigo
    achada = next((p.name for p in TRABALHO.iterdir() if p.is_dir() and chave(p.name) == codigo), None)
    if not achada:
        raise ValueError(f"episódio {codigo} não encontrado em trabalho/")
    return achada


def esc(t):
    return str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------- etapas acionadas pelos botões ----------


def ocupados(erro, acao, args):
    """Todos os modelos fortes ocupados: avisa e agenda outra tentativa em 15 minutos, sem entregar texto pior."""
    if "PROVEDORES OCUPADOS" not in erro:
        return False
    msg(f"⏳ Gemini, NVIDIA e Cloudflare ocupados agora. Tento de novo sozinho em 15 min ({NOMES.get(acao, acao)}).",
        aba=ABA_DA_ACAO[acao])
    threading.Timer(900, executar, args=(acao, args)).start()
    return True


def sugerir_pautas():
    ok, arquivo, erro = etapa("pipeline.pautas")
    if not ok:
        if ocupados(erro, "sugerir", ()):
            return
        return msg(f"⚠️ Falha ao buscar pautas:\n<pre>{esc(erro[-800:])}</pre>", aba="pautas")
    pautas = ler(arquivo)
    meta = Path(arquivo).with_suffix(".meta.json")
    repetidas = ler(meta).get("repetidas", 0) if meta.exists() else 0
    nota = f" · {repetidas} já feita(s) no site, fora" if repetidas else ""
    linhas, botoes = [f"🗞️ <b>Pautas da semana</b> (casos reais, últimos 14 dias{nota})\n"], []
    for i, p in enumerate(pautas[:3], 1):
        fontes = sum(len(n["fontes"]) for n in p["noticias"])
        linhas.append(f"<b>{i}. {esc(p['titulo'])}</b>\nNota {p['nota']}/10 · {p['tema']} · {fontes} fontes\n<i>{esc(p['por_que'])}</i>\n")
        botoes.append([{"text": f"🎙️ Produzir {i}", "callback_data": f"produzir|{Path(arquivo).name}|{i}"}])
    msg("\n".join(linhas), botoes, aba="pautas")


def produzir(arquivo, n):
    msg(f"✍️ Apurando as fontes e escrevendo o roteiro da pauta {n}… (grátis, alguns minutos)", aba="producao")
    ok, pasta, erro = etapa("pipeline.roteiro", f"pautas/{arquivo}", str(n))
    if not ok:
        if ocupados(erro, "produzir", (arquivo, str(n))):
            return
        return msg(f"⚠️ Roteiro falhou:\n<pre>{esc(erro[-800:])}</pre>", aba="producao")
    enviar_roteiro(Path(pasta))


def enviar_roteiro(pasta):
    """Manda o roteiro pronto para aprovação. Separado de produzir() para reenviar sem escrever tudo de novo:
    python -c "from pipeline.bot import enviar_roteiro, TRABALHO; enviar_roteiro(TRABALHO / '<pasta>')"."""
    info = ler(pasta / "modelos.json") if (pasta / "modelos.json").exists() else {"etapas": [], "avisos": []}
    modelos = " · ".join(f"{e['tarefa']}: {e['modelo']}" for e in info["etapas"]) or "?"
    avisos = "".join(f"\n⚠️ {esc(a)}" for a in info["avisos"][:8])
    if len(info["avisos"]) > 8:
        avisos += f"\n⚠️ e mais {len(info['avisos']) - 8} (lista completa em modelos.json)"
    r, problemas = ler(pasta / "roteiro.json"), ler(pasta / "revisao.json")
    chars = sum(len(f["texto"]) for f in r["falas"])
    palavras = sum(len(f["texto"].split()) for f in r["falas"])
    md = pasta / "roteiro.md"
    md.write_text(f"# {r['titulo']}\n\n" + "\n\n".join(
        (f"## {f['capitulo']}\n\n" if f.get("capitulo") else "") + f"**{f['quem'].upper()}:** {f['texto']}" for f in r["falas"]
    ) + "\n\n---\n\n## Ficha de fatos\n\n" + (pasta / "ficha.md").read_text(encoding="utf-8"), encoding="utf-8")
    enviar_arquivo("sendDocument", "document", md, "producao", caption=f"Roteiro: {r['titulo']}"[:1000])
    revisao = "\n".join(f"• <i>{esc(p['tipo'])}</i>: {esc(p['problema'][:150])}" for p in problemas[:8]) or "• nenhum"
    msg(f"📝 <b>{esc(r['titulo'])}</b>\n{palavras} palavras (~{palavras / 160:.0f} min) · status {r['status']}{avisos}\n"
        f"🤖 {esc(modelos)}\n\n"
        f"<b>A revisão automática corrigiu:</b>\n{revisao}\n\n"
        f"💳 Gerar o áudio custa cerca de <b>{int(chars * CREDITO_POR_CARACTERE):,}</b> créditos ({chars:,} caracteres).".replace(",", "."),
        [[{"text": "✅ Aprovar roteiro (gera o áudio)", "callback_data": f"audio|{chave(pasta.name)}"}],
         [{"text": "🗑️ Descartar", "callback_data": f"descartar|{chave(pasta.name)}"}]], aba="producao")


def gerar_audio(nome):
    pasta = TRABALHO / nome
    msg("🎧 Gerando o áudio na ElevenLabs… (gasta créditos; uns 2 minutos)", aba="producao")
    ok, saida, erro = etapa("pipeline.audio", str(pasta), "--gerar")
    if not ok:
        return msg(f"⚠️ Áudio falhou (os blocos já gerados ficam salvos):\n<pre>{esc(erro[-800:])}</pre>",
                   [[{"text": "🔁 Tentar de novo", "callback_data": f"audio|{chave(nome)}"}]], aba="producao")
    custo = json.loads(saida)
    ok, _, erro = etapa("pipeline.legenda", str(pasta))
    if not ok:
        return msg(f"⚠️ Legenda falhou:\n<pre>{esc(erro[-800:])}</pre>", aba="producao")
    qa, caps = ler(pasta / "qa.json"), ler(pasta / "capitulos.json")
    r = ler(pasta / "roteiro.json")
    enviar_arquivo("sendAudio", "audio", pasta / "episodio.m4a", "producao", title=r["titulo"][:60], performer="CyberJustiça")
    capitulos = "\n".join(f"{c['inicio']} {esc(c['titulo'])}" for c in caps)
    selo = "✅" if qa["aprovado"] else "❌"
    fora = qa.get("fora_do_tom", [])
    aviso = "".join(f"\n⚠️ {int(f['inicio'] // 60)}:{int(f['inicio'] % 60):02d} {esc(f['locutor'])} fora do tom "
                    f"(voz {f['f0']:+.0%}, brilho {f['brilho']:+.0%}): {esc(f['texto'][:60])}" for f in fora)
    msg(f"{selo} <b>Controle de qualidade</b>\nduração {int(qa['duracao_s'] // 60)}:{int(qa['duracao_s'] % 60):02d} · "
        f"{qa['lufs']} LUFS · pico {qa['pico_dbtp']} dBTP · faststart {'ok' if qa['faststart'] else 'FALHOU'} · "
        f"alinhamento {qa['cobertura_alinhamento']:.0%}\n\n<b>Capítulos</b>\n{capitulos}\n\n"
        f"💳 {custo['custo']} créditos usados; saldo {custo['saldo']}.{aviso}",
        [[{"text": f"🔁 Refazer fala de {int(f['inicio'] // 60)}:{int(f['inicio'] % 60):02d} (~{custo_fala(r, f['fala'])} créditos)",
           "callback_data": f"refazer|{chave(nome)}|{f['fala']}"}] for f in fora]
        + ([[{"text": "🚀 Publicar no site", "callback_data": f"publicar|{chave(nome)}"}]] if qa["aprovado"] else [])
        + [[{"text": "🗑️ Descartar", "callback_data": f"descartar|{chave(nome)}"}]], aba="producao")


def custo_fala(roteiro, n):
    return int(len(roteiro["falas"][n]["texto"]) * CREDITO_FALA_AVULSA)


def refazer(nome, n):
    pasta = TRABALHO / nome
    msg(f"🔁 Refazendo só a fala {int(n) + 1}, sem tag e em tom neutro…", aba="producao")
    ok, _, erro = etapa("pipeline.audio", str(pasta), "--refazer-fala", str(n), "--gerar")
    if not ok:
        return msg(f"⚠️ Não consegui refazer a fala:\n<pre>{esc(erro[-800:])}</pre>", aba="producao")
    gerar_audio(nome)  # blocos todos reaproveitados (0 crédito): só refaz acabamento, legenda e QA


def publicar(nome):
    msg("🚀 Publicando…", aba="publicacao")
    ok, saida, erro = etapa("pipeline.episodio", str(TRABALHO / nome), str(REPO), "--publicar")
    if not ok:
        return msg(f"⚠️ Publicação falhou:\n<pre>{esc(erro[-800:])}</pre>", aba="publicacao")
    info = json.loads(saida)
    msg(f"📤 Episódio {info['numero']} enviado. Esperando o deploy do Coolify…", aba="publicacao")
    # User-Agent próprio: a Cloudflare do cyberjus.org responde 403 ao "Python-urllib" padrão. No episódio 3
    # (14/10/2026) a página estava no ar e o bot passou 15 minutos vendo 403 e avisou que o deploy tinha falhado.
    pedido = urllib.request.Request(info["url"], headers={"User-Agent": "CyberJust-pipeline/1.0 (+https://www.cyberjus.org)"})
    ultimo = "sem resposta"
    for _ in range(30):  # até 15 minutos
        time.sleep(30)
        try:
            if urllib.request.urlopen(pedido, timeout=20).status == 200:
                return msg(f"🎉 <b>No ar:</b> {info['url']}", aba="publicacao")
        except urllib.error.HTTPError as e:
            ultimo = f"HTTP {e.code}"  # 404 é o normal enquanto o deploy roda
        except Exception as e:
            ultimo = repr(e)[:120]
    log("publicação: página não respondeu 200 em 15 min; última resposta:", ultimo)
    msg(f"⚠️ O commit foi feito, mas {info['url']} ainda não responde (última resposta: {esc(ultimo)}). "
        "Confira o deploy no Coolify.", aba="publicacao")


def descartar(nome):
    (TRABALHO / nome / "descartado").touch()
    msg(f"🗑️ Descartado: {esc(nome)}", aba="producao")


ACOES = {"produzir": lambda a, n: produzir(a, int(n)),
         "audio": lambda c: gerar_audio(pasta_da_chave(c)),
         "refazer": lambda c, n: refazer(pasta_da_chave(c), n),
         "publicar": lambda c: publicar(pasta_da_chave(c)),
         "descartar": lambda c: descartar(pasta_da_chave(c))}


def executar(acao, args):
    if not ocupado.acquire(blocking=False):
        return msg(f"{andamento()} Tente de novo quando terminar.", aba=ABA_DA_ACAO.get(acao, "sistema"))
    atual.update(nome=acao, desde=time.time())
    try:
        ACOES[acao](*args)
    except Exception as e:  # o bot não pode morrer por causa de uma etapa
        log("erro:", repr(e))
        msg(f"⚠️ Erro inesperado em {acao}: <pre>{esc(repr(e))[:800]}</pre>", aba=ABA_DA_ACAO.get(acao, "sistema"))
    finally:
        atual.update(nome=None, desde=None)
        ocupado.release()


# ---------- laço principal ----------


def agenda():
    ultimo = None
    while True:
        agora = dt.datetime.now(BRT)
        if agora.weekday() in DIAS and agora.hour == HORA and ultimo != agora.date():
            ultimo = agora.date()
            threading.Thread(target=executar, args=("sugerir", ()), daemon=True).start()
        time.sleep(60)


ACOES["sugerir"] = sugerir_pautas


def main():
    tg("setMyCommands", commands=[{"command": "pautas", "description": "Buscar pautas agora"},
                                  {"command": "status", "description": "Créditos e etapa em andamento"}])
    threading.Thread(target=agenda, daemon=True).start()
    log("bot no ar")
    for aba in ABAS:  # cria as abas na ordem certa já na subida
        topico(aba)
    msg("🟢 <b>Pipeline do CyberJust no ar.</b>\nPautas seg, qua e sex às 9h. Comandos: /pautas e /status.")
    proximo = 0
    while True:
        try:
            updates = tg("getUpdates", offset=proximo, timeout=50, allowed_updates=["message", "callback_query"])
        except Exception as e:
            log("getUpdates:", e)
            time.sleep(10)
            continue
        for u in updates:
            proximo = u["update_id"] + 1
            try:
                tratar(u)
            except Exception as e:  # o update já foi confirmado (proximo); um erro aqui não pode derrubar o bot
                log("update", u["update_id"], "falhou:", repr(e))


def tratar(u):
    """Uma atualização do Telegram. Antes, um 400 do Telegram aqui (clique em botão antigo, clique duplo) saía do laço,
    derrubava o processo e, como o update ainda não tinha sido confirmado, voltava a cada reinício."""
    cb, m = u.get("callback_query"), u.get("message")
    origem = (cb or m or {}).get("from", {}).get("id")
    if origem != CHAT:  # só o dono comanda o pipeline
        return
    if cb:
        try:  # só tira o "carregando" do botão; clique antigo dá 400 "query is too old" e a ação vale mesmo assim
            tg("answerCallbackQuery", callback_query_id=cb["id"])
        except ErroTelegram as e:
            log("answerCallbackQuery:", e)
        acao, *args = cb["data"].split("|")
        if acao in ACOES:
            # Tira os botões da mensagem: evita clique duplo (gerar o áudio duas vezes gastaria créditos). No segundo
            # clique a mensagem já está sem botões, o Telegram responde 400 e a ação não roda de novo.
            tg("editMessageReplyMarkup", chat_id=CHAT, message_id=cb["message"]["message_id"], reply_markup={"inline_keyboard": []})
            threading.Thread(target=executar, args=(acao, args), daemon=True).start()
    elif m and m.get("text", "").startswith("/pautas"):
        threading.Thread(target=executar, args=("sugerir", ()), daemon=True).start()
    elif m and m.get("text", "").startswith("/status"):
        _, _, erro = etapa("pipeline.audio", "--saldo")
        texto = f"{andamento()}\n{esc(erro.strip().splitlines()[-1] if erro.strip() else '')}"
        t = m.get("message_thread_id")  # responde na aba em que o /status foi digitado
        tg("sendMessage", chat_id=CHAT, text=texto, parse_mode="HTML", **({"message_thread_id": t} if t else {}))


if __name__ == "__main__":
    main()
