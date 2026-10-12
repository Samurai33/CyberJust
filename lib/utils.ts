import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { EpisodeStatus, ThreatLevel, SeverityLevel } from "@/types"
import { EPISODE_STATUS, THREAT_LEVELS, SEVERITY_COLORS } from "./constants"

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

export function formatTime(time: number): string {
  if (!Number.isFinite(time) || time < 0) return "0:00"
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
