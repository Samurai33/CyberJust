"use client"

import { Play, Download, Share2, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EpisodeBadge } from "@/components/ui/episode-badge"
import { useUI } from "@/contexts/UIContext"
import { useAudio } from "@/contexts/AudioContext"
import { useDashboard } from "@/contexts/DashboardContext"
import { getAudioUrl } from "@/lib/utils"
import type { Episode } from "@/types"

interface EpisodesSectionProps {
  episodes: Episode[]
}

export function EpisodesSection({ episodes: originalEpisodes }: EpisodesSectionProps) {
  const { activeEpisode, setActiveEpisode, setSelectedEpisodeModal, setSelectedLuluModal } = useUI()
  const { playEpisode, isLoading, error, isEpisodePlaying, togglePlayPause, currentEpisode } = useAudio()
  const { projects } = useDashboard()

  // Combinar episódios originais com projetos do dashboard
  // Priorizar projetos do dashboard se tiverem o mesmo ID
  const projectMap = new Map(projects.map((p) => [String(p.id), p]))

  const episodes = originalEpisodes.map((episode) => {
    const project = projectMap.get(String(episode.id))
    return project ? { ...episode, ...project } : episode
  })

  const handlePlayEpisode = (episode: Episode) => {
    const audioUrl = getAudioUrl(episode.id)
    const episodeWithAudio = {
      ...episode,
      audioUrl: audioUrl,
    }

    if (isEpisodePlaying(episode.id)) {
      togglePlayPause()
    } else {
      playEpisode(episodeWithAudio)
    }
  }

  const handleEpisodeClick = (episode: Episode) => {
    if (episode.id === 6) {
      setSelectedLuluModal(true)
    } else {
      setSelectedEpisodeModal(episode)
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
            const hasAudio = getAudioUrl(episode.id) !== null

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
                      <EpisodeBadge status={episode.status} variant="status" />
                      {isCurrentlyPlaying && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs animate-pulse">
                          REPRODUZINDO
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <EpisodeBadge threat={episode.threat} variant="threat" showIcon />
                      <span className="text-sm text-gray-500 font-mono">{episode.date}</span>
                    </div>
                  </div>
                  <CardTitle
                    className="group-hover:text-red-400 transition-colors font-mono cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEpisodeClick(episode)
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
                        <LoadingSpinner size="sm" className="mr-1" />
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
