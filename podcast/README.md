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
| Roteiro | `pipeline.roteiro` | baixa as matérias (decodifica os links do Google Notícias), monta a ficha de fatos, escreve o diálogo com o protocolo de retenção, ajusta o tamanho e revisa contra a ficha | grátis |
| Áudio | `pipeline.audio` | Text to Dialogue da ElevenLabs em blocos de até 1.900 caracteres; cada bloco é salvo assim que chega e reaproveitado; normalização em duas passadas (-16 LUFS, pico < -1 dBTP) e AAC com faststart | ~0,44 crédito por caractere (eleven_v3) |
| Legenda | `pipeline.legenda` | Whisper local alinha o áudio ao texto do roteiro: WebVTT com `<v Locutor>`, tempos dos capítulos e controle de qualidade | grátis |
| Episódio | `pipeline.episodio` | Markdown no esquema de `src/content.config.ts`, áudio e VTT com hash no nome, recursos com link conferido (HTTP 200), commit e push | grátis |
| Bot | `pipeline.bot` | Telegram: sugere pautas (seg, qua e sex às 9h) e conduz as aprovações; só obedece ao chat do dono | grátis |

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
