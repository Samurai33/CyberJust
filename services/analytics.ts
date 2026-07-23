import type { EpisodeRating, EpisodeBookmark } from "@/types"
import { generateId } from "@/lib/utils"

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
