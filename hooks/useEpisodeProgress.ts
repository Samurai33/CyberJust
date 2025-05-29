"use client"

import { useState, useEffect, useCallback } from "react"

interface EpisodeProgress {
  episodeId: string
  currentTime: number
  duration: number
  completed: boolean
  lastPlayed: Date
}

export function useEpisodeProgress() {
  const [progress, setProgress] = useState<Record<string, EpisodeProgress>>({})

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("cyberjustica-progress")
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach((key) => {
          if (parsed[key].lastPlayed) {
            parsed[key].lastPlayed = new Date(parsed[key].lastPlayed)
          }
        })
        setProgress(parsed)
      } catch (error) {
        console.error("Failed to load episode progress:", error)
      }
    }
  }, [])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cyberjustica-progress", JSON.stringify(progress))
  }, [progress])

  const updateProgress = useCallback((episodeId: string, currentTime: number, duration: number) => {
    setProgress((prev) => ({
      ...prev,
      [episodeId]: {
        episodeId,
        currentTime,
        duration,
        completed: currentTime / duration > 0.9, // Consider 90% as completed
        lastPlayed: new Date(),
      },
    }))
  }, [])

  const getProgress = useCallback(
    (episodeId: string): EpisodeProgress | null => {
      return progress[episodeId] || null
    },
    [progress],
  )

  const markAsCompleted = useCallback((episodeId: string) => {
    setProgress((prev) => ({
      ...prev,
      [episodeId]: {
        ...prev[episodeId],
        completed: true,
        lastPlayed: new Date(),
      },
    }))
  }, [])

  const resetProgress = useCallback((episodeId: string) => {
    setProgress((prev) => {
      const newProgress = { ...prev }
      delete newProgress[episodeId]
      return newProgress
    })
  }, [])

  const getRecentlyPlayed = useCallback(
    (limit = 5): EpisodeProgress[] => {
      return Object.values(progress)
        .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
        .slice(0, limit)
    },
    [progress],
  )

  const getCompletedEpisodes = useCallback((): EpisodeProgress[] => {
    return Object.values(progress).filter((p) => p.completed)
  }, [progress])

  return {
    updateProgress,
    getProgress,
    markAsCompleted,
    resetProgress,
    getRecentlyPlayed,
    getCompletedEpisodes,
    allProgress: progress,
  }
}
