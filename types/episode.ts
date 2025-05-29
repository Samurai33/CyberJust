// Consolidação de todas as interfaces relacionadas a episódios
export interface TranscriptEntry {
  timestamp: string
  speaker: string
  text: string
  type: "narration" | "expert" | "victim"
}

export interface Episode {
  id: string
  title: string
  description: string
  date: string
  audioUrl: string | null
  imageUrl: string
  status: "AGENDADO" | "ATIVO" | "ARQUIVADO" | "INATIVO" | "EM BREVE"
  threat?: "ALTO" | "MÉDIO" | "BAIXO"
  duration?: string
  category?: string
  tags?: string[]
  transcript?: TranscriptEntry[]
}

export interface EpisodeProgress {
  episodeId: string
  currentTime: number
  duration: number
  completed: boolean
  lastPlayed: Date
}

export interface EpisodeRating {
  episodeId: string
  rating: number
  review?: string
  userId?: string
}

export interface EpisodeNotes {
  episodeId: string
  notes: string
  timestamp: number
  userId?: string
}

// Tipos para filtros e ordenação
export type EpisodeStatus = Episode["status"]
export type ThreatLevel = NonNullable<Episode["threat"]>
export type SortOption = "date" | "title" | "duration" | "threat"
export type SortDirection = "asc" | "desc"
