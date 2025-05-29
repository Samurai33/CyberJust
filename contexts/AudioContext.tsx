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
  error: string | null
  playbackHistory: Episode[]
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
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_TO_HISTORY"; payload: Episode }
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
  error: null,
  playbackHistory: [],
}

function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case "SET_EPISODE":
      return {
        ...state,
        currentEpisode: action.payload,
        error: null,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
      }
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
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false, isPlaying: false }
    case "ADD_TO_HISTORY":
      const newHistory = state.playbackHistory.filter((ep) => ep.id !== action.payload.id)
      return {
        ...state,
        playbackHistory: [action.payload, ...newHistory].slice(0, 10), // Keep last 10 episodes
      }
    case "RESET_PLAYER":
      return { ...initialState, volume: state.volume, playbackHistory: state.playbackHistory }
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
  clearError: () => void
  stopPlayback: () => void
  isEpisodePlaying: (episodeId: string | number) => boolean
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioReducer, initialState)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentEpisodeIdRef = useRef<string | number | null>(null)

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null })
  }, [])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    currentEpisodeIdRef.current = null
    dispatch({ type: "RESET_PLAYER" })
  }, [])

  const isEpisodePlaying = useCallback(
    (episodeId: string | number) => {
      return state.currentEpisode?.id === episodeId && state.isPlaying
    },
    [state.currentEpisode?.id, state.isPlaying],
  )

  const playEpisode = useCallback(
    (episode: Episode) => {
      // If same episode is already playing, just toggle play/pause
      if (currentEpisodeIdRef.current === episode.id && audioRef.current) {
        if (state.isPlaying) {
          audioRef.current.pause()
          dispatch({ type: "SET_PLAYING", payload: false })
        } else {
          audioRef.current
            .play()
            .then(() => dispatch({ type: "SET_PLAYING", payload: true }))
            .catch(() => dispatch({ type: "SET_ERROR", payload: "Não foi possível retomar a reprodução." }))
        }
        return
      }

      // Validate that episode has an audio URL
      if (!episode.audioUrl) {
        dispatch({ type: "SET_ERROR", payload: `Áudio não disponível para o episódio ${episode.id}.` })
        return
      }

      // Stop current playback if any
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }

      // Set new episode
      dispatch({ type: "SET_EPISODE", payload: episode })
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })
      currentEpisodeIdRef.current = episode.id

      try {
        const audio = new Audio()
        audioRef.current = audio
        audio.volume = state.isMuted ? 0 : state.volume
        audio.preload = "metadata"

        const handleError = () => {
          dispatch({
            type: "SET_ERROR",
            payload: `Não foi possível carregar o áudio do episódio ${episode.id}. Verifique sua conexão.`,
          })
          currentEpisodeIdRef.current = null
        }

        const handleLoadStart = () => dispatch({ type: "SET_LOADING", payload: true })
        const handleCanPlay = () => dispatch({ type: "SET_LOADING", payload: false })
        const handleLoadedMetadata = () => {
          dispatch({ type: "SET_DURATION", payload: audio.duration })
        }
        const handleTimeUpdate = () => {
          // Only update if this is still the current episode
          if (currentEpisodeIdRef.current === episode.id) {
            dispatch({ type: "SET_CURRENT_TIME", payload: audio.currentTime })
          }
        }
        const handleEnded = () => {
          if (currentEpisodeIdRef.current === episode.id) {
            dispatch({ type: "SET_PLAYING", payload: false })
            dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
            dispatch({ type: "ADD_TO_HISTORY", payload: episode })
          }
        }

        // Add all event listeners
        audio.addEventListener("error", handleError)
        audio.addEventListener("loadstart", handleLoadStart)
        audio.addEventListener("canplay", handleCanPlay)
        audio.addEventListener("loadedmetadata", handleLoadedMetadata)
        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("ended", handleEnded)

        // Set source and attempt to load
        audio.src = episode.audioUrl

        // Try to play
        const playPromise = audio.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (currentEpisodeIdRef.current === episode.id) {
                dispatch({ type: "SET_PLAYING", payload: true })
              }
            })
            .catch((error) => {
              console.error("Playback failed:", error)
              if (currentEpisodeIdRef.current === episode.id) {
                dispatch({
                  type: "SET_ERROR",
                  payload: `Reprodução falhou para o episódio ${episode.id}. Tente novamente mais tarde.`,
                })
              }
            })
        }

        // Fallback timeout in case audio doesn't load
        setTimeout(() => {
          if (state.isLoading && currentEpisodeIdRef.current === episode.id) {
            dispatch({
              type: "SET_ERROR",
              payload: `Tempo limite excedido ao carregar o episódio ${episode.id}.`,
            })
          }
        }, 10000)
      } catch (error) {
        console.error("Audio creation failed:", error)
        dispatch({
          type: "SET_ERROR",
          payload: `Falha ao inicializar o reprodutor para o episódio ${episode.id}.`,
        })
        currentEpisodeIdRef.current = null
      }
    },
    [state.volume, state.isMuted, state.isLoading, state.isPlaying],
  )

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !state.currentEpisode || currentEpisodeIdRef.current !== state.currentEpisode.id) {
      return
    }

    if (state.isPlaying) {
      audioRef.current.pause()
      dispatch({ type: "SET_PLAYING", payload: false })
    } else {
      audioRef.current
        .play()
        .then(() => dispatch({ type: "SET_PLAYING", payload: true }))
        .catch((error) => {
          console.error("Failed to resume playback:", error)
          dispatch({
            type: "SET_ERROR",
            payload: "Não foi possível retomar a reprodução.",
          })
        })
    }
  }, [state.isPlaying, state.currentEpisode])

  const seek = useCallback(
    (newTime: number) => {
      if (audioRef.current && currentEpisodeIdRef.current === state.currentEpisode?.id) {
        audioRef.current.currentTime = newTime
        dispatch({ type: "SET_CURRENT_TIME", payload: newTime })
      }
    },
    [state.currentEpisode?.id],
  )

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
    const newMutedState = !state.isMuted
    dispatch({ type: "SET_MUTED", payload: newMutedState })
    if (audioRef.current) {
      audioRef.current.volume = newMutedState ? 0 : state.volume
    }
  }, [state.isMuted, state.volume])

  const togglePlayerExpanded = useCallback(() => {
    dispatch({ type: "SET_PLAYER_EXPANDED", payload: !state.isPlayerExpanded })
  }, [state.isPlayerExpanded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      currentEpisodeIdRef.current = null
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
    clearError,
    stopPlayback,
    isEpisodePlaying,
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
