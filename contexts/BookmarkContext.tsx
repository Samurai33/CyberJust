"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback } from "react"
import { type EpisodeBookmark, createBookmark } from "@/data/episodes"

interface BookmarkState {
  bookmarks: EpisodeBookmark[]
  isLoading: boolean
  error: string | null
}

type BookmarkAction =
  | { type: "SET_BOOKMARKS"; payload: EpisodeBookmark[] }
  | { type: "ADD_BOOKMARK"; payload: EpisodeBookmark }
  | { type: "REMOVE_BOOKMARK"; payload: string }
  | { type: "UPDATE_BOOKMARK"; payload: { id: string; updates: Partial<EpisodeBookmark> } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }

const initialState: BookmarkState = {
  bookmarks: [],
  isLoading: false,
  error: null,
}

function bookmarkReducer(state: BookmarkState, action: BookmarkAction): BookmarkState {
  switch (action.type) {
    case "SET_BOOKMARKS":
      return { ...state, bookmarks: action.payload }
    case "ADD_BOOKMARK":
      return { ...state, bookmarks: [...state.bookmarks, action.payload] }
    case "REMOVE_BOOKMARK":
      return { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== action.payload) }
    case "UPDATE_BOOKMARK":
      return {
        ...state,
        bookmarks: state.bookmarks.map((b) => (b.id === action.payload.id ? { ...b, ...action.payload.updates } : b)),
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false }
    default:
      return state
  }
}

interface BookmarkContextType extends BookmarkState {
  addBookmark: (episodeId: string | number, timestamp: number, note?: string) => void
  removeBookmark: (bookmarkId: string) => void
  updateBookmark: (bookmarkId: string, updates: Partial<EpisodeBookmark>) => void
  getEpisodeBookmarks: (episodeId: string | number) => EpisodeBookmark[]
  hasBookmarkAtTime: (episodeId: string | number, timestamp: number, tolerance?: number) => boolean
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined)

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookmarkReducer, initialState)

  const addBookmark = useCallback((episodeId: string | number, timestamp: number, note?: string) => {
    const bookmark = createBookmark(episodeId, timestamp, note)
    dispatch({ type: "ADD_BOOKMARK", payload: bookmark })
  }, [])

  const removeBookmark = useCallback((bookmarkId: string) => {
    dispatch({ type: "REMOVE_BOOKMARK", payload: bookmarkId })
  }, [])

  const updateBookmark = useCallback((bookmarkId: string, updates: Partial<EpisodeBookmark>) => {
    dispatch({ type: "UPDATE_BOOKMARK", payload: { id: bookmarkId, updates } })
  }, [])

  const getEpisodeBookmarks = useCallback(
    (episodeId: string | number) => {
      return state.bookmarks.filter((b) => b.episodeId === episodeId).sort((a, b) => a.timestamp - b.timestamp)
    },
    [state.bookmarks],
  )

  const hasBookmarkAtTime = useCallback(
    (episodeId: string | number, timestamp: number, tolerance = 5) => {
      return state.bookmarks.some((b) => b.episodeId === episodeId && Math.abs(b.timestamp - timestamp) <= tolerance)
    },
    [state.bookmarks],
  )

  const value: BookmarkContextType = {
    ...state,
    addBookmark,
    removeBookmark,
    updateBookmark,
    getEpisodeBookmarks,
    hasBookmarkAtTime,
  }

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>
}

export function useBookmarks() {
  const context = useContext(BookmarkContext)
  if (context === undefined) {
    throw new Error("useBookmarks must be used within a BookmarkProvider")
  }
  return context
}
