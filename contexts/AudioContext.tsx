"use client"

import type React from "react"

import { createContext, useContext, useReducer, useRef, useCallback, useEffect } from "react"

interface Episode {
  id: number | string
  title: string
  date: string
  description: string
  status: string
  threat: string
  audioUrl?: string | null
  duration?: string
}

interface AudioState {
  currentEpisode: Episode | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
  isPlayerExpanded: boolean
}

type AudioAction =
  | { type: "SET_EPISODE"; payload: Episode }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_CURRENT_TIME"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_MUTED"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PLAYER_EXPANDED"; payload: boolean }
  | { type: "RESET_PLAYER" }

const initialState: AudioState = {
  currentEpisode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  isLoading: false,
  isPlayerExpanded: false,
}

function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case "SET_EPISODE":
      return { ...state, currentEpisode: action.payload }
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload }
    case "SET_CURRENT_TIME":
      return { ...state, currentTime: action.payload }
    case "SET_DURATION":
      return { ...state, duration: action.payload }
    case "SET_VOLUME":
      return { ...state, volume: action.payload }
    case "SET_MUTED":
      return { ...state, isMuted: action.payload }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_PLAYER_EXPANDED":
      return { ...state, isPlayerExpanded: action.payload }
    case "RESET_PLAYER":
      return { ...initialState, volume: state.volume }
    default:
      return state
  }
}

interface AudioContextType extends AudioState {
  playEpisode: (episode: Episode) => void
  togglePlayPause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  togglePlayerExpanded: () => void
  formatTime: (time: number) => string
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioReducer, initialState)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const startSimulatedPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      dispatch({ type: "SET_CURRENT_TIME", payload: state.currentTime + 1 })

      if (state.currentTime >= state.duration) {
        dispatch({ type: "SET_PLAYING", payload: false })
        dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, 1000)
  }, [state.currentTime, state.duration])

  const handleAudioError = useCallback((error: Event | Error, episode: Episode) => {
    console.error(`Failed to load audio for episode ${episode.id}:`, error)
    dispatch({ type: "SET_LOADING", payload: false })
    dispatch({ type: "SET_PLAYING", payload: false })
    dispatch({ type: "SET_DURATION", payload: 2730 })
    dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
  }, [])

  const playEpisode = useCallback(
    (episode: Episode) => {
      dispatch({ type: "SET_EPISODE", payload: episode })
      dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
      dispatch({ type: "SET_LOADING", payload: true })

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      if (!episode.audioUrl) {
        dispatch({ type: "SET_LOADING", payload: false })
        dispatch({ type: "SET_DURATION", payload: 2730 })
        dispatch({ type: "SET_PLAYING", payload: true })
        startSimulatedPlayback()
        return
      }

      const audio = new Audio(episode.audioUrl)
      audioRef.current = audio
      audio.volume = state.isMuted ? 0 : state.volume

      const handleError = (e: Event) => handleAudioError(e, episode)
      const handleLoadStart = () => dispatch({ type: "SET_LOADING", payload: true })
      const handleCanPlay = () => dispatch({ type: "SET_LOADING", payload: false })
      const handleLoadedMetadata = () => dispatch({ type: "SET_DURATION", payload: audio.duration })
      const handleTimeUpdate = () => dispatch({ type: "SET_CURRENT_TIME", payload: audio.currentTime })
      const handleEnded = () => {
        dispatch({ type: "SET_PLAYING", payload: false })
        dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
      }

      audio.addEventListener("error", handleError)
      audio.addEventListener("loadstart", handleLoadStart)
      audio.addEventListener("canplay", handleCanPlay)
      audio.addEventListener("loadedmetadata", handleLoadedMetadata)
      audio.addEventListener("timeupdate", handleTimeUpdate)
      audio.addEventListener("ended", handleEnded)

      audio
        .play()
        .then(() => dispatch({ type: "SET_PLAYING", payload: true }))
        .catch((error) => handleAudioError(error, episode))
    },
    [state.volume, state.isMuted, handleAudioError, startSimulatedPlayback],
  )

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.pause()
        dispatch({ type: "SET_PLAYING", payload: false })
      } else {
        audioRef.current
          .play()
          .then(() => dispatch({ type: "SET_PLAYING", payload: true }))
          .catch(() => {
            dispatch({ type: "SET_PLAYING", payload: true })
            startSimulatedPlayback()
          })
      }
    } else if (state.currentEpisode) {
      dispatch({ type: "SET_PLAYING", payload: !state.isPlaying })
      if (!state.isPlaying) {
        startSimulatedPlayback()
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [state.isPlaying, state.currentEpisode, startSimulatedPlayback])

  const seek = useCallback((newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
    dispatch({ type: "SET_CURRENT_TIME", payload: newTime })
  }, [])

  const setVolume = useCallback(
    (volume: number) => {
      dispatch({ type: "SET_VOLUME", payload: volume })
      if (audioRef.current) {
        audioRef.current.volume = state.isMuted ? 0 : volume
      }
    },
    [state.isMuted],
  )

  const toggleMute = useCallback(() => {
    dispatch({ type: "SET_MUTED", payload: !state.isMuted })
    if (audioRef.current) {
      audioRef.current.volume = !state.isMuted ? 0 : state.volume
    }
  }, [state.isMuted, state.volume])

  const togglePlayerExpanded = useCallback(() => {
    dispatch({ type: "SET_PLAYER_EXPANDED", payload: !state.isPlayerExpanded })
  }, [state.isPlayerExpanded])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const value: AudioContextType = {
    ...state,
    playEpisode,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    togglePlayerExpanded,
    formatTime,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
