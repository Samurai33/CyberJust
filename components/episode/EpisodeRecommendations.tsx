"use client"

import { Play, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { allEpisodes, type Episode } from "@/data/episodes"
import { useAudio } from "@/contexts/AudioContext"

interface EpisodeRecommendationsProps {
  currentEpisodeId: string
  currentEpisode: Episode
}

export function EpisodeRecommendations({ currentEpisodeId, currentEpisode }: EpisodeRecommendationsProps) {
  const { playEpisode } = useAudio()

  // Simple recommendation algorithm based on category and tags
  const getRecommendations = (): Episode[] => {
    const recommendations = allEpisodes
      .filter((episode) => episode.id !== currentEpisodeId)
      .map((episode) => {
        let score = 0

        // Same category gets higher score
        if (episode.category === currentEpisode.category) {
          score += 3
        }

        // Shared tags get points
        const sharedTags = episode.tags?.filter((tag) => currentEpisode.tags?.includes(tag)) || []
        score += sharedTags.length * 2

        // Same threat level gets points
        if (episode.threat === currentEpisode.threat) {
          score += 1
        }

        return { episode, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.episode)

    return recommendations
  }

  const recommendations = getRecommendations()

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case "CRÍTICO":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "ALTO":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "MÉDIO":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white font-mono flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          EPISÓDIOS RELACIONADOS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma recomendação disponível</p>
          </div>
        ) : (
          recommendations.map((episode) => (
            <div
              key={episode.id}
              className="border border-gray-700 rounded-lg p-3 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-800 text-cyan-400 font-mono text-xs">
                    EP {episode.id}
                  </Badge>
                  <Badge className={`font-mono text-xs ${getThreatColor(episode.threat)}`}>{episode.threat}</Badge>
                </div>
                {episode.duration && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {episode.duration}
                  </div>
                )}
              </div>

              <h4 className="text-white font-mono text-sm mb-2 leading-tight">{episode.title}</h4>

              <p className="text-gray-400 text-xs mb-3 line-clamp-2">{episode.description}</p>

              {episode.category && (
                <div className="mb-3">
                  <Badge variant="outline" className="border-purple-500/50 text-purple-400 font-mono text-xs">
                    {episode.category}
                  </Badge>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => playEpisode(episode)}
                  className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500 flex-1"
                >
                  <Play className="w-3 h-3 mr-1" />
                  REPRODUZIR
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (window.location.href = `/episodes/${episode.id}`)}
                  className="border-gray-600 text-gray-400 hover:text-white"
                >
                  DETALHES
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
