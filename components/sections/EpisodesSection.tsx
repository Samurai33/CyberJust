"use client"

import { Play, Download, Share2, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUI } from "@/contexts/UIContext"
import { useAudio } from "@/contexts/AudioContext"

interface Episode {
  id: number | string
  title: string
  date: string
  description: string
  status: string
  threat: string
  audioUrl?: string | null
  duration?: string
}

interface EpisodesSectionProps {
  episodes: Episode[]
}

export function EpisodesSection({ episodes }: EpisodesSectionProps) {
  const { activeEpisode, setActiveEpisode, setSelectedEpisodeModal, setSelectedLuluModal } = useUI()
  const { playEpisode, isLoading, error, isEpisodePlaying, togglePlayPause, currentEpisode } = useAudio()

  const getAudioUrl = (episode: Episode): string | null => {
    // Map specific episodes to their audio files
    const audioMap: Record<string | number, string> = {
      3: "/audio/namoral-combating-digital-corruption-networks.mp3",
      7: "/audio/brasil-fraudes-digitais.mp3",
    }

    // Return mapped audio URL or null
    return audioMap[episode.id] || null
  }

  const handlePlayEpisode = (episode: Episode) => {
    const audioUrl = getAudioUrl(episode)
    const episodeWithAudio = {
      ...episode,
      audioUrl: audioUrl,
    }

    // If this episode is currently playing, toggle play/pause
    if (isEpisodePlaying(episode.id)) {
      togglePlayPause()
    } else {
      // Otherwise, play the new episode
      playEpisode(episodeWithAudio)
    }
  }

  return (
    <section id="casos" className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-red-400 to-cyan-500 bg-clip-text text-transparent">
              CASOS EM DESTAQUE
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Investigações digitais em andamento</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {episodes.map((episode, index) => {
            const isCurrentlyPlaying = isEpisodePlaying(episode.id)
            const hasAudio = getAudioUrl(episode) !== null

            return (
              <Card
                key={`episode-${episode.id}`}
                className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm cursor-pointer"
                onClick={() => setActiveEpisode(activeEpisode === index ? null : index)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-800 text-cyan-400 font-mono">
                        EP {episode.id}
                      </Badge>
                      <Badge
                        className={`font-mono text-xs ${
                          episode.status === "ATIVO"
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : episode.status === "AGENDADO"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                              : episode.status === "RESOLVIDO"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                        }`}
                      >
                        {episode.status}
                      </Badge>
                      {isCurrentlyPlaying && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs animate-pulse">
                          REPRODUZINDO
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`font-mono text-xs ${
                          episode.threat === "CRÍTICO"
                            ? "bg-red-500/20 text-red-400 border-red-500/50"
                            : episode.threat === "ALTO"
                              ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                        }`}
                      >
                        {episode.threat}
                      </Badge>
                      <span className="text-sm text-gray-500 font-mono">{episode.date}</span>
                    </div>
                  </div>
                  <CardTitle
                    className="group-hover:text-red-400 transition-colors font-mono cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (episode.id === 6) {
                        setSelectedLuluModal(true)
                      } else {
                        setSelectedEpisodeModal(episode)
                      }
                    }}
                  >
                    {episode.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors mb-4">
                    {episode.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className={`${
                        hasAudio
                          ? isCurrentlyPlaying
                            ? "bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500"
                            : "bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
                          : "bg-gray-600 hover:bg-gray-500 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (hasAudio) {
                          handlePlayEpisode(episode)
                        }
                      }}
                      disabled={isLoading || !hasAudio}
                    >
                      {isLoading && currentEpisode?.id === episode.id ? (
                        <div className="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : isCurrentlyPlaying ? (
                        <Pause className="w-3 h-3 mr-1" />
                      ) : (
                        <Play className="w-3 h-3 mr-1" />
                      )}
                      {!hasAudio
                        ? "SEM ÁUDIO"
                        : isLoading && currentEpisode?.id === episode.id
                          ? "CARREGANDO..."
                          : isCurrentlyPlaying
                            ? "PAUSAR"
                            : "REPRODUZIR"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:text-white"
                      disabled={!hasAudio}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      BAIXAR
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:text-white">
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {error && currentEpisode?.id === episode.id && (
                    <div className="mt-2 text-xs text-red-400 font-mono flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
