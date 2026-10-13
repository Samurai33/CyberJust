// Conteúdo fixo do site (fora dos episódios). Tudo aqui aparece em HTML estático.

export const SITE = {
  nome: 'CyberJustiça Brasil',
  curto: 'CyberJustiça',
  descricao:
    'Podcast sobre crimes cibernéticos no Brasil: casos reais, investigação, especialistas e dicas práticas de proteção digital.',
  repo: 'https://github.com/Samurai33/CyberJust',
} as const;

export const MENU = [
  { href: '/episodios/', label: 'Episódios' },
  { href: '/#casos', label: 'Casos' },
  { href: '/#protecao', label: 'Proteção' },
  { href: '/#especialistas', label: 'Especialistas' },
  { href: '/#denuncie', label: 'Denuncie' },
] as const;

export const TIPOS_DE_CRIME = [
  { titulo: 'Fraudes financeiras', texto: 'Golpes bancários, Pix e estelionato digital.', ameaca: 'CRÍTICO' },
  { titulo: 'Roubo de dados', texto: 'Uso indevido de informações pessoais vazadas.', ameaca: 'ALTO' },
  { titulo: 'Crimes contra a dignidade', texto: 'Violação da intimidade e exposição sexual.', ameaca: 'ALTO' },
  { titulo: 'Aliciamento online', texto: 'Predadores digitais em redes sociais e jogos.', ameaca: 'CRÍTICO' },
  { titulo: 'Golpes em relacionamentos', texto: 'Fraudes em aplicativos de encontros.', ameaca: 'MÉDIO' },
] as const;

export const PROTECAO = [
  {
    titulo: 'Fortaleça suas senhas',
    texto: 'Use senhas únicas para cada serviço, de preferência com um gerenciador de senhas, e ative a verificação em duas etapas sempre que possível.',
    icone: 'lock',
  },
  {
    titulo: 'Proteja seus dados',
    texto: 'Só informe dados pessoais em sites e aplicativos oficiais. Evite redes Wi-Fi públicas para operações sensíveis.',
    icone: 'shield',
  },
  {
    titulo: 'Reconheça o golpe',
    texto: 'Desconfie de urgência, de ofertas boas demais e de links recebidos por mensagem. Confirme por outro canal antes de agir.',
    icone: 'alert',
  },
  {
    titulo: 'Denuncie',
    texto: 'Registre ocorrência na delegacia (muitos estados têm delegacia virtual) e use os canais oficiais abaixo.',
    icone: 'flag',
  },
] as const;

// Especialista e apresentador do podcast. Mesma foto e bio da página "Sobre" do n3xus.dev.
export const APRESENTADOR = {
  nome: 'Thiago Rangel',
  apelido: 'Samurai',
  cargo: 'Especialista em cibersegurança · fundador da N3XUS',
  texto:
    'Engenheiro de IA, cibersegurança e full-stack. Constrói sistemas seguros para aviação, testes de intrusão e infraestrutura crítica, e traz para o podcast o olhar técnico de quem defende sistemas reais.',
  links: [
    { href: 'https://n3xus.dev/sobre/', label: 'n3xus.dev' },
    { href: 'https://github.com/Samurai33', label: 'GitHub @Samurai33' },
  ],
} as const;

// Convidados dos episódios.
export const ESPECIALISTAS = [
  {
    nome: 'Diego Barbiero',
    cargo: 'Coordenador do CyberGAECO',
    texto: 'Experiência em investigações de crimes digitais organizados e casos emblemáticos que ajudou a solucionar.',
  },
  {
    nome: 'Thiago Cardoso Silva',
    cargo: 'Delegado do GAECO',
    texto: 'Os desafios das investigações digitais e as novas técnicas usadas pelos criminosos.',
  },
  {
    nome: 'Wilson Leite da Silva Filho',
    cargo: 'Chefe da Divisão de Informática Forense',
    texto: 'Como funciona a coleta de provas digitais e como a perícia evolui para combater o crime.',
  },
] as const;

// Canais oficiais (links conferidos). O site não recebe denúncias.
export const CANAIS = [
  {
    titulo: 'SaferNet Brasil',
    texto: 'Denúncia anônima de crimes contra direitos humanos na internet, como abuso sexual infantil e discurso de ódio.',
    url: 'https://new.safernet.org.br/denuncie',
  },
  {
    titulo: 'Polícia Federal',
    texto: 'Comunicação de crimes de competência federal, incluindo crimes cibernéticos.',
    url: 'https://www.gov.br/pf/pt-br/canais_atendimento/comunicacao-de-crimes',
  },
  {
    titulo: 'Fraude bancária ou Pix',
    texto: 'Ligue imediatamente para o seu banco pelo número oficial do cartão ou do aplicativo e peça o bloqueio.',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/prevencaofraudes',
  },
] as const;
