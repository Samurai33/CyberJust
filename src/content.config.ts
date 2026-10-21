import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TEMAS } from './data/temas';

export const STATUS = ['ATIVO', 'ARQUIVADO', 'RESOLVIDO'] as const;
export const AMEACA = ['CRÍTICO', 'ALTO', 'MÉDIO', 'BAIXO'] as const;

const dataIso = z.string().regex(/^\d{4}(-\d{2}-\d{2})?$/, 'use AAAA-MM-DD (ou só AAAA quando o dia não é conhecido)');
const tempo = z.string().regex(/^(\d{1,2}:)?\d{1,2}:\d{2}$/, 'use mm:ss ou h:mm:ss');

// Um arquivo Markdown por episódio em src/content/episodios/ (também editável pelo painel /dash).
// O nome do arquivo vira a URL (/episodios/<nome>/). O corpo do Markdown é a descrição completa.
const episodios = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/episodios' }),
  schema: z.object({
    numero: z.number().int().positive().optional(),
    titulo: z.string().min(10).max(90),
    // Título para a aba e as prévias, quando o título passa de 60 caracteres com a marca.
    tituloSeo: z.string().min(20).max(60).optional(),
    resumo: z.string().min(50).max(155),
    // Data de publicação do episódio. Sem data = "Em produção".
    data: dataIso.optional(),
    atualizado: dataIso.optional(),
    // Quando o caso aconteceu (ex.: "2013–2015"). Diferente da data do episódio.
    periodo: z.string().max(40).optional(),
    tema: z.enum(Object.keys(TEMAS) as [keyof typeof TEMAS, ...(keyof typeof TEMAS)[]]),
    // Situação do caso. Omitir quando não se aplica (ex.: episódio temático).
    status: z.enum(STATUS).optional(),
    ameaca: z.enum(AMEACA),
    tags: z.array(z.string()).default([]),
    // Arquivo no R2, servido em /audio/ pelo Worker worker/audio. AAC em MP4 com o índice (moov) no início, nome
    // terminado nos 8 primeiros hex do SHA-256; duração e tamanho vêm de src/data/audio.json.
    audio: z
      .string()
      .regex(/^\/audio\/[a-z0-9-]+-[0-9a-f]{8}\.m4a$/, 'áudio em /audio/<nome-em-minusculas>-<hash>.m4a')
      .optional(),
    // Transcrição em WebVTT em public/transcricoes/ (mostrada na página e publicada no feed).
    transcricao: z
      .string()
      .regex(/^\/transcricoes\/[a-z0-9-]+\.vtt$/)
      .optional(),
    capitulos: z.array(z.object({ inicio: tempo, titulo: z.string().min(2).max(80) })).default([]),
    pontos: z.array(z.string()).default([]),
    alertas: z.array(z.string()).default([]),
    recursos: z
      .array(
        z.object({
          titulo: z.string(),
          url: z.url({ protocol: /^https$/ }),
          fonte: z.string(),
          tipo: z.enum(['lei', 'guia', 'canal', 'notícia', 'pesquisa']),
        }),
      )
      .default([]),
  }),
});

export const collections = { episodios };
