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
  id: string
  timestamp: string
  speaker: string
  text: string
  type?: "narration" | "interview" | "expert" | "victim"
}

export interface Expert {
  id: string
  name: string
  role: string
  organization: string
  bio: string
  avatar?: string
  profileUrl?: string
  contact?: {
    email?: string
    phone?: string
    linkedin?: string
  }
}

export interface Resource {
  id: string
  title: string
  url: string
  type: "article" | "report" | "law" | "guide" | "video" | "document"
  description: string
  source: string
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  completed: boolean
}

export interface Statistic {
  id: string
  label: string
  value: string
  description: string
  trend?: "up" | "down" | "stable"
}

// Complete episode data with proper separation
export const episodes: Episode[] = [
  {
    id: 7,
    title: "Brasil: Fraudes Digitais - Ameaças Avançadas e Respostas",
    date: "15/01/2024",
    description:
      "Análise profunda das fraudes digitais mais sofisticadas que atingem o Brasil, com especialistas revelando as técnicas mais avançadas usadas por criminosos e as respostas das autoridades.",
    fullDescription:
      "Este episódio especial mergulha no mundo complexo das fraudes digitais que assolam o Brasil. Com a participação de especialistas renomados, exploramos desde os golpes mais simples até as operações criminosas mais sofisticadas que utilizam inteligência artificial, deepfakes e engenharia social avançada.",
    status: "ATIVO",
    threat: "CRÍTICO",
    audioUrl: "/audio/brasil-fraudes-digitais.mp3",
    duration: "45:30",
    category: "Fraudes Digitais",
    tags: ["fraudes", "golpes", "segurança digital", "prevenção", "investigação"],
    keyPoints: [
      "Análise de fraudes digitais sofisticadas no Brasil",
      "Técnicas avançadas de engenharia social",
      "Uso de IA e deepfakes por criminosos",
      "Estratégias de prevenção e proteção",
      "Resposta coordenada das autoridades",
    ],
    warnings: [
      "Nunca forneça dados pessoais por telefone ou e-mail",
      "Desconfie de ofertas muito vantajosas",
      "Verifique sempre a autenticidade de sites e aplicativos",
      "Mantenha seus dispositivos sempre atualizados",
    ],
    experts: [
      {
        id: "expert-7-1",
        name: "Dr. Carlos Mendes",
        role: "Delegado Federal - Especialista em Crimes Cibernéticos",
        organization: "Polícia Federal",
        bio: "Mais de 15 anos de experiência em investigação de crimes digitais. Coordena operações nacionais contra fraudes online e lidera a força-tarefa de combate aos crimes cibernéticos.",
        contact: {
          email: "carlos.mendes@pf.gov.br",
        },
      },
      {
        id: "expert-7-2",
        name: "Dra. Ana Paula Silva",
        role: "Promotora de Justiça - Crimes Digitais",
        organization: "Ministério Público de São Paulo",
        bio: "Especialista em direito digital e crimes cibernéticos. Atua em casos de alta complexidade envolvendo fraudes online, lavagem de dinheiro digital e crimes contra o consumidor.",
        contact: {
          email: "ana.silva@mpsp.mp.br",
        },
      },
    ],
    timeline: [
      {
        id: "timeline-7-1",
        date: "Janeiro 2023",
        title: "Descoberta do esquema de fraude em criptomoedas",
        description:
          "Primeira denúncia sobre plataforma fraudulenta de investimentos que lesou milhares de brasileiros",
        severity: "medium",
        completed: true,
      },
      {
        id: "timeline-7-2",
        date: "Março 2023",
        title: "Operação Moeda Digital",
        description: "Polícia Federal deflagra operação para desmantelar esquema de fraude em criptomoedas",
        severity: "high",
        completed: true,
      },
    ],
    resources: [
      {
        id: "resource-7-1",
        title: "Lei 12.737/2012 - Lei Carolina Dieckmann",
        url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12737.htm",
        type: "law",
        description: "Lei que tipifica crimes informáticos no Brasil",
        source: "Planalto",
      },
    ],
    transcript: [
      {
        id: "transcript-7-1",
        timestamp: "00:00",
        speaker: "Narrador",
        text: "Bem-vindos ao CyberJustiça Brasil. Hoje vamos mergulhar no mundo das fraudes digitais mais sofisticadas que assolam nosso país.",
        type: "narration",
      },
      {
        id: "transcript-7-2",
        timestamp: "02:15",
        speaker: "Dr. Carlos Mendes",
        text: "As fraudes digitais evoluíram drasticamente nos últimos anos. Não estamos mais falando apenas de golpes simples por email ou SMS.",
        type: "expert",
      },
    ],
  },
  {
    id: 6,
    title: "Caso Lulu - uso indevido de dados pessoais",
    date: "2023",
    description:
      "Um dos casos mais impactantes de 2023, exploramos como criminosos utilizaram dados vazados para criar um esquema de fraude que afetou milhares de brasileiros.",
    fullDescription:
      "O aplicativo Lulu prometia ser uma plataforma onde mulheres poderiam avaliar homens anonimamente. No entanto, em 2023, uma falha de segurança expôs dados íntimos de milhões de usuários brasileiros.",
    status: "ARQUIVADO",
    threat: "CRÍTICO",
    audioUrl: null,
    duration: "58:12",
    category: "Vazamento de Dados",
    tags: ["lulu", "aplicativo", "privacidade", "vazamento", "cyberbullying"],
    keyPoints: [
      "5 milhões de usuários brasileiros afetados",
      "Exposição de fotos íntimas e conversas privadas",
      "Casos de cyberbullying e chantagem resultantes",
      "Falhas graves na política de privacidade",
    ],
    experts: [
      {
        id: "expert-6-1",
        name: "Dra. Patricia Peck",
        role: "Especialista em Direito Digital",
        organization: "Patricia Peck Pinheiro Advogados",
        bio: "Advogada pioneira em direito digital no Brasil. Especialista em crimes cibernéticos e proteção de dados pessoais há mais de 20 anos.",
        contact: {
          email: "patricia@patriciapeck.com.br",
        },
      },
    ],
    timeline: [
      {
        id: "timeline-6-1",
        date: "Maio 2023",
        title: "Vazamento descoberto",
        description: "Pesquisadores identificam falha de segurança",
        severity: "critical",
        completed: true,
      },
      {
        id: "timeline-6-2",
        date: "Junho 2023",
        title: "Exposição pública",
        description: "Mídia reporta o vazamento massivo de dados",
        severity: "critical",
        completed: true,
      },
    ],
    resources: [
      {
        id: "resource-6-1",
        title: "Cartilha de Segurança em Apps - SaferNet",
        url: "https://new.safernet.org.br/content/cartilhas",
        type: "guide",
        description: "Guia de segurança para uso de aplicativos",
        source: "SaferNet",
      },
    ],
  },
  {
    id: 5,
    title: '"NaMoral" - Combate à corrupção nas redes',
    date: "2023",
    description:
      "Detalhamos a operação que desmantelou uma rede de corrupção que operava através de plataformas digitais, com entrevistas exclusivas dos investigadores.",
    fullDescription:
      "A Operação NaMoral foi uma investigação complexa que revelou como redes de corrupção migraram para o ambiente digital, utilizando aplicativos criptografados e criptomoedas para ocultar transações ilícitas.",
    status: "RESOLVIDO",
    threat: "MÉDIO",
    audioUrl: null,
    duration: "42:18",
    category: "Corrupção Digital",
    tags: ["corrupção", "operação", "investigação", "redes digitais"],
    experts: [
      {
        id: "expert-5-1",
        name: "Delegado Federal João Santos",
        role: "Coordenador da Operação NaMoral",
        organization: "Polícia Federal",
        bio: "Especialista em investigação de crimes de corrupção e lavagem de dinheiro digital.",
        contact: {
          email: "joao.santos@pf.gov.br",
        },
      },
    ],
    timeline: [
      {
        id: "timeline-5-1",
        date: "Janeiro 2023",
        title: "Início da investigação",
        description: "Primeiras evidências de corrupção digital identificadas",
        severity: "medium",
        completed: true,
      },
      {
        id: "timeline-5-2",
        date: "Junho 2023",
        title: "Operação NaMoral deflagrada",
        description: "Cumprimento de mandados em múltiplos estados",
        severity: "high",
        completed: true,
      },
    ],
    resources: [
      {
        id: "resource-5-1",
        title: "Lei Anticorrupção - 12.846/2013",
        url: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12846.htm",
        type: "law",
        description: "Lei de responsabilização administrativa e civil de pessoas jurídicas",
        source: "Planalto",
      },
    ],
  },
  {
    id: 13,
    title: "Crimes cibernéticos, fraude e estelionato",
    date: "15/05/2024",
    description:
      "Revela como quadrilhas brasileiras estão utilizando tecnologias avançadas para aplicar golpes financeiros sofisticados e como as autoridades estão respondendo.",
    fullDescription:
      "Uma análise abrangente dos métodos mais recentes utilizados por criminosos cibernéticos no Brasil, incluindo técnicas de phishing avançado, engenharia social e fraudes em aplicativos de pagamento.",
    status: "ATIVO",
    threat: "ALTO",
    audioUrl: null,
    duration: "47:25",
    category: "Fraudes Financeiras",
    tags: ["crimes cibernéticos", "fraude", "estelionato", "tecnologia"],
    experts: [
      {
        id: "expert-13-1",
        name: "Dr. Roberto Lima",
        role: "Especialista em Segurança Cibernética",
        organization: "Universidade Federal do Rio de Janeiro",
        bio: "PhD em Segurança da Informação com foco em prevenção de fraudes digitais.",
        contact: {
          email: "roberto.lima@ufrj.br",
        },
      },
    ],
    timeline: [
      {
        id: "timeline-13-1",
        date: "Março 2024",
        title: "Identificação de nova modalidade de golpe",
        description: "Descoberta de técnica inédita de fraude em aplicativos de pagamento",
        severity: "high",
        completed: true,
      },
    ],
    resources: [
      {
        id: "resource-13-1",
        title: "Guia de Prevenção a Fraudes - Banco Central",
        url: "https://www.bcb.gov.br/estabilidadefinanceira/prevencaofraudes",
        type: "guide",
        description: "Manual oficial de prevenção a fraudes financeiras",
        source: "Banco Central",
      },
    ],
  },
  {
    id: "ESPECIAL",
    title: "Proteção de crianças e adolescentes online",
    date: "06/05/2025",
    description:
      "Este especial abordará os perigos que crianças enfrentam online e estratégias eficazes de proteção, com depoimentos de especialistas.",
    fullDescription:
      "Um episódio especial dedicado à proteção de menores no ambiente digital, abordando cyberbullying, aliciamento online, exposição inadequada e estratégias de proteção familiar.",
    status: "AGENDADO",
    threat: "ALTO",
    audioUrl: null,
    duration: "52:00",
    category: "Proteção Infantil",
    tags: ["crianças", "adolescentes", "proteção", "cyberbullying", "aliciamento"],
    experts: [
      {
        id: "expert-especial-1",
        name: "Dra. Maria Fernanda Costa",
        role: "Psicóloga Especialista em Crimes Digitais contra Menores",
        organization: "Instituto de Proteção Digital",
        bio: "Especialista em psicologia infantil e crimes digitais, com mais de 10 anos de experiência em casos de exploração online.",
        contact: {
          email: "maria.costa@ipd.org.br",
        },
      },
    ],
    timeline: [
      {
        id: "timeline-especial-1",
        date: "Maio 2025",
        title: "Gravação do episódio especial",
        description: "Produção do conteúdo com especialistas em proteção infantil",
        severity: "medium",
        completed: false,
      },
    ],
    resources: [
      {
        id: "resource-especial-1",
        title: "Cartilha de Proteção Online - SaferNet",
        url: "https://new.safernet.org.br/content/cartilhas",
        type: "guide",
        description: "Guia para proteção de crianças e adolescentes online",
        source: "SaferNet",
      },
    ],
  },
  {
    id: 3,
    title: "Operação Lava Jato Digital - Corrupção nas redes",
    date: "12/06/2020",
    description:
      "Investigação sobre esquemas de corrupção que migraram para o ambiente digital, utilizando criptomoedas e aplicativos criptografados para ocultar transações ilícitas.",
    fullDescription:
      "Uma análise detalhada de como esquemas de corrupção tradicionais evoluíram para o ambiente digital, utilizando tecnologias como blockchain, criptomoedas e aplicativos de mensagens criptografadas.",
    status: "RESOLVIDO",
    threat: "ALTO",
    audioUrl: "/audio/namoral-combating-digital-corruption-networks.mp3",
    duration: "55:40",
    category: "Corrupção Digital",
    tags: ["corrupção", "criptomoedas", "lava jato", "blockchain", "investigação"],
    experts: [
      {
        id: "expert-3-1",
        name: "Dr. Fernando Oliveira",
        role: "Procurador da República",
        organization: "Ministério Público Federal",
        bio: "Especialista em crimes financeiros e corrupção digital, atuou em diversas operações de combate à lavagem de dinheiro.",
        contact: {
          email: "fernando.oliveira@mpf.mp.br",
        },
      },
    ],
    timeline: [
      {
        id: "timeline-3-1",
        date: "Janeiro 2020",
        title: "Descoberta de transações suspeitas",
        description: "Identificação de movimentações financeiras irregulares em criptomoedas",
        severity: "medium",
        completed: true,
      },
      {
        id: "timeline-3-2",
        date: "Junho 2020",
        title: "Operação Lava Jato Digital",
        description: "Deflagração da operação com prisões e bloqueio de ativos",
        severity: "critical",
        completed: true,
      },
    ],
    resources: [
      {
        id: "resource-3-1",
        title: "Lei de Lavagem de Dinheiro - 9.613/1998",
        url: "http://www.planalto.gov.br/ccivil_03/leis/l9613.htm",
        type: "law",
        description: "Lei que define crimes de lavagem de dinheiro",
        source: "Planalto",
      },
    ],
  },
]

// Function to get episode by ID with proper type safety
export function getEpisodeById(id: string | number): Episode | undefined {
  return episodes.find((episode) => episode.id.toString() === id.toString())
}

// Function to get episodes by category
export function getEpisodesByCategory(category: string): Episode[] {
  return episodes.filter((episode) => episode.category === category)
}

// Function to get episodes by status
export function getEpisodesByStatus(status: string): Episode[] {
  return episodes.filter((episode) => episode.status === status)
}

// Function to get episodes by threat level
export function getEpisodesByThreat(threat: string): Episode[] {
  return episodes.filter((episode) => episode.threat === threat)
}

// Episode analytics and user interaction interfaces
export interface EpisodeAnalytics {
  id: string
  episodeId: string | number
  views: number
  completions: number
  averageListenTime: number
  ratings: EpisodeRating[]
  bookmarks: EpisodeBookmark[]
  lastUpdated: string
}

export interface EpisodeRating {
  id: string
  userId: string
  episodeId: string | number
  rating: number // 1-5 stars
  review?: string
  timestamp: string
}

export interface EpisodeBookmark {
  id: string
  userId: string
  episodeId: string | number
  timestamp: number // seconds into the episode
  note?: string
  createdAt: string
}

export interface EpisodeComment {
  id: string
  userId: string
  episodeId: string | number
  content: string
  timestamp?: number // optional timestamp in episode
  parentId?: string // for replies
  likes: number
  createdAt: string
  updatedAt?: string
}

export interface EpisodePlaylist {
  id: string
  userId: string
  name: string
  description?: string
  episodeIds: (string | number)[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// Analytics functions
export function getEpisodeAnalytics(episodeId: string | number): EpisodeAnalytics | null {
  // This would typically fetch from a database
  // For now, return mock data
  return {
    id: `analytics-${episodeId}`,
    episodeId,
    views: Math.floor(Math.random() * 10000) + 1000,
    completions: Math.floor(Math.random() * 5000) + 500,
    averageListenTime: Math.floor(Math.random() * 3000) + 1200, // seconds
    ratings: [],
    bookmarks: [],
    lastUpdated: new Date().toISOString(),
  }
}

// Bookmark functions
export function createBookmark(episodeId: string | number, timestamp: number, note?: string): EpisodeBookmark {
  return {
    id: `bookmark-${Date.now()}`,
    userId: "current-user", // Would be actual user ID
    episodeId,
    timestamp,
    note,
    createdAt: new Date().toISOString(),
  }
}

// Rating functions
export function createRating(episodeId: string | number, rating: number, review?: string): EpisodeRating {
  return {
    id: `rating-${Date.now()}`,
    userId: "current-user", // Would be actual user ID
    episodeId,
    rating,
    review,
    timestamp: new Date().toISOString(),
  }
}

// Playlist functions
export function createPlaylist(name: string, description?: string): EpisodePlaylist {
  return {
    id: `playlist-${Date.now()}`,
    userId: "current-user", // Would be actual user ID
    name,
    description,
    episodeIds: [],
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Search and recommendation functions
export function searchEpisodes(query: string): Episode[] {
  const lowercaseQuery = query.toLowerCase()
  return episodes.filter(
    (episode) =>
      episode.title.toLowerCase().includes(lowercaseQuery) ||
      episode.description.toLowerCase().includes(lowercaseQuery) ||
      episode.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      episode.category?.toLowerCase().includes(lowercaseQuery),
  )
}

export function getRecommendedEpisodes(currentEpisodeId: string | number, limit = 3): Episode[] {
  const currentEpisode = getEpisodeById(currentEpisodeId)
  if (!currentEpisode) return episodes.slice(0, limit)

  // Simple recommendation based on category and threat level
  const recommended = episodes
    .filter((ep) => ep.id !== currentEpisodeId)
    .sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // Same category gets higher score
      if (a.category === currentEpisode.category) scoreA += 3
      if (b.category === currentEpisode.category) scoreB += 3

      // Same threat level gets medium score
      if (a.threat === currentEpisode.threat) scoreA += 2
      if (b.threat === currentEpisode.threat) scoreB += 2

      // Similar tags get lower score
      const aTagMatch = a.tags?.some((tag) => currentEpisode.tags?.includes(tag)) ? 1 : 0
      const bTagMatch = b.tags?.some((tag) => currentEpisode.tags?.includes(tag)) ? 1 : 0
      scoreA += aTagMatch
      scoreB += bTagMatch

      return scoreB - scoreA
    })

  return recommended.slice(0, limit)
}
