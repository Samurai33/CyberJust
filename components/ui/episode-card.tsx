"use client"

import type { Episode } from "@/types/episode"
import { Badge } from "./badge"
import { formatDate, formatDuration } from "@/lib/formatters"

interface EpisodeCardProps {
  episode: Episode
  onClick?: () => void
  showThreat?: boolean
  compact?: boolean
}

export function EpisodeCard({ episode, onClick, showThreat = true, compact = false }: EpisodeCardProps) {
  return (
    <div
      className={`
        bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4
        hover:border-cyan-500/50 transition-all duration-300 cursor-pointer
        ${compact ? "p-3" : "p-4"}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-white mb-2 ${compact ? "text-sm" : "text-lg"}`}>{episode.title}</h3>
          <p className={`text-gray-400 mb-3 ${compact ? "text-xs" : "text-sm"}`}>{episode.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="status" value={episode.status}>
            {episode.status}
          </Badge>

          {showThreat && episode.threat && (
            <Badge variant="threat" value={episode.threat}>
              {episode.threat}
            </Badge>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {formatDate(episode.date)}
          {episode.duration && ` • ${formatDuration(episode.duration)}`}
        </div>
      </div>
    </div>
  )
}
