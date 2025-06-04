import type { EpisodeAnalytics, EpisodeRating, EpisodeBookmark } from "@/types"
import { generateId } from "@/lib/utils"

export function getEpisodeAnalytics(episodeId: string | number): EpisodeAnalytics {
  // Mock data - in a real app, this would fetch from an API
  const views = Math.floor(Math.random() * 10000) + 1000
  const completions = Math.floor(Math.random() * 5000) + 500
  const averageListenTime = Math.floor(Math.random() * 3000) + 1200

  return {
    id: generateId("analytics-"),
    episodeId,
    views,
    completions,
    averageListenTime,
    ratings: [],
    bookmarks: [],
    lastUpdated: new Date().toISOString(),
  }
}

export function createRating(episodeId: string | number, rating: number, review?: string): EpisodeRating {
  return {
    id: generateId("rating-"),
    userId: "current-user",
    episodeId,
    rating,
    review,
    timestamp: new Date().toISOString(),
  }
}

export function createBookmark(episodeId: string | number, timestamp: number, note?: string): EpisodeBookmark {
  return {
    id: generateId("bookmark-"),
    userId: "current-user",
    episodeId,
    timestamp,
    note,
    createdAt: new Date().toISOString(),
  }
}
