"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback } from "react"
import { type EpisodeRating, createRating } from "@/data/episodes"

interface RatingState {
  ratings: EpisodeRating[]
  isLoading: boolean
  error: string | null
}

type RatingAction =
  | { type: "SET_RATINGS"; payload: EpisodeRating[] }
  | { type: "ADD_RATING"; payload: EpisodeRating }
  | { type: "UPDATE_RATING"; payload: { id: string; updates: Partial<EpisodeRating> } }
  | { type: "REMOVE_RATING"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }

const initialState: RatingState = {
  ratings: [],
  isLoading: false,
  error: null,
}

function ratingReducer(state: RatingState, action: RatingAction): RatingState {
  switch (action.type) {
    case "SET_RATINGS":
      return { ...state, ratings: action.payload }
    case "ADD_RATING":
      return { ...state, ratings: [...state.ratings, action.payload] }
    case "UPDATE_RATING":
      return {
        ...state,
        ratings: state.ratings.map((r) => (r.id === action.payload.id ? { ...r, ...action.payload.updates } : r)),
      }
    case "REMOVE_RATING":
      return { ...state, ratings: state.ratings.filter((r) => r.id !== action.payload) }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false }
    default:
      return state
  }
}

interface RatingContextType extends RatingState {
  addRating: (episodeId: string | number, rating: number, review?: string) => void
  updateRating: (ratingId: string, updates: Partial<EpisodeRating>) => void
  removeRating: (ratingId: string) => void
  getEpisodeRatings: (episodeId: string | number) => EpisodeRating[]
  getAverageRating: (episodeId: string | number) => number
  getUserRating: (episodeId: string | number) => EpisodeRating | null
}

const RatingContext = createContext<RatingContextType | undefined>(undefined)

export function RatingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(ratingReducer, initialState)

  const addRating = useCallback((episodeId: string | number, rating: number, review?: string) => {
    const newRating = createRating(episodeId, rating, review)
    dispatch({ type: "ADD_RATING", payload: newRating })
  }, [])

  const updateRating = useCallback((ratingId: string, updates: Partial<EpisodeRating>) => {
    dispatch({ type: "UPDATE_RATING", payload: { id: ratingId, updates } })
  }, [])

  const removeRating = useCallback((ratingId: string) => {
    dispatch({ type: "REMOVE_RATING", payload: ratingId })
  }, [])

  const getEpisodeRatings = useCallback(
    (episodeId: string | number) => {
      return state.ratings.filter((r) => r.episodeId === episodeId)
    },
    [state.ratings],
  )

  const getAverageRating = useCallback(
    (episodeId: string | number) => {
      const episodeRatings = getEpisodeRatings(episodeId)
      if (episodeRatings.length === 0) return 0
      const sum = episodeRatings.reduce((acc, r) => acc + r.rating, 0)
      return sum / episodeRatings.length
    },
    [getEpisodeRatings],
  )

  const getUserRating = useCallback(
    (episodeId: string | number) => {
      return state.ratings.find((r) => r.episodeId === episodeId && r.userId === "current-user") || null
    },
    [state.ratings],
  )

  const value: RatingContextType = {
    ...state,
    addRating,
    updateRating,
    removeRating,
    getEpisodeRatings,
    getAverageRating,
    getUserRating,
  }

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>
}

export function useRatings() {
  const context = useContext(RatingContext)
  if (context === undefined) {
    throw new Error("useRatings must be used within a RatingProvider")
  }
  return context
}
