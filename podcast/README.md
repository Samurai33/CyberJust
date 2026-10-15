# Pipeline de episódios

Gera episódios do CyberJustiça a partir de casos reais recentes, com três aprovações humanas no Telegram. Roda na VM
de build (`samurai@192.168.52.2`, pasta `/home/samurai/cyberjust-podcast`), nunca em produção.

```
pautas ──► roteiro ──► [aprovação] ──► áudio ──► legenda + QA ──► [aprovação] ──► episódio (commit na main)
 grátis     grátis      sem custo     créditos     grátis                          webhook do Coolify publica
```

| Etapa | Módulo | O que faz | Custo |
|---|---|---|---|
| Pautas | `pipeline.pautas` | 29 buscas no RSS do Google Notícias (14 dias), tira política, eleições e esporte, e o Gemini ranqueia as melhores | grátis |
| Roteiro | `pipeline.roteiro` | baixa as matérias (decodifica os links do Google Notícias), monta a ficha de fatos, escreve o diálogo com o protocolo de retenção, ajusta o tamanho, marca os capítulos se o modelo esqueceu, confere as regras no código e revisa contra a ficha com correções pontuais | grátis |
| Áudio | `pipeline.audio` | Text to Dialogue da ElevenLabs em blocos de até 1.900 caracteres; cada bloco é salvo assim que chega e reaproveitado; normalização em duas passadas (-16 LUFS, pico < -1 dBTP) e AAC com faststart | ~0,44 crédito por caractere (eleven_v3) |
| Legenda | `pipeline.legenda` | Whisper local alinha o áudio ao texto do roteiro: WebVTT com `<v Locutor>`, tempos dos capítulos e controle de qualidade | grátis |
| Episódio | `pipeline.episodio` | Markdown no esquema de `src/content.config.ts`, áudio e VTT com hash no nome, recursos com link conferido (HTTP 200), commit e push | grátis |
| Bot | `pipeline.bot` | Telegram: sugere pautas (seg, qua e sex às 9h) e conduz as aprovações; só obedece ao chat do dono | grátis |
| Estúdio | `pipeline.painel` | Painel web com tudo o que o bot faz e mais (ver abaixo); roda dentro do processo do bot | grátis |

## Regras editoriais (no prompt e na revisão)

- Só fatos das matérias baixadas. O plano gratuito do Gemini não tem busca no Google, e isso é bom: o roteiro fica
  preso às fontes. Nada de distância, idade, "exatamente" ou citação que a ficha não traz.
- Sem política partidária. Suspeito não condenado não é citado pelo nome. Caso com criança: nada gráfico e nada que
  identifique a vítima. Nunca rir do prejuízo de vítima.
- Protocolo de retenção: cold open, promessa com loop aberto, a dica de segurança no primeiro terço, quebra de padrão
  a cada 60 a 90 s, microganchos entre capítulos, clímax com o caso real, checklist e callback no fim.
- O tamanho (1.250 a 1.550 palavras) é conferido pelo código, não pelo modelo.

## Operação

```bash
cd /home/samurai/cyberjust-podcast
docker compose -f app/compose.yml --project-directory . up -d --build   # sobe ou atualiza o bot
docker compose -f app/compose.yml --project-directory . logs -f bot

# Etapas à mão (mesma imagem), por exemplo um ensaio de custo sem gastar créditos:
docker compose -f app/compose.yml --project-directory . run --rm bot python -m pipeline.audio trabalho/<slug>
```

Arquivos fora do repositório, na pasta da VM: `gemini.env`, `elevenlabs.env`, `telegram.env` (`TELEGRAM_TOKEN`,
`TELEGRAM_CHAT`), `vozes.env` (`VOZ_SAMURAI`, `VOZ_COAPRESENTADORA` e `NOME_COAPRESENTADORA`, padrão Sara), `deploy_key` e
`known_hosts` (push na `main`), `repo/` (clone do site) e `trabalho/<slug>/` (artefatos de cada episódio). As chaves
são gravadas pelos scripts `n3x-*-token.sh` do Dell, que nunca mostram o valor.

## Lições do piloto (13/10/2026)

- `eleven_v3` recusa `previous_request_ids` (400). A doc oficial recomenda o `eleven_v4` para diálogo longo e clones;
  testar antes de trocar o `MODELO_TTS`.
- O encoder AAC cria picos entre amostras depois do limitador: o alvo é -2 dBTP para ficar abaixo de -1 no arquivo.
- O `googlenewsdecoder` 0.2.1 precisa do `selectolax` < 1 e responde `success` (não `status`).
- `gemini-2.5-flash` não existe mais para chaves novas; o plano gratuito devolve 503 em picos (há novas tentativas e
  troca de modelo).
- 14/10/2026: o revisor não devolve mais o roteiro inteiro, só a fala corrigida (o código troca e recusa reescrita,
  texto igual e fala inexistente). O código confere antes (apresentação, capítulos, tags, algarismos, caixa alta,
  título de capítulo lido em voz alta, Sara dizendo o próprio nome) e o que sobrar vai como aviso no Telegram.
- Sigla lida como palavra vai como palavra ("Deic", "Procon"); só a lida letra por letra é soletrada ("cê-pê-éfe").
- Botões do Telegram levam um código de 10 caracteres da pasta: `callback_data` tem limite de 64 bytes.
- Abas no chat do bot (Threaded Mode, ligado só pelo mini app do @BotFather › Bot Settings › Threads Settings):
  🗞️ Pautas, 🎙️ Produção (roteiro, áudio, QA), 🚀 Publicação e ⚙️ Sistema. Ids em `topicos.json` na pasta da VM;
  aba apagada no app é recriada. Sem Threaded Mode, tudo vai para o chat normal. `/status` responde na aba onde foi digitado.
- A publicação reseta o clone para a `origin/main` antes de montar (um ensaio deixava o número do episódio pulado) e
  refaz uma vez se o push for recusado.

## Estúdio (painel web)

`https://www.cyberjus.org/dash-ac0584219dc1/estudio/` (o CMS continua em `/dash-ac0584219dc1/`). Faz tudo o que o
Telegram faz e mais:

- **Visão geral**: créditos da ElevenLabs, o que espera você, etapa rodando, próximas pautas, atividade recente.
- **Pautas**: todos os lotes (não só as 3 primeiras), notícias e fontes, produzir qualquer pauta, buscar agora.
- **Episódios**: quadro por estado (roteiro para aprovar, áudio para publicar, publicado, outra versão no ar,
  descartado, cópias). No episódio: player com capítulos e a fala que está tocando destacada, QA, roteiro com
  tempos, editar uma fala (grátis antes do áudio; depois, "salvar e refazer" só aquela fala), refazer qualquer fala,
  aprovar o áudio com o custo estimado, publicar, descartar e restaurar; página, ficha de fatos, fontes, revisão.
- **Site e feed**: episódios no ar, contador de pessoas e um verificador do feed (tags obrigatórias da Apple,
  `itunes:owner`, `podcast:guid`/`locked`, Range 206 e `length` de cada áudio, transcrição e capítulos).
- **Atividade**: cada mensagem do bot ao Telegram e cada ação feita no painel (`painel/eventos.jsonl`).

Segurança no padrão do SOC N3XUS: caminho escondido coberto pelo app do Cloudflare Access "CyberJustiça Painel
(/dash)" (política "Somente o dono") e, no painel, o JWT do Access conferido de novo (assinatura RS256 pelas chaves do
time, `iss`, `aud`, `exp`) mais a lista de e-mails, porque a rede da VM chega ao Traefik sem passar pela Cloudflare.
POST só com o cabeçalho `X-Estudio` e a origem do site (CSRF). CSP sem `'unsafe-inline'`, sem nada de terceiros.
Ações que gastam créditos ou publicam pedem dois toques (o primeiro mostra o custo). O painel usa a mesma trava das
etapas do bot: painel e Telegram nunca rodam duas etapas ao mesmo tempo.

Roteamento: labels do Traefik no `compose.yml` (rede `coolify`, prioridade acima do app do site), sem porta no host e
sem mexer no túnel. Configuração em `painel.env` na pasta da VM (600): `ACCESS_AUD` (AUD do app do Access) e
`PAINEL_EMAILS`. Sem eles o painel não sobe (e o bot segue normal).

Regras de estado: "publicado" = `publicado.json` (gravado pelo bot ao publicar) ou o sha256 do áudio igual ao do
arquivo no site; mesmo título com áudio diferente = "outra versão no ar", que o painel não publica (sairia um
episódio duplicado; troque o áudio por PR). Fala editada depois do áudio sem refazer bloqueia remontar e publicar.
