# syntax=docker/dockerfile:1
# Ambiente do pipeline de episódios (roda na VM de build, nunca em produção). Base fixada por digest,
# como no Dockerfile do site, e dependências em versões exatas: as mesmas testadas no piloto de 13/10/2026.
FROM python:3.12-slim@sha256:a6e34c598f2467ed0e9a8d349809fcd8b5c603269512df273a0bb1784edc11b1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg git openssh-client \
  && rm -rf /var/lib/apt/lists/*
# selectolax < 1: o googlenewsdecoder 0.2.1 ainda usa o backend Modest, removido no selectolax 1.0.
RUN pip install --no-cache-dir \
  google-genai==1.75.0 \
  trafilatura==2.3.1 \
  googlenewsdecoder==0.2.1 \
  selectolax==0.4.13 \
  faster-whisper==1.2.1 \
  ctranslate2==4.8.3 \
  numpy==2.5.4 \
  pyjwt==2.15.1 \
  cryptography==50.0.2
COPY pipeline /app/pipeline
# Estúdio (painel web): estáticos servidos pelo pipeline/painel.py, sem build.
COPY painel /app/painel
ENV PYTHONPATH=/app HF_HOME=/dados/cache/hf HF_HUB_DISABLE_PROGRESS_BARS=1 PYTHONUNBUFFERED=1
# O OpenSSH (git push) exige um usuário de verdade para o UID: "No user exists for uid 1000" sem isso.
RUN useradd --uid 1000 --create-home pipeline
USER pipeline
WORKDIR /dados
