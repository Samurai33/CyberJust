// Consolidação de todas as funções de cor e estilo
export const statusColors = {
  ATIVO: "bg-green-500/20 text-green-400 border-green-500/50",
  AGENDADO: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  ARQUIVADO: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  INATIVO: "bg-red-500/20 text-red-400 border-red-500/50",
  "EM BREVE": "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
} as const

export const threatColors = {
  ALTO: "bg-red-500/20 text-red-400 border-red-500/50",
  MÉDIO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  BAIXO: "bg-green-500/20 text-green-400 border-green-500/50",
} as const

export const gradients = {
  primary: "bg-gradient-to-r from-red-500 to-cyan-600",
  secondary: "bg-gradient-to-r from-cyan-400 to-red-500",
  accent: "bg-gradient-to-r from-purple-500 to-pink-500",
  dark: "bg-gradient-to-r from-gray-800 to-gray-900",
  cyber: "bg-gradient-to-r from-green-400 to-blue-500",
} as const

export const animations = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
} as const

// Função utilitária para obter cor do status
export function getStatusColor(status: string): string {
  return statusColors[status as keyof typeof statusColors] || statusColors.INATIVO
}

// Função utilitária para obter cor da ameaça
export function getThreatColor(threat: string): string {
  return threatColors[threat as keyof typeof threatColors] || threatColors.BAIXO
}

// Função para combinar classes CSS
export function combineClasses(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}
