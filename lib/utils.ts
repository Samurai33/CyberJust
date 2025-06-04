import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { EpisodeStatus, ThreatLevel, SeverityLevel } from "@/types"
import { EPISODE_STATUS, THREAT_LEVELS, SEVERITY_COLORS, AUDIO_MAP } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status: EpisodeStatus): string {
  return EPISODE_STATUS[status]?.color || "bg-gray-500/20 text-gray-400 border-gray-500/50"
}

export function getThreatColor(threat: ThreatLevel): string {
  return THREAT_LEVELS[threat]?.color || "bg-gray-500/20 text-gray-400 border-gray-500/50"
}

export function getSeverityColor(severity: SeverityLevel): string {
  return SEVERITY_COLORS[severity] || "bg-gray-500"
}

export function getAudioUrl(episodeId: string | number): string | null {
  return AUDIO_MAP[episodeId] || null
}

export function formatTime(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR")
}

export function generateId(prefix = ""): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function sanitizeHtml(html: string): string {
  const div = document.createElement("div")
  div.textContent = html
  return div.innerHTML
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

export function calculateCompletionRate(views: number, completions: number): number {
  return views > 0 ? (completions / views) * 100 : 0
}

export function calculateEngagementScore(completionRate: number, averageListenTime: number): number {
  return Math.round((completionRate + (averageListenTime / 3600) * 100) / 2)
}
