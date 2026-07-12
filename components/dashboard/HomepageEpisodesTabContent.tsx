"use client"

import { Plus, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EpisodeBadge } from "@/components/ui/episode-badge"
import { episodes } from "@/data/episodes"
import type { Episode } from "@/types"

interface HomepageEpisodesTabContentProps {
  onConvertEpisodeToProject: (episode: Episode) => void
}

export function HomepageEpisodesTabContent({ onConvertEpisodeToProject }: HomepageEpisodesTabContentProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {episodes.map((episode) => (
        <Card
          key={episode.id}
          className="bg-gray-900 border-gray-700 hover:border-cyan-500/50 transition-all duration-300 group"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <EpisodeBadge status={episode.status} />
                  <EpisodeBadge variant="threat" threat={episode.threat} showIcon />
                </div>
                <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                  {episode.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {episode.date}
                  </div>
                  {episode.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {episode.duration}
                    </div>
                  )}
                  {episode.category && <span>{episode.category}</span>}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-gray-300 text-sm line-clamp-2">{episode.description}</p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onConvertEpisodeToProject(episode)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                <Plus className="w-3 h-3 mr-1" />
                IMPORTAR PARA DASHBOARD
              </Button>
            </div>

            {/* Tags */}
            {episode.tags && episode.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {episode.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {tag}
                  </Badge>
                ))}
                {episode.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    +{episode.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
