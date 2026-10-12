"use client"

import { Play, Pause, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudio } from "@/contexts/AudioContext"
import { cn } from "@/lib/utils"
import type { Episode } from "@/types"

interface EpisodeListenButtonProps {
  episode: Episode
  size?: "sm" | "lg"
  className?: string
}

/** The one play/pause control for an episode, used on every surface. */
export function EpisodeListenButton({ episode, size = "lg", className }: EpisodeListenButtonProps) {
  const { playEpisode, currentEpisode, isPlaying, isLoading, error } = useAudio()

  if (!episode.audioUrl) {
    return (
      <Button size={size} disabled className={cn("bg-gray-700 text-gray-300", className)}>
        EM BREVE
      </Button>
    )
  }

  const isCurrent = currentEpisode?.id === episode.id
  const playing = isCurrent && isPlaying
  const loading = isCurrent && isLoading
  const iconClass = size === "sm" ? "w-3 h-3 mr-1" : "w-5 h-5 mr-2"

  return (
    <div className="flex flex-col gap-1">
      <Button
        size={size}
        onClick={() => playEpisode(episode)}
        aria-pressed={playing}
        className={cn(
          playing
            ? "bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500"
            : "bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500",
          className,
        )}
      >
        {loading ? (
          <Loader2 className={cn(iconClass, "animate-spin")} />
        ) : playing ? (
          <Pause className={iconClass} />
        ) : (
          <Play className={iconClass} />
        )}
        {loading ? "CARREGANDO..." : playing ? "PAUSAR" : isCurrent ? "CONTINUAR" : "OUVIR"}
      </Button>
      {isCurrent && error && (
        <p role="alert" className="text-xs text-red-400 font-mono">
          {error}
        </p>
      )}
    </div>
  )
}
