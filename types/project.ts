import type { EpisodeStatus, ThreatLevel } from "@/types"

export interface Project {
  id: string | number
  title: string
  date: string
  description: string
  fullDescription?: string
  status: EpisodeStatus
  threat: ThreatLevel
  audioUrl?: string | null
  duration?: string
  category?: string
  tags: string[]
  keyPoints?: string[]
  warnings?: string[]
  createdAt: string
  updatedAt: string
  transcript?: TranscriptSegment[]
  experts?: ProjectExpert[]
  timeline?: TimelineEvent[]
  resources?: ProjectResource[]
}

export interface TranscriptSegment {
  id: string
  timestamp: string
  speaker: string
  text: string
  type?: "narration" | "interview" | "expert" | "victim"
}

export interface ProjectExpert {
  id: string
  name: string
  role: string
  organization: string
  bio: string
  avatar?: string
  contact?: {
    email?: string
    phone?: string
    linkedin?: string
  }
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  completed: boolean
}

export interface ProjectResource {
  id: string
  title: string
  url: string
  type: "article" | "report" | "law" | "guide" | "video" | "document"
  description: string
  source: string
}

export interface ProjectFormData {
  title: string
  date: string
  description: string
  fullDescription?: string
  status: EpisodeStatus
  threat: ThreatLevel
  audioUrl?: string | null
  duration?: string
  category?: string
  tags: string[]
  keyPoints?: string[]
  warnings?: string[]
}
