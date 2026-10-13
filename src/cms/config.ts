// Painel de episódios (Sveltia CMS, compatível com Decap). Doc: https://sveltiacms.app/en/docs
// Cada "Salvar" vira um commit na main do GitHub; o webhook do Coolify publica o site em seguida.
// O build valida tudo (esquema em src/content.config.ts e o áudio em src/lib/mp4.ts): se algo estiver
// errado, o deploy falha e o site no ar continua o anterior.
import type { CmsConfig } from '@sveltia/cms';
import { TEMAS } from '../data/temas';

const opcoes = (lista: readonly string[]) => lista.map((v) => ({ label: v.charAt(0) + v.slice(1).toLowerCase(), value: v }));

export const cmsConfig: CmsConfig = {
  load_config_file: false,
  backend: {
    name: 'github',
    repo: 'Samurai33/CyberJust',
    branch: 'main',
    commit_messages: {
      create: 'content: cria episódio "{{slug}}" (painel)',
      update: 'content: atualiza episódio "{{slug}}" (painel)',
      delete: 'content: remove episódio "{{slug}}" (painel)',
      uploadMedia: 'content: envia arquivo "{{path}}" (painel)',
      deleteMedia: 'content: remove arquivo "{{path}}" (painel)',
    },
  },
  site_url: 'https://www.cyberjus.org',
  display_url: 'https://www.cyberjus.org',
  logo: { src: '/icon-192.png' },
  media_folder: '/public/audio',
  public_folder: '/audio',
  slug: { encoding: 'ascii', clean_accents: true, sanitize_replacement: '-' },
  collections: [
    {
      name: 'episodios',
      label: 'Episódios',
      label_singular: 'Episódio',
      description:
        'Cada episódio é um arquivo em src/content/episodios/. O nome (slug) vira a URL e não deve mudar depois de publicado. Só afirme o que tem fonte.',
      folder: 'src/content/episodios',
      extension: 'md',
      format: 'frontmatter',
      create: true,
      delete: true,
      slug: '{{slug}}',
      identifier_field: 'titulo',
      summary: '{{titulo}} · {{data}}',
      sortable_fields: ['data', 'titulo', 'numero'],
      view_groups: [{ label: 'Tema', field: 'tema' }],
      preview_path: 'episodios/{{slug}}/',
      fields: [
        { name: 'titulo', label: 'Título', widget: 'string', hint: '10 a 90 caracteres.' },
        { name: 'tituloSeo', label: 'Título na aba e nas prévias (opcional)', widget: 'string', required: false, hint: 'Use quando o título passar de ~45 caracteres. 20 a 60.' },
        { name: 'resumo', label: 'Resumo', widget: 'text', hint: '50 a 155 caracteres. Aparece na lista, no Google e na prévia do link.' },
        { name: 'numero', label: 'Número do episódio', widget: 'number', value_type: 'int', required: false, hint: 'Vazio = especial.' },
        { name: 'data', label: 'Data de publicação', widget: 'string', required: false, pattern: ['^\\d{4}(-\\d{2}-\\d{2})?$', 'AAAA-MM-DD (ou só AAAA)'], hint: 'Vazio = "Em produção".' },
        { name: 'atualizado', label: 'Revisado em', widget: 'string', required: false, pattern: ['^\\d{4}-\\d{2}-\\d{2}$', 'AAAA-MM-DD'] },
        { name: 'periodo', label: 'Quando o caso aconteceu', widget: 'string', required: false, hint: 'Ex.: 2013–2015.' },
        { name: 'tema', label: 'Tema', widget: 'select', options: Object.entries(TEMAS).map(([value, t]) => ({ label: t.nome, value })) },
        { name: 'status', label: 'Situação do caso', widget: 'select', required: false, options: opcoes(['ATIVO', 'ARQUIVADO', 'RESOLVIDO']) },
        { name: 'ameaca', label: 'Nível de ameaça', widget: 'select', options: opcoes(['CRÍTICO', 'ALTO', 'MÉDIO', 'BAIXO']) },
        { name: 'tags', label: 'Assuntos', widget: 'list', required: false, hint: 'Separe por vírgula.' },
        {
          name: 'audio',
          label: 'Áudio (.m4a)',
          widget: 'file',
          required: false,
          media_folder: '/public/audio',
          public_folder: '/audio',
          accept: 'audio/mp4,audio/x-m4a,.m4a',
          hint: 'AAC em M4A com faststart: ffmpeg -i entrada -map 0:a -c copy -movflags +faststart saida.m4a. Nome em minúsculas e com hífens; nunca substitua um arquivo publicado (use um nome novo).',
        },
        {
          name: 'transcricao',
          label: 'Transcrição (.vtt)',
          widget: 'file',
          required: false,
          media_folder: '/public/transcricoes',
          public_folder: '/transcricoes',
          accept: 'text/vtt,.vtt',
          hint: 'WebVTT com <v Nome> para cada locutor.',
        },
        {
          name: 'capitulos',
          label: 'Capítulos',
          widget: 'list',
          required: false,
          summary: '{{inicio}} · {{titulo}}',
          fields: [
            { name: 'inicio', label: 'Início (mm:ss)', widget: 'string', pattern: ['^(\\d{1,2}:)?\\d{1,2}:\\d{2}$', 'mm:ss ou h:mm:ss'] },
            { name: 'titulo', label: 'Título', widget: 'string' },
          ],
        },
        { name: 'pontos', label: 'Pontos principais', widget: 'list', required: false },
        { name: 'alertas', label: 'Como se proteger', widget: 'list', required: false },
        {
          name: 'recursos',
          label: 'Fontes (leis, guias, notícias)',
          widget: 'list',
          required: false,
          summary: '{{titulo}} · {{fonte}}',
          fields: [
            { name: 'titulo', label: 'Título', widget: 'string' },
            { name: 'url', label: 'Link (https)', widget: 'string', pattern: ['^https://', 'precisa começar com https://'] },
            { name: 'fonte', label: 'Fonte', widget: 'string', hint: 'Ex.: Planalto, Banco Central, SaferNet.' },
            { name: 'tipo', label: 'Tipo', widget: 'select', options: ['lei', 'guia', 'canal', 'notícia', 'pesquisa'] },
          ],
        },
        { name: 'body', label: 'Descrição completa', widget: 'markdown', hint: 'Dois ou três parágrafos sobre o caso.' },
      ],
    },
  ],
};
