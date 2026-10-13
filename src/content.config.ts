import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const STATUS = ['ATIVO', 'ARQUIVADO', 'RESOLVIDO', 'AGENDADO'] as const;
export const AMEACA = ['CRÍTICO', 'ALTO', 'MÉDIO', 'BAIXO'] as const;

// Um arquivo Markdown por episódio em src/content/episodios/. O nome do arquivo vira a URL
// (/episodios/<nome>/). O corpo do Markdown é a descrição completa.
const episodios = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/episodios' }),
  schema: z.object({
    numero: z.number().int().positive().optional(),
    titulo: z.string().min(10).max(90),
    resumo: z.string().min(40).max(260),
    // Data de publicação. Só o ano quando o dia exato não é conhecido.
    data: z.string().regex(/^\d{4}(-\d{2}-\d{2})?$/),
    status: z.enum(STATUS),
    ameaca: z.enum(AMEACA),
    categoria: z.string(),
    tags: z.array(z.string()).default([]),
    audio: z
      .object({
        // Arquivo em public/audio/ (AAC em MP4 com moov no início; ver README).
        arquivo: z.string().regex(/^\/audio\/[a-z0-9-]+\.m4a$/),
        // Duração real em segundos (ffprobe), usada no player antes de carregar o áudio e no JSON-LD.
        segundos: z.number().positive(),
        bytes: z.number().int().positive(),
      })
      .optional(),
    pontos: z.array(z.string()).default([]),
    alertas: z.array(z.string()).default([]),
    recursos: z
      .array(
        z.object({
          titulo: z.string(),
          url: z.url({ protocol: /^https$/ }),
          fonte: z.string(),
          tipo: z.enum(['lei', 'guia', 'canal']),
        }),
      )
      .default([]),
  }),
});

export const collections = { episodios };
