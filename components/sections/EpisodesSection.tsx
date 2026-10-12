import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EpisodeBadge } from "@/components/ui/episode-badge"
import { EpisodeShareButton } from "@/components/episode/EpisodeShareButton"
import { EpisodeDownloadButton } from "@/components/episode/EpisodeDownloadButton"
import { EpisodeListenButton } from "@/components/episode/EpisodeListenButton"
import type { Episode } from "@/types"

interface EpisodesSectionProps {
  episodes: Episode[]
}

export function EpisodesSection({ episodes }: EpisodesSectionProps) {
  return (
    <section id="casos" className="py-20 px-6 scroll-mt-4">
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
          {episodes.map((episode) => (
            <Card
              key={episode.id}
              className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm"
            >
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-gray-800 text-cyan-400 font-mono">
                      EP {episode.id}
                    </Badge>
                    <EpisodeBadge status={episode.status} variant="status" />
                  </div>
                  <div className="flex items-center gap-2">
                    <EpisodeBadge threat={episode.threat} variant="threat" showIcon />
                    <span className="text-sm text-gray-500 font-mono">{episode.date}</span>
                  </div>
                </div>
                <CardTitle className="font-mono">
                  <Link
                    href={`/episodes/${episode.id}`}
                    className="group-hover:text-red-400 transition-colors hover:underline"
                  >
                    {episode.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors mb-4">{episode.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <EpisodeListenButton episode={episode} size="sm" />
                  <EpisodeDownloadButton
                    audioUrl={episode.audioUrl}
                    size="sm"
                    label="BAIXAR"
                    className="border-gray-600 text-gray-400 hover:text-white"
                  />
                  <EpisodeShareButton
                    episodeId={episode.id}
                    title={episode.title}
                    size="sm"
                    showLabel={false}
                    className="border-gray-600 text-gray-400 hover:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
            <Link href="/episodes">
              Ver Todos os Episódios
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
