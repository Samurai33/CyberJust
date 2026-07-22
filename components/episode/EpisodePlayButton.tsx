"use client"

import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudio } from "@/contexts/AudioContext"
import type { Episode } from "@/types"

interface EpisodePlayButtonProps {
  episode: Episode
}

export function EpisodePlayButton({ episode }: EpisodePlayButtonProps) {
  const { playEpisode, isEpisodePlaying, isLoading } = useAudio()

  if (!episode.audioUrl) {
    return null
  }

  const isCurrentlyPlaying = isEpisodePlaying(episode.id)

  return (
    <Button
      size="lg"
      onClick={() => playEpisode(episode)}
      disabled={isLoading}
      className={`${
        isCurrentlyPlaying
          ? "bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500"
          : "bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
      }`}
    >
      {isLoading ? (
        <div className="w-5 h-5 mr-2 border border-white border-t-transparent rounded-full animate-spin" />
      ) : isCurrentlyPlaying ? (
        <Pause className="w-5 h-5 mr-2" />
      ) : (
        <Play className="w-5 h-5 mr-2" />
      )}
      {isCurrentlyPlaying ? "Reproduzindo..." : "Ouvir Episódio"}
    </Button>
  )
}
