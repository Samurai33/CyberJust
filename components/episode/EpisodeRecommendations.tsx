"use client"

import { Play, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getRecommendedEpisodes } from "@/data/episodes"
import { useAudio } from "@/contexts/AudioContext"

interface EpisodeRecommendationsProps {
  currentEpisodeId: string | number
  limit?: number
}

export function EpisodeRecommendations({ currentEpisodeId, limit = 3 }: EpisodeRecommendationsProps) {
  const { playEpisode } = useAudio()
  const recommendations = getRecommendedEpisodes(currentEpisodeId, limit)

  const getAudioUrl = (episodeId: string | number): string | null => {
    const audioMap: Record<string | number, string> = {
      3: "/audio/namoral-combating-digital-corruption-networks.mp3",
      7: "/audio/brasil-fraudes-digitais.mp3",
    }
    return audioMap[episodeId] || null
  }

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case "CRÍTICO":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "ALTO":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "MÉDIO":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "BAIXO":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Nenhuma recomendação disponível no momento</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-cyan-400">Episódios Recomendados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((episode) => {
          const hasAudio = getAudioUrl(episode.id) !== null

          return (
            <Card key={episode.id} className="bg-gray-800 border-gray-600 hover:border-cyan-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      EP {episode.id}
                    </Badge>
                    <Badge className={`text-xs ${getThreatColor(episode.threat)}`}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {episode.threat}
                    </Badge>
                  </div>
                  {episode.duration && (
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {episode.duration}
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-white mb-2 line-clamp-2">{episode.title}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{episode.description}</p>

                <div className="flex items-center gap-2">
                  {hasAudio && (
                    <Button
                      size="sm"
                      onClick={() =>
                        playEpisode({
                          ...episode,
                          audioUrl: getAudioUrl(episode.id),
                        })
                      }
                      className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Ouvir
                    </Button>
                  )}

                  <Button size="sm" variant="outline" asChild className="border-gray-600 text-gray-300">
                    <Link href={`/episodes/${episode.id}`}>Ver Detalhes</Link>
                  </Button>
                </div>

                {episode.category && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                      {episode.category}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        <div className="text-center pt-2">
          <Button variant="outline" asChild className="border-gray-600 text-gray-300">
            <Link href="/episodes">Ver Todos os Episódios</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
