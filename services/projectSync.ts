import type { Episode } from "@/types"
import type { Project, ProjectFormData } from "@/types/project"
import { episodes } from "@/data/episodes"
import { generateId } from "@/lib/utils"

// Converte um episódio para o formato de projeto
export function episodeToProject(episode: Episode): Project {
  return {
    id: episode.id,
    title: episode.title,
    date: episode.date,
    description: episode.description,
    fullDescription: episode.fullDescription,
    status: episode.status,
    threat: episode.threat,
    audioUrl: episode.audioUrl,
    duration: episode.duration,
    category: episode.category,
    tags: episode.tags || [],
    keyPoints: episode.keyPoints,
    warnings: episode.warnings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transcript: episode.transcript,
    experts: episode.experts,
    timeline: episode.timeline,
    resources: episode.resources,
  }
}

// Sincroniza os projetos com os episódios existentes
export function syncProjectsWithEpisodes(projects: Project[]): Project[] {
  // Mapeia os IDs dos projetos existentes
  const projectIds = new Set(projects.map((p) => String(p.id)))

  // Adiciona episódios que não existem como projetos
  const newProjects = episodes.filter((episode) => !projectIds.has(String(episode.id))).map(episodeToProject)

  // Retorna a lista combinada
  return [...projects, ...newProjects]
}

// Cria um novo projeto com ID único
export function createNewProject(data: ProjectFormData): Project {
  // Gera um ID único que não conflita com os episódios existentes
  const episodeIds = new Set(episodes.map((e) => String(e.id)))
  let newId = generateId("proj-")

  // Garante que o ID é único
  while (episodeIds.has(newId)) {
    newId = generateId("proj-")
  }

  return {
    id: newId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: data.tags || [],
  }
}

// Combina um episódio estático com o projeto persistido correspondente
// (dados do dashboard, guardados em localStorage). Um projeto pode
// atualizar a maioria dos campos - incluindo um audioUrl funcional -, mas
// nunca pode conceder áudio a um episódio cujo dado canônico diz que não
// existe (audioUrl: null). Sem essa trava, uma entrada desatualizada em
// localStorage (ex.: um caminho antigo pré-jsDelivr) sobrescrevia
// silenciosamente o audioUrl real e mostrava um botão "Reproduzir"
// habilitado que dava 404 (#105/#132) - syncProjectsWithEpisodes só
// adiciona episódios ausentes, nunca corrige um projeto já existente.
export function mergeEpisodeWithProject(episode: Episode, project: Project | undefined): Episode {
  if (!project) return episode

  const audioUrl = episode.audioUrl === null ? null : (project.audioUrl ?? episode.audioUrl)

  return { ...episode, ...project, audioUrl }
}
