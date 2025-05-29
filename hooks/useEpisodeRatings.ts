"use client"

import { useState, useEffect, useCallback } from "react"

interface EpisodeRating {
  episodeId: string
  rating: number // 1-5 stars
  review?: string
  createdAt: Date
  updatedAt: Date
}

export function useEpisodeRatings() {
  const [ratings, setRatings] = useState<Record<string, EpisodeRating>>({})

  // Load ratings from localStorage on mount
  useEffect(() => {
    const savedRatings = localStorage.getItem("cyberjustica-ratings")
    if (savedRatings) {
      try {
        const parsed = JSON.parse(savedRatings)
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach((key) => {
          parsed[key].createdAt = new Date(parsed[key].createdAt)
          parsed[key].updatedAt = new Date(parsed[key].updatedAt)
        })
        setRatings(parsed)
      } catch (error) {
        console.error("Failed to load episode ratings:", error)
      }
    }
  }, [])

  // Save ratings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("cyberjustica-ratings", JSON.stringify(ratings))
  }, [ratings])

  const rateEpisode = useCallback((episodeId: string, rating: number, review?: string) => {
    setRatings((prev) => ({
      ...prev,
      [episodeId]: {
        episodeId,
        rating,
        review,
        createdAt: prev[episodeId]?.createdAt || new Date(),
        updatedAt: new Date(),
      },
    }))
  }, [])

  const getRating = useCallback(
    (episodeId: string): EpisodeRating | null => {
      return ratings[episodeId] || null
    },
    [ratings],
  )

  const removeRating = useCallback((episodeId: string) => {
    setRatings((prev) => {
      const newRatings = { ...prev }
      delete newRatings[episodeId]
      return newRatings
    })
  }, [])

  const getAverageRating = useCallback((): number => {
    const allRatings = Object.values(ratings)
    if (allRatings.length === 0) return 0
    const sum = allRatings.reduce((acc, rating) => acc + rating.rating, 0)
    return sum / allRatings.length
  }, [ratings])

  const getRatedEpisodes = useCallback((): EpisodeRating[] => {
    return Object.values(ratings).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [ratings])

  return {
    rateEpisode,
    getRating,
    removeRating,
    getAverageRating,
    getRatedEpisodes,
    allRatings: ratings,
  }
}
