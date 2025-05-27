"use client"

import { Play, Download, Share2 } from "lucide-react"
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
  const { playEpisode, isLoading } = useAudio()

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
          {episodes.map((episode, index) => (
            <Card
              key={index}
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
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors mb-4">{episode.description}</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      playEpisode(episode)
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 mr-1" />
                    )}
                    {isLoading ? "CARREGANDO..." : "REPRODUZIR"}
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:text-white">
                    <Download className="w-3 h-3 mr-1" />
                    BAIXAR
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:text-white">
                    <Share2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
