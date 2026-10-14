"""Bot do Telegram que conduz o pipeline com três aprovações: pauta, roteiro (antes de gastar créditos) e áudio.

Uso: python -m pipeline.bot      (contêiner sempre ligado; ver podcast/compose.yml)
Ambiente: TELEGRAM_TOKEN (bot só do podcast), TELEGRAM_CHAT (o único chat que o bot obedece), PAUTAS_DIAS (dias da
semana das sugestões, 0 = segunda; padrão "0,2,4"), PAUTAS_HORA (padrão 9, horário de Brasília) e as variáveis das
outras etapas. Long polling: não abre porta nem depende do túnel.
"""
import datetime as dt
import json
import os
import subprocess
import threading
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from .comum import DADOS, TRABALHO, ler, log

TOKEN = os.environ["TELEGRAM_TOKEN"]
CHAT = int(os.environ["TELEGRAM_CHAT"])
DIAS = {int(d) for d in os.environ.get("PAUTAS_DIAS", "0,2,4").split(",")}
HORA = int(os.environ.get("PAUTAS_HORA", "9"))
REPO = Path(os.environ.get("REPO", "/dados/repo"))
BRT = dt.timezone(dt.timedelta(hours=-3))
CREDITO_POR_CARACTERE = 0.44  # medido no piloto (eleven_v3, Text to Dialogue): 3.282 créditos para 7.460 caracteres
ocupado = threading.Lock()  # uma etapa pesada por vez


def tg(metodo, **campos):
    dados = urllib.parse.urlencode({k: json.dumps(v) if isinstance(v, (dict, list)) else v for k, v in campos.items()}).encode()
    r = urllib.request.urlopen(f"https://api.telegram.org/bot{TOKEN}/{metodo}", data=dados, timeout=70)
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
    return json.loads(urllib.request.urlopen(req, timeout=300).read())["result"]


def msg(texto, botoes=None):
    extra = {"reply_markup": {"inline_keyboard": botoes}} if botoes else {}
    return tg("sendMessage", chat_id=CHAT, text=texto, parse_mode="HTML", link_preview_options={"is_disabled": True}, **extra)


def etapa(*args, env=None):
    """Roda uma etapa do pipeline num processo separado e devolve (ok, última linha de stdout, fim do log)."""
    r = subprocess.run(["python", "-m", *args], capture_output=True, text=True, env={**os.environ, **(env or {})}, cwd=DADOS)
    saida = r.stdout.strip().splitlines()
    return r.returncode == 0, (saida[-1] if saida else ""), r.stderr[-1500:]


def esc(t):
    return str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------- etapas acionadas pelos botões ----------


def sugerir_pautas():
    ok, arquivo, erro = etapa("pipeline.pautas")
    if not ok:
        return msg(f"⚠️ Falha ao buscar pautas:\n<pre>{esc(erro[-800:])}</pre>")
    pautas = ler(arquivo)
    linhas, botoes = ["🗞️ <b>Pautas da semana</b> (casos reais, últimos 14 dias)\n"], []
    for i, p in enumerate(pautas[:3], 1):
        fontes = sum(len(n["fontes"]) for n in p["noticias"])
        linhas.append(f"<b>{i}. {esc(p['titulo'])}</b>\nNota {p['nota']}/10 · {p['tema']} · {fontes} fontes\n<i>{esc(p['por_que'])}</i>\n")
        botoes.append([{"text": f"🎙️ Produzir {i}", "callback_data": f"produzir|{Path(arquivo).name}|{i}"}])
    msg("\n".join(linhas), botoes)


def produzir(arquivo, n):
    msg(f"✍️ Apurando as fontes e escrevendo o roteiro da pauta {n}… (grátis, alguns minutos)")
    ok, pasta, erro = etapa("pipeline.roteiro", f"pautas/{arquivo}", str(n))
    if not ok:
        return msg(f"⚠️ Roteiro falhou:\n<pre>{esc(erro[-800:])}</pre>")
    pasta = Path(pasta)
    r, problemas = ler(pasta / "roteiro.json"), ler(pasta / "revisao.json")
    chars = sum(len(f["texto"]) for f in r["falas"])
    palavras = sum(len(f["texto"].split()) for f in r["falas"])
    md = pasta / "roteiro.md"
    md.write_text(f"# {r['titulo']}\n\n" + "\n\n".join(
        (f"## {f['capitulo']}\n\n" if f.get("capitulo") else "") + f"**{f['quem'].upper()}:** {f['texto']}" for f in r["falas"]
    ) + "\n\n---\n\n## Ficha de fatos\n\n" + (pasta / "ficha.md").read_text(encoding="utf-8"), encoding="utf-8")
    tg_arquivo("sendDocument", "document", md, chat_id=CHAT, caption=f"Roteiro: {r['titulo']}"[:1000])
    revisao = "\n".join(f"• <i>{esc(p['tipo'])}</i>: {esc(p['problema'][:150])}" for p in problemas[:8]) or "• nenhum"
    msg(f"📝 <b>{esc(r['titulo'])}</b>\n{palavras} palavras (~{palavras / 160:.0f} min) · status {r['status']}\n\n"
        f"<b>A revisão automática corrigiu:</b>\n{revisao}\n\n"
        f"💳 Gerar o áudio custa cerca de <b>{int(chars * CREDITO_POR_CARACTERE):,}</b> créditos ({chars:,} caracteres).".replace(",", "."),
        [[{"text": "✅ Aprovar roteiro (gera o áudio)", "callback_data": f"audio|{pasta.name}"}],
         [{"text": "🗑️ Descartar", "callback_data": f"descartar|{pasta.name}"}]])


def gerar_audio(nome):
    pasta = TRABALHO / nome
    msg("🎧 Gerando o áudio na ElevenLabs… (gasta créditos; uns 2 minutos)")
    ok, saida, erro = etapa("pipeline.audio", str(pasta), "--gerar")
    if not ok:
        return msg(f"⚠️ Áudio falhou (os blocos já gerados ficam salvos):\n<pre>{esc(erro[-800:])}</pre>",
                   [[{"text": "🔁 Tentar de novo", "callback_data": f"audio|{nome}"}]])
    custo = json.loads(saida)
    ok, _, erro = etapa("pipeline.legenda", str(pasta))
    if not ok:
        return msg(f"⚠️ Legenda falhou:\n<pre>{esc(erro[-800:])}</pre>")
    qa, caps = ler(pasta / "qa.json"), ler(pasta / "capitulos.json")
    r = ler(pasta / "roteiro.json")
    tg_arquivo("sendAudio", "audio", pasta / "episodio.m4a", chat_id=CHAT, title=r["titulo"][:60], performer="CyberJustiça")
    capitulos = "\n".join(f"{c['inicio']} {esc(c['titulo'])}" for c in caps)
    selo = "✅" if qa["aprovado"] else "❌"
    fora = qa.get("fora_do_tom", [])
    aviso = "".join(f"\n⚠️ {int(f['inicio'] // 60)}:{int(f['inicio'] % 60):02d} {esc(f['locutor'])} fora do tom "
                    f"(voz {f['f0']:+.0%}, brilho {f['brilho']:+.0%}): {esc(f['texto'][:60])}" for f in fora)
    msg(f"{selo} <b>Controle de qualidade</b>\nduração {int(qa['duracao_s'] // 60)}:{int(qa['duracao_s'] % 60):02d} · "
        f"{qa['lufs']} LUFS · pico {qa['pico_dbtp']} dBTP · faststart {'ok' if qa['faststart'] else 'FALHOU'} · "
        f"alinhamento {qa['cobertura_alinhamento']:.0%}\n\n<b>Capítulos</b>\n{capitulos}\n\n"
        f"💳 {custo['custo']} créditos usados; saldo {custo['saldo']}.{aviso}",
        [[{"text": f"🔁 Refazer fala de {int(f['inicio'] // 60)}:{int(f['inicio'] % 60):02d} (~20 créditos)",
           "callback_data": f"refazer|{nome}|{f['fala']}"}] for f in fora]
        + ([[{"text": "🚀 Publicar no site", "callback_data": f"publicar|{nome}"}]] if qa["aprovado"] else [])
        + [[{"text": "🗑️ Descartar", "callback_data": f"descartar|{nome}"}]])


def refazer(nome, n):
    pasta = TRABALHO / nome
    msg(f"🔁 Refazendo só a fala {int(n) + 1}, sem tag e em tom neutro…")
    ok, _, erro = etapa("pipeline.audio", str(pasta), "--refazer-fala", str(n), "--gerar")
    if not ok:
        return msg(f"⚠️ Não consegui refazer a fala:\n<pre>{esc(erro[-800:])}</pre>")
    gerar_audio(nome)  # blocos todos reaproveitados (0 crédito): só refaz acabamento, legenda e QA


def publicar(nome):
    msg("🚀 Publicando…")
    ok, saida, erro = etapa("pipeline.episodio", str(TRABALHO / nome), str(REPO), "--publicar")
    if not ok:
        return msg(f"⚠️ Publicação falhou:\n<pre>{esc(erro[-800:])}</pre>")
    info = json.loads(saida)
    msg(f"📤 Episódio {info['numero']} enviado. Esperando o deploy do Coolify…")
    for _ in range(30):  # até 15 minutos
        time.sleep(30)
        try:
            if urllib.request.urlopen(info["url"], timeout=20).status == 200:
                return msg(f"🎉 <b>No ar:</b> {info['url']}")
        except Exception:
            pass
    msg(f"⚠️ O commit foi feito, mas {info['url']} ainda não responde. Confira o deploy no Coolify.")


def descartar(nome):
    (TRABALHO / nome / "descartado").touch()
    msg(f"🗑️ Descartado: {esc(nome)}")


ACOES = {"produzir": lambda a, n: produzir(a, int(n)), "audio": gerar_audio, "refazer": refazer, "publicar": publicar,
         "descartar": descartar}


def executar(acao, args):
    if not ocupado.acquire(blocking=False):
        return msg("⏳ Ainda estou numa etapa anterior; tente de novo quando ela terminar.")
    try:
        ACOES[acao](*args)
    except Exception as e:  # o bot não pode morrer por causa de uma etapa
        log("erro:", repr(e))
        msg(f"⚠️ Erro inesperado em {acao}: <pre>{esc(repr(e))[:800]}</pre>")
    finally:
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
            cb, m = u.get("callback_query"), u.get("message")
            origem = (cb or m or {}).get("from", {}).get("id")
            if origem != CHAT:  # só o dono comanda o pipeline
                continue
            if cb:
                tg("answerCallbackQuery", callback_query_id=cb["id"])
                acao, *args = cb["data"].split("|")
                if acao in ACOES:
                    # Tira os botões da mensagem: evita clique duplo (gerar o áudio duas vezes gastaria créditos).
                    tg("editMessageReplyMarkup", chat_id=CHAT, message_id=cb["message"]["message_id"], reply_markup={"inline_keyboard": []})
                    threading.Thread(target=executar, args=(acao, args), daemon=True).start()
            elif m and m.get("text", "").startswith("/pautas"):
                threading.Thread(target=executar, args=("sugerir", ()), daemon=True).start()
            elif m and m.get("text", "").startswith("/status"):
                ok, _, erro = etapa("pipeline.audio", "--saldo")
                msg(("⏳ Etapa em andamento." if ocupado.locked() else "💤 Livre.") + f"\n{esc(erro.strip().splitlines()[-1] if erro.strip() else '')}")


if __name__ == "__main__":
    main()
