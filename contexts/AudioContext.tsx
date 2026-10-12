"use client"

import type React from "react"
import { createContext, useContext, useReducer, useRef, useCallback, useEffect, useMemo } from "react"
import type { Episode, AudioState } from "@/types"
import { formatTime } from "@/lib/utils"

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
}

export function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case "SET_EPISODE":
      return {
        ...state,
        currentEpisode: action.payload,
        error: null,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        isLoading: true,
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
      return action.payload
        ? { ...state, error: action.payload, isLoading: false, isPlaying: false }
        : { ...state, error: null }
    case "RESET_PLAYER":
      return { ...initialState, volume: state.volume, isMuted: state.isMuted }
    default:
      return state
  }
}

// Split into two contexts so components that only care about play/pause
// state (play buttons throughout the app) don't re-render on every
// `timeupdate` tick. Only the player bar and the bookmarks tab need live
// currentTime.
interface AudioControlsContextType {
  currentEpisode: Episode | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  isLoading: boolean
  isPlayerExpanded: boolean
  error: string | null
  playEpisode: (episode: Episode) => void
  togglePlayPause: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  togglePlayerExpanded: () => void
  stopPlayback: () => void
}

interface AudioTimeContextType {
  currentTime: number
  duration: number
  seek: (time: number) => void
  formatTime: (time: number) => string
}

const AudioContext = createContext<AudioControlsContextType | undefined>(undefined)
const AudioTimeContext = createContext<AudioTimeContextType | undefined>(undefined)

const SKIP_SECONDS = 15

/**
 * Episode audio is plain (non-fragmented) AAC in an MP4 container with the
 * `moov` atom up front (`ffmpeg -c copy -movflags +faststart`), so a single
 * `<audio>` element streams it progressively over HTTP Range requests:
 * playback starts after the first few hundred KB and seeking jumps straight
 * to the byte offset. One element is reused for the whole session (iOS only
 * lets an element that was started by a user gesture keep playing).
 */
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioReducer, initialState)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const episodeRef = useRef<Episode | null>(null)

  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current

    const audio = new Audio()
    audio.preload = "metadata"
    audioRef.current = audio

    audio.addEventListener("loadedmetadata", () => dispatch({ type: "SET_DURATION", payload: audio.duration }))
    audio.addEventListener("timeupdate", () => dispatch({ type: "SET_CURRENT_TIME", payload: audio.currentTime }))
    audio.addEventListener("waiting", () => dispatch({ type: "SET_LOADING", payload: true }))
    audio.addEventListener("canplay", () => dispatch({ type: "SET_LOADING", payload: false }))
    audio.addEventListener("playing", () => {
      dispatch({ type: "SET_LOADING", payload: false })
      dispatch({ type: "SET_PLAYING", payload: true })
    })
    audio.addEventListener("pause", () => dispatch({ type: "SET_PLAYING", payload: false }))
    audio.addEventListener("ended", () => {
      dispatch({ type: "SET_PLAYING", payload: false })
      dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
    })
    audio.addEventListener("error", () => {
      // Clearing src (stopPlayback) also fires "error" - ignore it.
      if (!audio.getAttribute("src") || !episodeRef.current) return
      dispatch({
        type: "SET_ERROR",
        payload: `Não foi possível carregar o áudio do episódio ${episodeRef.current.id}. Verifique sua conexão.`,
      })
    })

    return audio
  }, [])

  const resume = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((error: unknown) => {
      // AbortError = a newer load()/pause() superseded this play() call.
      if (error instanceof DOMException && error.name === "AbortError") return
      dispatch({ type: "SET_ERROR", payload: "Não foi possível iniciar a reprodução. Tente novamente." })
    })
  }, [])

  const playEpisode = useCallback(
    (episode: Episode) => {
      if (!episode.audioUrl) {
        dispatch({ type: "SET_ERROR", payload: `Áudio não disponível para o episódio ${episode.id}.` })
        return
      }

      const audio = getAudio()

      if (episodeRef.current?.id === episode.id) {
        if (audio.paused) resume(audio)
        else audio.pause()
        return
      }

      episodeRef.current = episode
      dispatch({ type: "SET_EPISODE", payload: episode })
      audio.src = episode.audioUrl
      audio.load()
      resume(audio)
    },
    [getAudio, resume],
  )

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !episodeRef.current) return
    if (audio.paused) resume(audio)
    else audio.pause()
  }, [resume])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(time)) return
    const max = Number.isFinite(audio.duration) ? audio.duration : time
    audio.currentTime = Math.min(Math.max(0, time), max)
    dispatch({ type: "SET_CURRENT_TIME", payload: audio.currentTime })
  }, [])

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current
    episodeRef.current = null
    if (audio) {
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
    }
    dispatch({ type: "RESET_PLAYER" })
  }, [])

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: "SET_VOLUME", payload: volume })
    if (volume > 0) dispatch({ type: "SET_MUTED", payload: false })
  }, [])

  const toggleMute = useCallback(() => {
    dispatch({ type: "SET_MUTED", payload: !state.isMuted })
  }, [state.isMuted])

  const togglePlayerExpanded = useCallback(() => {
    dispatch({ type: "SET_PLAYER_EXPANDED", payload: !state.isPlayerExpanded })
  }, [state.isPlayerExpanded])

  // Volume/mute are the single source of truth in state; mirror onto the element.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = state.volume
    audio.muted = state.isMuted
  }, [state.volume, state.isMuted, state.currentEpisode])

  // Lock-screen / headset / notification controls.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    const episode = state.currentEpisode
    const session = navigator.mediaSession
    session.metadata = episode
      ? new MediaMetadata({
          title: episode.title,
          artist: "CyberJustiça Brasil",
          album: `Episódio ${episode.id}`,
          artwork: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
        })
      : null
    if (!episode) return

    const audio = audioRef.current
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => audio && resume(audio)],
      ["pause", () => audio?.pause()],
      ["seekbackward", () => audio && seek(audio.currentTime - SKIP_SECONDS)],
      ["seekforward", () => audio && seek(audio.currentTime + SKIP_SECONDS)],
      ["seekto", (details) => details.seekTime !== undefined && seek(details.seekTime)],
    ]
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler)
      } catch {
        // Action not supported by this browser.
      }
    }
  }, [state.currentEpisode, resume, seek])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const controlsValue = useMemo<AudioControlsContextType>(
    () => ({
      currentEpisode: state.currentEpisode,
      isPlaying: state.isPlaying,
      volume: state.volume,
      isMuted: state.isMuted,
      isLoading: state.isLoading,
      isPlayerExpanded: state.isPlayerExpanded,
      error: state.error,
      playEpisode,
      togglePlayPause,
      setVolume,
      toggleMute,
      togglePlayerExpanded,
      stopPlayback,
    }),
    [
      state.currentEpisode,
      state.isPlaying,
      state.volume,
      state.isMuted,
      state.isLoading,
      state.isPlayerExpanded,
      state.error,
      playEpisode,
      togglePlayPause,
      setVolume,
      toggleMute,
      togglePlayerExpanded,
      stopPlayback,
    ],
  )

  const timeValue = useMemo<AudioTimeContextType>(
    () => ({ currentTime: state.currentTime, duration: state.duration, seek, formatTime }),
    [state.currentTime, state.duration, seek],
  )

  return (
    <AudioContext.Provider value={controlsValue}>
      <AudioTimeContext.Provider value={timeValue}>{children}</AudioTimeContext.Provider>
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}

// Live playback position - only for components that display or seek the
// timeline (the player bar, the bookmarks tab).
export function useAudioTime() {
  const context = useContext(AudioTimeContext)
  if (context === undefined) {
    throw new Error("useAudioTime must be used within an AudioProvider")
  }
  return context
}
