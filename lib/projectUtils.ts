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
