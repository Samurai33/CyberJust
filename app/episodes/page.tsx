"use client"

import { EpisodeCard } from "@/components/ui/episode-card"
import { gradients } from "@/lib/styles"
import { allEpisodes } from "@/content/episodes"
import { useRouter } from "next/navigation"

export default function EpisodesPage() {
  const router = useRouter()
  const filteredEpisodes = allEpisodes

  return (
    <div className={`min-h-screen ${gradients.dark}`}>
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8 text-white">All Episodes</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEpisodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              onClick={() => router.push(`/episodes/${episode.id}`)}
              showThreat={true}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
