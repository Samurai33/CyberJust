// Temas dos episódios: a chave é a URL (/temas/<chave>/) e o valor do campo "tema" no episódio.
export const TEMAS = {
  fraudes: {
    nome: 'Fraudes digitais',
    curto: 'Fraudes',
    descricao:
      'Golpes por Pix, falsas centrais, phishing, engenharia social e estelionato digital: como funcionam e como se proteger.',
  },
  'dados-pessoais': {
    nome: 'Dados pessoais e privacidade',
    curto: 'Dados pessoais',
    descricao: 'Vazamentos, uso indevido de dados e exposição em aplicativos e redes sociais.',
  },
  corrupcao: {
    nome: 'Corrupção digital',
    curto: 'Corrupção',
    descricao: 'Esquemas de corrupção e lavagem de dinheiro que migraram para aplicativos, criptomoedas e redes.',
  },
  'protecao-infantil': {
    nome: 'Proteção de crianças e adolescentes',
    curto: 'Proteção infantil',
    descricao: 'Aliciamento, cyberbullying e exposição de menores na internet, e o que famílias e escolas podem fazer.',
  },
} as const;

export type Tema = keyof typeof TEMAS;
