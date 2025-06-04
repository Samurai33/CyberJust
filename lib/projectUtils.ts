import type { ProjectStatus, ProjectPriority } from "@/types/project"

export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case "PLANEJAMENTO":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50"
    case "EM_ANDAMENTO":
      return "bg-green-500/20 text-green-400 border-green-500/50"
    case "PAUSADO":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
    case "CONCLUIDO":
      return "bg-purple-500/20 text-purple-400 border-purple-500/50"
    case "CANCELADO":
      return "bg-red-500/20 text-red-400 border-red-500/50"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50"
  }
}

export function getPriorityColor(priority: ProjectPriority): string {
  switch (priority) {
    case "CRITICA":
      return "bg-red-500/20 text-red-400 border-red-500/50"
    case "ALTA":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50"
    case "MEDIA":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
    case "BAIXA":
      return "bg-green-500/20 text-green-400 border-green-500/50"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50"
  }
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return "bg-green-500"
  if (progress >= 60) return "bg-blue-500"
  if (progress >= 40) return "bg-yellow-500"
  if (progress >= 20) return "bg-orange-500"
  return "bg-red-500"
}

export const PROJECT_CATEGORIES = [
  "Investigação",
  "Análise Forense",
  "Prevenção",
  "Educação",
  "Desenvolvimento",
  "Pesquisa",
  "Operação",
  "Treinamento",
] as const

export const PROJECT_STATUSES: ProjectStatus[] = ["PLANEJAMENTO", "EM_ANDAMENTO", "PAUSADO", "CONCLUIDO", "CANCELADO"]

export const PROJECT_PRIORITIES: ProjectPriority[] = ["BAIXA", "MEDIA", "ALTA", "CRITICA"]
