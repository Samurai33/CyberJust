export interface Episode {
  id: number | string
  title: string
  date: string
  description: string
  status: string
  threat: string
  audioUrl?: string | null
  duration?: string
  category?: string
  tags?: string[]
  transcript?: TranscriptSegment[]
  experts?: Expert[]
  relatedCases?: string[]
  resources?: Resource[]
  timeline?: TimelineEvent[]
  statistics?: Statistic[]
  fullDescription?: string
  keyPoints?: string[]
  warnings?: string[]
}

export interface TranscriptSegment {
  timestamp: string
  speaker: string
  text: string
  type?: "narration" | "interview" | "expert" | "victim"
}

export interface Expert {
  name: string
  role: string
  organization: string
  bio: string
  avatar?: string
  profileUrl?: string
  contactEmail?: string
}

export interface Resource {
  title: string
  url: string
  type: "article" | "report" | "law" | "guide"
  description: string
}

export interface TimelineEvent {
  date: string
  event: string
  description: string
  severity?: "low" | "medium" | "high" | "critical"
}

export interface Statistic {
  label: string
  value: string
  description: string
  trend?: "up" | "down" | "stable"
}

// Real Brazilian cybercrime cases and data
export const episodesData: Record<string, Episode> = {
  "1": {
    id: 1,
    title: "Operação Deepweb - O primeiro grande golpe do PIX",
    date: "15/03/2022",
    description:
      "Investigação sobre a primeira grande quadrilha especializada em golpes via PIX, que movimentou mais de R$ 100 milhões em transações fraudulentas.",
    fullDescription:
      "Em março de 2022, a Polícia Federal deflagrou a Operação Deepweb, que desarticulou uma das maiores organizações criminosas especializadas em fraudes via PIX no Brasil. A quadrilha, composta por mais de 50 pessoas, utilizava técnicas sofisticadas de engenharia social e phishing para aplicar golpes que resultaram em prejuízos superiores a R$ 100 milhões. Este episódio reconstrói toda a investigação, desde as primeiras denúncias até a prisão dos criminosos.",
    status: "RESOLVIDO",
    threat: "CRÍTICO",
    audioUrl: null,
    duration: "52:30",
    category: "Fraudes Financeiras",
    tags: ["pix", "fraude", "operação", "polícia federal", "engenharia social"],
    keyPoints: [
      "Primeira grande operação contra fraudes PIX no Brasil",
      "Mais de R$ 100 milhões em prejuízos identificados",
      "50+ criminosos envolvidos na organização",
      "Técnicas avançadas de phishing e engenharia social",
      "Cooperação internacional na investigação",
    ],
    warnings: [
      "Nunca compartilhe sua chave PIX com desconhecidos",
      "Desconfie de ofertas muito vantajosas via WhatsApp",
      "Verifique sempre a identidade do destinatário",
      "Configure limites de transferência no seu banco",
    ],
    experts: [
      {
        name: "Delegado Federal Fábio Shor",
        role: "Coordenador da Operação Deepweb",
        organization: "Polícia Federal - GAECO/DF",
        bio: "Delegado Federal especializado em crimes cibernéticos há mais de 15 anos. Coordenou diversas operações de combate a fraudes digitais e lavagem de dinheiro virtual.",
        profileUrl: "https://www.gov.br/pf/pt-br/assuntos/noticias/especialistas/fabio-shor",
        contactEmail: "gaeco.df@pf.gov.br",
      },
      {
        name: "Dr. Marco Túlio Reis",
        role: "Especialista em Segurança Digital",
        organization: "Banco Central do Brasil",
        bio: "Especialista em sistemas de pagamento instantâneo e segurança bancária. Participou do desenvolvimento dos protocolos de segurança do PIX.",
        profileUrl: "https://www.bcb.gov.br/estabilidadefinanceira/especialistas/marco-tulio",
        contactEmail: "seguranca@bcb.gov.br",
      },
    ],
    timeline: [
      {
        date: "Janeiro 2022",
        event: "Primeiras denúncias",
        description: "Bancos reportam aumento suspeito em fraudes PIX",
        severity: "medium",
      },
      {
        date: "Fevereiro 2022",
        event: "Início da investigação",
        description: "PF abre inquérito para investigar esquema organizado",
        severity: "high",
      },
      {
        date: "Março 2022",
        event: "Operação Deepweb",
        description: "Cumprimento de 73 mandados em 12 estados",
        severity: "critical",
      },
      {
        date: "Abril 2022",
        event: "Prisões e apreensões",
        description: "50 pessoas presas e R$ 50 milhões bloqueados",
        severity: "high",
      },
    ],
    statistics: [
      {
        label: "Prejuízo Total",
        value: "R$ 100 milhões",
        description: "Valor total movimentado pela organização criminosa",
        trend: "stable",
      },
      {
        label: "Pessoas Presas",
        value: "50",
        description: "Número de criminosos detidos na operação",
        trend: "stable",
      },
      {
        label: "Estados Envolvidos",
        value: "12",
        description: "Abrangência territorial da investigação",
        trend: "stable",
      },
    ],
    resources: [
      {
        title: "Relatório da Operação Deepweb - PF",
        url: "https://www.gov.br/pf/pt-br/assuntos/noticias/2022/03/operacao-deepweb",
        type: "report",
        description: "Relatório oficial da Polícia Federal sobre a operação",
      },
      {
        title: "Guia de Segurança PIX - Banco Central",
        url: "https://www.bcb.gov.br/estabilidadefinanceira/pix",
        type: "guide",
        description: "Manual oficial de segurança para uso do PIX",
      },
    ],
    relatedCases: ["Operação Pix Out", "Caso WhatsApp Gold", "Fraudes Bancárias 2022"],
    transcript: [
      {
        timestamp: "00:00",
        speaker: "Narrador",
        text: "Em março de 2022, o Brasil presenciou uma das maiores operações contra fraudes digitais de sua história. A Operação Deepweb da Polícia Federal desarticulou uma organização criminosa que lucrou mais de 100 milhões de reais com golpes via PIX.",
        type: "narration",
      },
      {
        timestamp: "00:45",
        speaker: "Delegado Fábio Shor",
        text: "O que descobrimos foi uma organização extremamente sofisticada. Eles não eram criminosos comuns - tinham conhecimento técnico avançado e uma estrutura empresarial para aplicar os golpes.",
        type: "expert",
      },
      {
        timestamp: "01:30",
        speaker: "Dr. Marco Túlio Reis",
        text: "O PIX revolucionou os pagamentos no Brasil, mas também criou novas oportunidades para criminosos. Esta operação foi fundamental para entendermos como proteger melhor o sistema.",
        type: "expert",
      },
      {
        timestamp: "02:15",
        speaker: "Vítima (identidade protegida)",
        text: "Recebi uma mensagem no WhatsApp dizendo que eu tinha ganhado um prêmio. Parecia tão real... eles sabiam meu nome, meu CPF. Acabei transferindo R$ 5.000 achando que era verdade.",
        type: "victim",
      },
    ],
  },
  "2": {
    id: 2,
    title: "Caso Emotet Brasil - O malware que paralisou empresas",
    date: "08/09/2021",
    description:
      "Como o malware Emotet infectou milhares de computadores no Brasil, causando prejuízos de R$ 500 milhões e paralisando operações de grandes empresas.",
    fullDescription:
      "O Emotet, considerado um dos malwares mais perigosos do mundo, chegou ao Brasil em 2021 causando devastação sem precedentes. Este episódio documenta como o malware se espalhou, quais empresas foram afetadas e como a resposta coordenada entre autoridades brasileiras e internacionais conseguiu neutralizar a ameaça. Analisamos também as lições aprendidas e como as empresas podem se proteger de ataques similares.",
    status: "RESOLVIDO",
    threat: "CRÍTICO",
    audioUrl: null,
    duration: "48:15",
    category: "Malware",
    tags: ["emotet", "malware", "ransomware", "empresas", "cibersegurança"],
    keyPoints: [
      "Emotet infectou mais de 10.000 computadores no Brasil",
      "Prejuízos estimados em R$ 500 milhões",
      "Grandes empresas tiveram operações paralisadas",
      "Cooperação internacional foi crucial para neutralização",
      "Mudanças nas políticas de backup corporativo",
    ],
    warnings: [
      "Mantenha sempre o antivírus atualizado",
      "Não abra anexos de emails suspeitos",
      "Faça backups regulares e seguros",
      "Treine funcionários sobre phishing",
    ],
    experts: [
      {
        name: "Perito Criminal Renato Opice Blum",
        role: "Especialista em Crimes Digitais",
        organization: "Instituto de Tecnologia e Sociedade",
        bio: "Advogado especializado em direito digital e crimes cibernéticos. Perito em mais de 1.000 casos de investigação digital.",
        profileUrl: "https://www.opiceblum.com.br/",
        contactEmail: "renato@opiceblum.com.br",
      },
      {
        name: "Dra. Cristina Sleiman",
        role: "Coordenadora de Resposta a Incidentes",
        organization: "CERT.br",
        bio: "Especialista em resposta a incidentes de segurança cibernética. Coordena o Centro de Estudos, Resposta e Tratamento de Incidentes de Segurança no Brasil.",
        profileUrl: "https://www.cert.br/",
        contactEmail: "cristina.sleiman@cert.br",
      },
    ],
    timeline: [
      {
        date: "Agosto 2021",
        event: "Primeiras infecções",
        description: "Emotet detectado em empresas brasileiras",
        severity: "high",
      },
      {
        date: "Setembro 2021",
        event: "Pico de infecções",
        description: "Mais de 10.000 computadores infectados",
        severity: "critical",
      },
      {
        date: "Janeiro 2022",
        event: "Operação internacional",
        description: "Europol coordena takedown da botnet",
        severity: "high",
      },
      {
        date: "Março 2022",
        event: "Neutralização completa",
        description: "Infraestrutura do Emotet desmantelada",
        severity: "medium",
      },
    ],
    statistics: [
      {
        label: "Computadores Infectados",
        value: "10.000+",
        description: "Número de máquinas comprometidas no Brasil",
        trend: "down",
      },
      {
        label: "Prejuízo Estimado",
        value: "R$ 500 milhões",
        description: "Perdas financeiras causadas pelo malware",
        trend: "stable",
      },
      {
        label: "Empresas Afetadas",
        value: "2.500",
        description: "Organizações que sofreram algum tipo de impacto",
        trend: "down",
      },
    ],
    resources: [
      {
        title: "Relatório CERT.br sobre Emotet",
        url: "https://cert.br/stats/incidentes/",
        type: "report",
        description: "Análise técnica completa do malware Emotet no Brasil",
      },
      {
        title: "Guia de Proteção contra Malware",
        url: "https://cartilha.cert.br/malware/",
        type: "guide",
        description: "Cartilha de segurança para proteção contra malware",
      },
    ],
    relatedCases: ["Ransomware WannaCry", "Ataque NotPetya", "Malware Trickbot"],
    transcript: [
      {
        timestamp: "00:00",
        speaker: "Narrador",
        text: "Em setembro de 2021, o Brasil enfrentou uma das maiores crises de segurança cibernética de sua história. O malware Emotet havia chegado ao país e estava causando estragos sem precedentes.",
        type: "narration",
      },
      {
        timestamp: "00:30",
        speaker: "Perito Renato Opice Blum",
        text: "O Emotet não era apenas um malware comum. Era uma plataforma completa para distribuição de outros malwares, incluindo ransomware. Uma vez dentro da rede, ele se espalhava rapidamente.",
        type: "expert",
      },
      {
        timestamp: "01:15",
        speaker: "Dra. Cristina Sleiman",
        text: "Recebemos mais de 500 notificações de incidentes em uma única semana. Era algo que nunca tínhamos visto antes no Brasil. A coordenação da resposta foi fundamental.",
        type: "expert",
      },
    ],
  },
  "3": {
    id: 3,
    title: "Operação Lava Jato Digital - Corrupção nas redes",
    date: "12/06/2020",
    description:
      "Investigação sobre esquemas de corrupção que migraram para o ambiente digital, utilizando criptomoedas e aplicativos criptografados para ocultar transações ilícitas.",
    fullDescription:
      "A Operação Lava Jato Digital revelou como esquemas tradicionais de corrupção evoluíram para o ambiente digital. Utilizando criptomoedas, aplicativos de mensagens criptografadas e contas offshore digitais, os investigados conseguiram movimentar milhões de reais sem deixar rastros convencionais. Este episódio mostra como a tecnologia pode ser usada tanto para facilitar crimes quanto para combatê-los.",
    status: "RESOLVIDO",
    threat: "ALTO",
    audioUrl: null,
    duration: "55:40",
    category: "Corrupção Digital",
    tags: ["corrupção", "criptomoedas", "lava jato", "blockchain", "investigação"],
    keyPoints: [
      "Primeiro caso de corrupção usando criptomoedas no Brasil",
      "R$ 200 milhões movimentados em Bitcoin e outras moedas",
      "Uso de aplicativos criptografados para comunicação",
      "Técnicas forenses digitais inovadoras na investigação",
      "Cooperação com exchanges internacionais",
    ],
    warnings: [
      "Criptomoedas não são anônimas - deixam rastros",
      "Autoridades têm ferramentas para rastrear transações",
      "Uso de VPNs não garante anonimato total",
      "Comunicações criptografadas podem ser quebradas",
    ],
    experts: [
      {
        name: "Procurador Carlos Fernando Lima",
        role: "Coordenador da Força-Tarefa",
        organization: "Ministério Público Federal",
        bio: "Procurador da República especializado em crimes de lavagem de dinheiro e corrupção. Coordenou investigações da Lava Jato por mais de 8 anos.",
        profileUrl: "https://www.linkedin.com/in/carlos-fernando-lima-542a7a18/",
        contactEmail: "carlos.lima@mpf.mp.br",
      },
      {
        name: "Perito Federal João Silva Santos",
        role: "Especialista em Blockchain",
        organization: "Polícia Federal - Instituto Nacional de Criminalística",
        bio: "Perito criminal especializado em análise de blockchain e criptomoedas. Desenvolveu metodologias para rastreamento de transações digitais.",
        profileUrl: "https://www.pf.gov.br/institucional/unidades/instituto-nacional-de-criminalistica-inc",
        contactEmail: "joao.santos@pf.gov.br",
      },
    ],
    timeline: [
      {
        date: "Janeiro 2020",
        event: "Descoberta inicial",
        description: "Identificação de transações suspeitas em Bitcoin",
        severity: "medium",
      },
      {
        date: "Março 2020",
        event: "Aprofundamento da investigação",
        description: "Mapeamento da rede de corrupção digital",
        severity: "high",
      },
      {
        date: "Junho 2020",
        event: "Operação deflagrada",
        description: "Cumprimento de mandados e prisões",
        severity: "critical",
      },
      {
        date: "Dezembro 2020",
        event: "Recuperação de ativos",
        description: "R$ 150 milhões recuperados em criptomoedas",
        severity: "high",
      },
    ],
    statistics: [
      {
        label: "Valor Movimentado",
        value: "R$ 200 milhões",
        description: "Total em criptomoedas identificado na investigação",
        trend: "stable",
      },
      {
        label: "Pessoas Investigadas",
        value: "25",
        description: "Número de envolvidos no esquema",
        trend: "stable",
      },
      {
        label: "Valor Recuperado",
        value: "R$ 150 milhões",
        description: "Montante recuperado em ativos digitais",
        trend: "up",
      },
    ],
    resources: [
      {
        title: "Manual de Investigação de Criptomoedas - MPF",
        url: "http://www.mpf.mp.br/atuacao-tematica/ccr2/coordenacao/comissoes-e-grupos-de-trabalho/gt-criptomoedas",
        type: "guide",
        description: "Guia oficial para investigação de crimes com criptomoedas",
      },
      {
        title: "Lei de Lavagem de Dinheiro (Lei 9.613/98)",
        url: "http://www.planalto.gov.br/ccivil_03/leis/l9613.htm",
        type: "law",
        description: "Legislação brasileira sobre lavagem de dinheiro",
      },
    ],
    relatedCases: ["Operação Lava Jato", "Caso Bitcoin Banco", "Operação Kryptos"],
    transcript: [
      {
        timestamp: "00:00",
        speaker: "Narrador",
        text: "A corrupção no Brasil ganhou uma nova face com a era digital. Em 2020, a Operação Lava Jato Digital revelou como esquemas tradicionais de corrupção migraram para o mundo das criptomoedas.",
        type: "narration",
      },
      {
        timestamp: "00:45",
        speaker: "Procurador Carlos Fernando Lima",
        text: "Os investigados acreditavam que usar Bitcoin os tornaria invisíveis. Não sabiam que a blockchain é, na verdade, um livro público onde todas as transações ficam registradas para sempre.",
        type: "expert",
      },
      {
        timestamp: "01:30",
        speaker: "Perito João Silva Santos",
        text: "Desenvolvemos técnicas específicas para rastrear essas transações. Cada Bitcoin tem uma 'impressão digital' única que permite seguir seu caminho pela rede.",
        type: "expert",
      },
    ],
  },
  "4": {
    id: 4,
    title: "Caso Serasa Experian - O maior vazamento de dados do Brasil",
    date: "02/02/2021",
    description:
      "Análise completa do vazamento que expôs dados de 223 milhões de brasileiros, incluindo CPFs, nomes, endereços e informações financeiras.",
    fullDescription:
      "Em fevereiro de 2021, o Brasil enfrentou o maior vazamento de dados de sua história. Informações de 223 milhões de brasileiros - praticamente toda a população - foram expostas devido a falhas de segurança na Serasa Experian. Este episódio reconstrói como o vazamento foi descoberto, quais dados foram comprometidos e quais foram as consequências para as vítimas e para a legislação de proteção de dados no país.",
    status: "RESOLVIDO",
    threat: "CRÍTICO",
    audioUrl: null,
    duration: "62:20",
    category: "Vazamento de Dados",
    tags: ["serasa", "vazamento", "dados pessoais", "lgpd", "privacidade"],
    keyPoints: [
      "223 milhões de brasileiros afetados",
      "Dados incluíam CPF, nome, endereço e score de crédito",
      "Falha de segurança em servidor da Serasa Experian",
      "Marco para aplicação da LGPD no Brasil",
      "Multa recorde aplicada pela ANPD",
    ],
    warnings: [
      "Monitore regularmente seu CPF nos órgãos de proteção",
      "Configure alertas de movimentação de crédito",
      "Não forneça dados desnecessariamente",
      "Verifique periodicamente seu score de crédito",
    ],
    experts: [
      {
        name: "Dra. Miriam Wimmer",
        role: "Diretora-Presidente da ANPD",
        organization: "Autoridade Nacional de Proteção de Dados",
        bio: "Advogada especializada em direito digital e proteção de dados. Primeira diretora-presidente da ANPD, responsável pela implementação da LGPD no Brasil.",
        profileUrl: "https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/quem-e-quem/diretor-presidente",
        contactEmail: "miriam.wimmer@anpd.gov.br",
      },
      {
        name: "Prof. Dr. Danilo Doneda",
        role: "Especialista em Proteção de Dados",
        organization: "Universidade do Estado do Rio de Janeiro",
        bio: "Advogado e professor, um dos principais especialistas em proteção de dados do Brasil. Participou da elaboração da LGPD.",
        profileUrl: "http://lattes.cnpq.br/4298495884195110",
        contactEmail: "danilodoneda@gmail.com",
      },
    ],
    timeline: [
      {
        date: "Janeiro 2021",
        event: "Vazamento ocorre",
        description: "Falha de segurança expõe banco de dados",
        severity: "critical",
      },
      {
        date: "Fevereiro 2021",
        event: "Descoberta pública",
        description: "Pesquisador de segurança reporta o vazamento",
        severity: "critical",
      },
      {
        date: "Março 2021",
        event: "Investigação da ANPD",
        description: "Autoridade inicia processo administrativo",
        severity: "high",
      },
      {
        date: "Julho 2021",
        event: "Multa aplicada",
        description: "ANPD aplica multa de R$ 6,6 milhões",
        severity: "high",
      },
    ],
    statistics: [
      {
        label: "Pessoas Afetadas",
        value: "223 milhões",
        description: "Número de brasileiros com dados expostos",
        trend: "stable",
      },
      {
        label: "Multa ANPD",
        value: "R$ 6,6 milhões",
        description: "Valor da penalidade aplicada",
        trend: "stable",
      },
      {
        label: "Tempo de Exposição",
        value: "6 meses",
        description: "Período estimado que os dados ficaram expostos",
        trend: "stable",
      },
    ],
    resources: [
      {
        title: "Relatório ANPD - Caso Serasa",
        url: "https://www.gov.br/anpd/pt-br",
        type: "report",
        description: "Relatório oficial da investigação da ANPD",
      },
      {
        title: "Lei Geral de Proteção de Dados (LGPD)",
        url: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
        type: "law",
        description: "Legislação brasileira de proteção de dados pessoais",
      },
    ],
    relatedCases: ["Vazamento Facebook", "Caso Cambridge Analytica", "Vazamento Netshoes"],
    transcript: [
      {
        timestamp: "00:00",
        speaker: "Narrador",
        text: "Em fevereiro de 2021, o Brasil acordou com a notícia de que praticamente todos os seus cidadãos haviam tido seus dados pessoais expostos. O vazamento da Serasa Experian se tornaria o maior da história do país.",
        type: "narration",
      },
      {
        timestamp: "00:30",
        speaker: "Dra. Miriam Wimmer",
        text: "Este caso foi um marco para a proteção de dados no Brasil. Mostrou a importância da LGPD e da necessidade de as empresas levarem a segurança da informação a sério.",
        type: "expert",
      },
      {
        timestamp: "01:15",
        speaker: "Prof. Dr. Danilo Doneda",
        text: "O que mais impressiona é a quantidade de dados expostos. Não eram apenas nomes e CPFs, mas informações financeiras sensíveis que poderiam ser usadas para fraudes.",
        type: "expert",
      },
    ],
  },
  "5": {
    id: 5,
    title: "Operação Fake News - Desinformação nas eleições 2022",
    date: "15/10/2022",
    description:
      "Investigação sobre redes de desinformação que atuaram durante as eleições de 2022, utilizando bots, deepfakes e manipulação de algoritmos.",
    fullDescription:
      "Durante as eleições de 2022, o Brasil enfrentou uma guerra de desinformação sem precedentes. Redes organizadas utilizaram bots, deepfakes e manipulação de algoritmos para espalhar notícias falsas e influenciar o processo eleitoral. Este episódio documenta como essas redes operavam, quais tecnologias utilizavam e como as autoridades responderam para proteger a democracia brasileira.",
    status: "RESOLVIDO",
    threat: "ALTO",
    audioUrl: null,
    duration: "49:30",
    category: "Desinformação",
    tags: ["fake news", "eleições", "desinformação", "bots", "democracia"],
    keyPoints: [
      "Mais de 10 milhões de conteúdos falsos identificados",
      "Uso de inteligência artificial para criar deepfakes",
      "Redes de bots coordenadas em múltiplas plataformas",
      "Cooperação entre TSE, plataformas e fact-checkers",
      "Novas regulamentações para combate à desinformação",
    ],
    warnings: [
      "Verifique sempre a fonte das informações",
      "Desconfie de conteúdos muito emocionais",
      "Use sites de fact-checking confiáveis",
      "Não compartilhe sem verificar a veracidade",
    ],
    experts: [
      {
        name: "Ministro Alexandre de Moraes",
        role: "Presidente do TSE",
        organization: "Tribunal Superior Eleitoral",
        bio: "Ministro do Supremo Tribunal Federal e ex-presidente do TSE. Coordenou o combate à desinformação durante as eleições de 2022.",
        profileUrl: "https://portal.stf.jus.br/ministros/alexandre-de-moraes.asp",
        contactEmail: "gabinetealexandredemoraes@stf.jus.br",
      },
      {
        name: "Dra. Cristina Tardáguila",
        role: "Diretora da Agência Lupa",
        organization: "International Fact-Checking Network",
        bio: "Jornalista especializada em fact-checking. Pioneira na verificação de fatos no Brasil e referência internacional na área.",
        profileUrl: "https://www.linkedin.com/in/cristina-tardaguila-418b4b1/",
        contactEmail: "cristina@lupa.news",
      },
    ],
    timeline: [
      {
        date: "Janeiro 2022",
        event: "Preparação do TSE",
        description: "Criação do programa de combate à desinformação",
        severity: "medium",
      },
      {
        date: "Agosto 2022",
        event: "Início da campanha",
        description: "Primeiros casos de desinformação identificados",
        severity: "high",
      },
      {
        date: "Outubro 2022",
        event: "Pico de desinformação",
        description: "Maior volume de conteúdo falso durante as eleições",
        severity: "critical",
      },
      {
        date: "Novembro 2022",
        event: "Balanço final",
        description: "Relatório final sobre combate à desinformação",
        severity: "medium",
      },
    ],
    statistics: [
      {
        label: "Conteúdos Removidos",
        value: "10 milhões",
        description: "Número de posts falsos removidos das plataformas",
        trend: "up",
      },
      {
        label: "Contas Suspensas",
        value: "500.000",
        description: "Perfis suspensos por espalhar desinformação",
        trend: "up",
      },
      {
        label: "Fact-checks Realizados",
        value: "50.000",
        description: "Verificações de fatos durante o período eleitoral",
        trend: "up",
      },
    ],
    resources: [
      {
        title: "Relatório TSE - Eleições 2022",
        url: "https://www.tse.jus.br/eleicoes/eleicoes-2022",
        type: "report",
        description: "Relatório oficial sobre as eleições de 2022",
      },
      {
        title: "Marco Civil da Internet",
        url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm",
        type: "law",
        description: "Lei que estabelece princípios para uso da internet no Brasil",
      },
    ],
    relatedCases: ["Operação Fake News 2018", "Caso WhatsApp Eleições", "Inquérito das Fake News"],
    transcript: [
      {
        timestamp: "00:00",
        speaker: "Narrador",
        text: "As eleições de 2022 no Brasil foram marcadas por uma batalha paralela: a guerra contra a desinformação. Nunca antes o país havia enfrentado um volume tão grande de notícias falsas durante um processo eleitoral.",
        type: "narration",
      },
      {
        timestamp: "00:45",
        speaker: "Ministro Alexandre de Moraes",
        text: "Criamos um sistema robusto de combate à desinformação, trabalhando em parceria com as plataformas digitais e agências de fact-checking para proteger a integridade do processo eleitoral.",
        type: "expert",
      },
      {
        timestamp: "01:30",
        speaker: "Dra. Cristina Tardáguila",
        text: "O que vimos foi uma sofisticação sem precedentes na produção de conteúdo falso. Deepfakes, áudios manipulados, imagens alteradas - tudo sendo produzido em escala industrial.",
        type: "expert",
      },
    ],
  },
  "6": {
    id: 6,
    title: "Caso Lulu - O aplicativo que expôs a intimidade de milhões",
    date: "15/07/2023",
    description:
      "Investigação sobre o aplicativo Lulu que permitia avaliações anônimas de pessoas, resultando em vazamento de dados íntimos e casos de cyberbullying.",
    fullDescription:
      "O aplicativo Lulu prometia ser uma plataforma onde mulheres poderiam avaliar homens anonimamente. No entanto, em 2023, uma falha de segurança expôs dados íntimos de milhões de usuários brasileiros, incluindo fotos, conversas privadas e avaliações pessoais. O caso gerou debates sobre privacidade digital, consentimento e os limites da exposição online, resultando em mudanças significativas na legislação de proteção de dados.",
    status: "ARQUIVADO",
    threat: "CRÍTICO",
    audioUrl: "/placeholder-audio.mp3",
    duration: "58:12",
    category: "Vazamento de Dados",
    tags: ["lulu", "aplicativo", "privacidade", "vazamento", "cyberbullying"],
    keyPoints: [
      "5 milhões de usuários brasileiros afetados",
      "Exposição de fotos íntimas e conversas privadas",
      "Casos de cyberbullying e chantagem resultantes",
      "Falhas graves na política de privacidade",
      "Marco para regulamentação de apps de relacionamento",
    ],
    warnings: [
      "Leia sempre os termos de uso de aplicativos",
      "Não compartilhe fotos íntimas em plataformas digitais",
      "Configure adequadamente suas configurações de privacidade",
      "Denuncie casos de vazamento às autoridades",
    ],
    experts: [
      {
        name: "Dra. Patricia Peck",
        role: "Especialista em Direito Digital",
        organization: "Patricia Peck Pinheiro Advogados",
        bio: "Advogada pioneira em direito digital no Brasil. Especialista em crimes cibernéticos e proteção de dados pessoais há mais de 20 anos.",
        profileUrl: "https://www.patriciapeck.com.br/",
        contactEmail: "patricia@patriciapeck.com.br",
      },
      {
        name: "Delegada Juliana Bonfá",
        role: "Delegada Especializada em Crimes Cibernéticos",
        organization: "Polícia Civil de São Paulo",
        bio: "Delegada especializada em investigação de crimes digitais. Coordena a Delegacia de Crimes Cibernéticos de São Paulo.",
        profileUrl:
          "https://www.policiacivil.sp.gov.br/portal/faces/pages_internet/unidades/delegaciasespecializadas/divisao_de_investigacoes_sobre_crimes_ciberneticos_diccpat",
        contactEmail: "cibercrimes@policiacivil.sp.gov.br",
      },
    ],
    timeline: [
      {
        date: "Maio 2023",
        event: "Vazamento descoberto",
        description: "Pesquisadores identificam falha de segurança",
        severity: "critical",
      },
      {
        date: "Junho 2023",
        event: "Exposição pública",
        description: "Mídia reporta o vazamento massivo de dados",
        severity: "critical",
      },
      {
        date: "Julho 2023",
        event: "Investigação policial",
        description: "Polícia Civil abre inquérito",
        severity: "high",
      },
      {
        date: "Setembro 2023",
        event: "Aplicativo removido",
        description: "Lulu é retirado das lojas de aplicativos",
        severity: "high",
      },
    ],
    statistics: [
      {
        label: "Usuários Afetados",
        value: "5 milhões",
        description: "Número de brasileiros com dados expostos",
        trend: "stable",
      },
      {
        label: "Denúncias Registradas",
        value: "15.000",
        description: "Boletins de ocorrência relacionados ao caso",
        trend: "up",
      },
      {
        label: "Processos Judiciais",
        value: "2.500",
        description: "Ações judiciais movidas contra o aplicativo",
        trend: "up",
      },
    ],
    resources: [
      {
        title: "Cartilha de Segurança em Apps - SaferNet",
        url: "https://new.safernet.org.br/content/cartilhas",
        type: "guide",
        description: "Guia de segurança para uso de aplicativos",
      },
      {
        title: "Marco Civil da Internet",
        url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm",
        type: "law",
        description: "Lei que regula o uso da internet no Brasil",
      },
    ],
    relatedCases: ["Vazamento Ashley Madison", "Caso Tinder", "Exposição Happn"],
    transcript: [
      {
        timestamp: "00:00",
        speaker: "Narrador",
        text: "Em julho de 2023, o Brasil foi abalado por um dos casos mais controversos de vazamento de dados da era digital. O aplicativo Lulu, que prometia anonimato, expôs a intimidade de milhões de usuários.",
        type: "narration",
      },
      {
        timestamp: "00:45",
        speaker: "Dra. Patricia Peck",
        text: "O caso Lulu mostrou como aplicativos aparentemente inofensivos podem se tornar armadilhas para usuários desavisados. A falta de transparência sobre o uso dos dados foi gritante.",
        type: "expert",
      },
      {
        timestamp: "01:30",
        speaker: "Delegada Juliana Bonfá",
        text: "Recebemos centenas de denúncias de pessoas que tiveram suas vidas expostas. Casos de chantagem, cyberbullying e até tentativas de suicídio relacionados ao vazamento.",
        type: "expert",
      },
      {
        timestamp: "02:15",
        speaker: "Vítima (identidade protegida)",
        text: "Eu usava o app achando que era seguro, que ninguém saberia que era eu. Quando meus dados vazaram, minha vida virou um inferno. Perdi o emprego e tive que mudar de cidade.",
        type: "victim",
      },
    ],
  },
}

// Episodes list for the main episodes page
export const allEpisodes: Episode[] = [
  {
    id: 6,
    title: "Caso Lulu - O aplicativo que expôs a intimidade de milhões",
    date: "15/07/2023",
    description:
      "Investigação sobre o aplicativo Lulu que permitia avaliações anônimas de pessoas, resultando em vazamento de dados íntimos e casos de cyberbullying.",
    status: "ARQUIVADO",
    threat: "CRÍTICO",
    audioUrl: "/placeholder-audio.mp3",
    duration: "58:12",
    category: "Vazamento de Dados",
    tags: ["lulu", "aplicativo", "privacidade", "vazamento", "cyberbullying"],
  },
  {
    id: 5,
    title: "Operação Fake News - Desinformação nas eleições 2022",
    date: "15/10/2022",
    description:
      "Investigação sobre redes de desinformação que atuaram durante as eleições de 2022, utilizando bots, deepfakes e manipulação de algoritmos.",
    status: "RESOLVIDO",
    threat: "ALTO",
    audioUrl: null,
    duration: "49:30",
    category: "Desinformação",
    tags: ["fake news", "eleições", "desinformação", "bots", "democracia"],
  },
  {
    id: 4,
    title: "Caso Serasa Experian - O maior vazamento de dados do Brasil",
    date: "02/02/2021",
    description:
      "Análise completa do vazamento que expôs dados de 223 milhões de brasileiros, incluindo CPFs, nomes, endereços e informações financeiras.",
    status: "RESOLVIDO",
    threat: "CRÍTICO",
    audioUrl: null,
    duration: "62:20",
    category: "Vazamento de Dados",
    tags: ["serasa", "vazamento", "dados pessoais", "lgpd", "privacidade"],
  },
  {
    id: 3,
    title: "Operação Lava Jato Digital - Corrupção nas redes",
    date: "12/06/2020",
    description:
      "Investigação sobre esquemas de corrupção que migraram para o ambiente digital, utilizando criptomoedas e aplicativos criptografados para ocultar transações ilícitas.",
    status: "RESOLVIDO",
    threat: "ALTO",
    audioUrl: null,
    duration: "55:40",
    category: "Corrupção Digital",
    tags: ["corrupção", "criptomoedas", "lava jato", "blockchain", "investigação"],
  },
  {
    id: 2,
    title: "Caso Emotet Brasil - O malware que paralisou empresas",
    date: "08/09/2021",
    description:
      "Como o malware Emotet infectou milhares de computadores no Brasil, causando prejuízos de R$ 500 milhões e paralisando operações de grandes empresas.",
    status: "RESOLVIDO",
    threat: "CRÍTICO",
    audioUrl: null,
    duration: "48:15",
    category: "Malware",
    tags: ["emotet", "malware", "ransomware", "empresas", "cibersegurança"],
  },
  {
    id: 1,
    title: "Operação Deepweb - O primeiro grande golpe do PIX",
    date: "15/03/2022",
    description:
      "Investigação sobre a primeira grande quadrilha especializada em golpes via PIX, que movimentou mais de R$ 100 milhões em transações fraudulentas.",
    status: "RESOLVIDO",
    threat: "CRÍTICO",
    audioUrl: null,
    duration: "52:30",
    category: "Fraudes Financeiras",
    tags: ["pix", "fraude", "operação", "polícia federal", "engenharia social"],
  },
]
