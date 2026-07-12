import type { MetadataRoute } from "next"
import { episodes } from "@/data/episodes"
import { SITE_URL } from "@/lib/constants"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/episodes`, changeFrequency: "weekly", priority: 0.8 },
  ]

  const episodeRoutes: MetadataRoute.Sitemap = episodes.map((episode) => ({
    url: `${SITE_URL}/episodes/${episode.id}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  return [...staticRoutes, ...episodeRoutes]
}
