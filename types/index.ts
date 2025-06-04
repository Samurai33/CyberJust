export interface Episode {
  id: number | string
  title: string
  date: string
  description: string
  status: EpisodeStatus
  threat: ThreatLevel
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

export type EpisodeStatus = "ATIVO" | "ARQUIVADO" | "RESOLVIDO" | "AGENDADO"
export type ThreatLevel = "CRÍTICO" | "ALTO" | "MÉDIO" | "BAIXO"
export type SeverityLevel = "critical" | "high" | "medium" | "low"

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
  severity: SeverityLevel
  completed: boolean
}

export interface Statistic {
  id: string
  label: string
  value: string
  description: string
  trend?: "up" | "down" | "stable"
}

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
  rating: number
  review?: string
  timestamp: string
}

export interface EpisodeBookmark {
  id: string
  userId: string
  episodeId: string | number
  timestamp: number
  note?: string
  createdAt: string
}

export interface AudioState {
  currentEpisode: Episode | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
  isPlayerExpanded: boolean
  error: string | null
  playbackHistory: Episode[]
}

export interface UIState {
  glitchText: string
  mousePosition: { x: number; y: number }
  activeEpisode: number | null
  selectedEpisodeModal: Episode | null
  selectedLuluModal: boolean
  episodeFilters: {
    search: string
    status: string
    threat: string
    category: string
  }
}
