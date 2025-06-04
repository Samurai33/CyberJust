import type { EpisodeStatus, ThreatLevel, SeverityLevel } from "@/types"

export const EPISODE_STATUS: Record<EpisodeStatus, { label: string; color: string }> = {
  ATIVO: { label: "Ativo", color: "bg-green-500/20 text-green-400 border-green-500/50" },
  ARQUIVADO: { label: "Arquivado", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
  RESOLVIDO: { label: "Resolvido", color: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
  AGENDADO: { label: "Agendado", color: "bg-purple-500/20 text-purple-400 border-purple-500/50" },
}

export const THREAT_LEVELS: Record<ThreatLevel, { label: string; color: string }> = {
  CRÍTICO: { label: "Crítico", color: "bg-red-500/20 text-red-400 border-red-500/50" },
  ALTO: { label: "Alto", color: "bg-orange-500/20 text-orange-400 border-orange-500/50" },
  MÉDIO: { label: "Médio", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
  BAIXO: { label: "Baixo", color: "bg-green-500/20 text-green-400 border-green-500/50" },
}

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
}

export const AUDIO_MAP: Record<string | number, string> = {
  3: "/audio/namoral-combating-digital-corruption-networks.mp3",
  7: "/audio/brasil-fraudes-digitais.mp3",
}

export const NAVIGATION_ITEMS = [
  { label: "CASOS", href: "#casos" },
  { label: "PROTOCOLOS", href: "#protocolos" },
  { label: "ESPECIALISTAS", href: "#especialistas" },
  { label: "PROTEÇÃO", href: "#proteção" },
  { label: "DENÚNCIAS", href: "#denúncias" },
] as const

export const CRIME_TYPES = [
  {
    title: "FRAUDES FINANCEIRAS",
    desc: "Golpes bancários e estelionato digital",
    threat: "CRÍTICO" as ThreatLevel,
  },
  {
    title: "ROUBO DE DADOS",
    desc: "Uso indevido de informações pessoais",
    threat: "ALTO" as ThreatLevel,
  },
  {
    title: "CRIMES CONTRA DIGNIDADE",
    desc: "Violações da intimidade e dignidade sexual",
    threat: "ALTO" as ThreatLevel,
  },
  {
    title: "ALICIAMENTO ONLINE",
    desc: "Predadores digitais em redes sociais",
    threat: "CRÍTICO" as ThreatLevel,
  },
  {
    title: "GOLPES EM RELACIONAMENTOS",
    desc: "Fraudes em aplicativos de encontros",
    threat: "MÉDIO" as ThreatLevel,
  },
] as const

export const PROTECTION_TIPS = [
  {
    title: "FORTALEÇA SUAS SENHAS",
    description:
      "Utilize senhas fortes e únicas para cada serviço, preferencialmente com gerenciadores de senha. Ative a autenticação em dois fatores sempre que possível.",
  },
  {
    title: "PROTEJA SEUS DADOS",
    description:
      "Compartilhe informações pessoais apenas em sites seguros (https://). Evite fornecer dados sensíveis em redes públicas.",
  },
  {
    title: "IDENTIFIQUE TENTATIVAS DE GOLPE",
    description:
      "Desconfie de ofertas imperdíveis, mensagens urgentes solicitando dados ou links suspeitos. Verifique sempre a legitimidade.",
  },
  {
    title: "SAIBA COMO DENUNCIAR",
    description:
      "Utilize os canais oficiais: delegacias especializadas, SaferNet, ou o portal de denúncias do Ministério Público.",
  },
] as const

export const EXPERTS = [
  {
    name: "Diego Barbiero",
    role: "Coordenador do CyberGAECO",
    description:
      "Diego traz sua vasta experiência em investigações de crimes digitais organizados e compartilha casos emblemáticos que ajudou a solucionar.",
    status: "ATIVO",
    clearance: "NÍVEL 5",
  },
  {
    name: "Thiago Cardoso Silva",
    role: "Delegado do GAECO",
    description:
      "Especializado em crimes cibernéticos, Thiago detalha os desafios das investigações digitais e as novas técnicas utilizadas pelos criminosos.",
    status: "ATIVO",
    clearance: "NÍVEL 4",
  },
  {
    name: "Wilson Leite da Silva Filho",
    role: "Chefe da Divisão de Informática Forense",
    description:
      "Wilson explica as complexidades técnicas da coleta de provas digitais e como a tecnologia forense evolui para combater o crime.",
    status: "ATIVO",
    clearance: "NÍVEL 5",
  },
] as const

export const STATS = [
  { value: "50+", label: "CASOS ANALISADOS", color: "cyan" },
  { value: "100K+", label: "USUÁRIOS PROTEGIDOS", color: "red" },
  { value: "20+", label: "ESPECIALISTAS", color: "purple" },
  { value: "3", label: "ANOS ATIVOS", color: "green" },
] as const
