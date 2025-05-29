"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback, useRef } from "react"

import { STORAGE_KEYS, KEYBOARD_SHORTCUTS } from "@/lib/constants"
import { useLocalStorage } from "@/hooks/useLocalStorage"

interface Episode {
  id: string
  title: string
  audioUrl: string
}

interface AudioState {
  currentEpisode: Episode | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
}

interface AudioContextType {
  state: AudioState
  playEpisode: (episode: Episode) => void
  togglePlayPause: () => void
  setCurrentTime: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
}

const defaultState: AudioState = {
  currentEpisode: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
}

type Action =
  | { type: "SET_EPISODE"; payload: Episode }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_TIME"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_MUTED"; payload: boolean }

const audioReducer = (state: AudioState, action: Action): AudioState => {
  switch (action.type) {
    case "SET_EPISODE":
      return { ...state, currentEpisode: action.payload }
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_CURRENT_TIME":
      return { ...state, currentTime: action.payload }
    case "SET_DURATION":
      return { ...state, duration: action.payload }
    case "SET_VOLUME":
      return { ...state, volume: action.payload }
    case "SET_MUTED":
      return { ...state, isMuted: action.payload }
    default:
      return state
  }
}

const AudioContext = createContext<AudioContextType>({
  state: defaultState,
  playEpisode: () => {},
  togglePlayPause: () => {},
  setCurrentTime: () => {},
  setVolume: () => {},
  toggleMute: () => {},
})

interface AudioProviderProps {
  children: React.ReactNode
}

const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, defaultState)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [audioSettings, setAudioSettings] = useLocalStorage(STORAGE_KEYS.AUDIO_SETTINGS, {
    volume: 1,
    playbackRate: 1,
    autoplay: false,
  })

  const startSimulatedPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      dispatch({
        type: "SET_CURRENT_TIME",
        payload: state.currentTime + 1 > state.duration ? 0 : state.currentTime + 1,
      })
    }, 1000)
  }, [state.currentTime, state.duration])

  const playEpisode = useCallback(
    (episode: Episode) => {
      dispatch({ type: "SET_EPISODE", payload: episode })
      dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
      dispatch({ type: "SET_LOADING", payload: true })

      // Stop any existing playback
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }

      // If no audio URL, use simulated playback
      if (!episode.audioUrl) {
        console.log(`No audio URL for episode ${episode.id}, using simulated playback`)
        dispatch({ type: "SET_LOADING", payload: false })
        dispatch({ type: "SET_DURATION", payload: 2730 }) // 45:30 duration
        dispatch({ type: "SET_PLAYING", payload: true })
        startSimulatedPlayback()
        return
      }

      // Try to load real audio
      const audio = new Audio()
      audioRef.current = audio
      audio.volume = state.isMuted ? 0 : state.volume
      audio.preload = "metadata"

      const handleError = (e: Event) => {
        console.warn(`Audio failed to load for episode ${episode.id}, falling back to simulated playback`)
        dispatch({ type: "SET_LOADING", payload: false })
        dispatch({ type: "SET_DURATION", payload: 2730 })
        dispatch({ type: "SET_PLAYING", payload: true })
        audioRef.current = null
        startSimulatedPlayback()
      }

      const handleLoadStart = () => dispatch({ type: "SET_LOADING", payload: true })
      const handleCanPlay = () => dispatch({ type: "SET_LOADING", payload: false })
      const handleLoadedMetadata = () => {
        dispatch({ type: "SET_DURATION", payload: audio.duration || 2730 })
      }
      const handleTimeUpdate = () => {
        dispatch({ type: "SET_CURRENT_TIME", payload: audio.currentTime })
      }
      const handleEnded = () => {
        dispatch({ type: "SET_PLAYING", payload: false })
        dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
      }

      // Add event listeners
      audio.addEventListener("error", handleError)
      audio.addEventListener("loadstart", handleLoadStart)
      audio.addEventListener("canplay", handleCanPlay)
      audio.addEventListener("loadedmetadata", handleLoadedMetadata)
      audio.addEventListener("timeupdate", handleTimeUpdate)
      audio.addEventListener("ended", handleEnded)

      // Set source and try to play
      audio.src = episode.audioUrl

      // Attempt to play with fallback
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            dispatch({ type: "SET_PLAYING", payload: true })
          })
          .catch((error) => {
            console.warn(`Playback failed for episode ${episode.id}:`, error.message)
            handleError(error)
          })
      }

      // Fallback timeout
      setTimeout(() => {
        if (state.isLoading) {
          console.warn(`Loading timeout for episode ${episode.id}, using simulated playback`)
          handleError(new Event("timeout"))
        }
      }, 5000)
    },
    [state.volume, state.isMuted, state.isLoading, startSimulatedPlayback],
  )

  const togglePlayPause = useCallback(() => {
    if (audioRef.current && audioRef.current.src) {
      // Real audio playback
      if (state.isPlaying) {
        audioRef.current.pause()
        dispatch({ type: "SET_PLAYING", payload: false })
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        audioRef.current
          .play()
          .then(() => dispatch({ type: "SET_PLAYING", payload: true }))
          .catch(() => {
            console.warn("Real audio playback failed, switching to simulated")
            dispatch({ type: "SET_PLAYING", payload: true })
            startSimulatedPlayback()
          })
      }
    } else if (state.currentEpisode) {
      // Simulated playback
      const newPlayingState = !state.isPlaying
      dispatch({ type: "SET_PLAYING", payload: newPlayingState })

      if (newPlayingState) {
        startSimulatedPlayback()
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [state.isPlaying, state.currentEpisode, startSimulatedPlayback])

  const setCurrentTime = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      dispatch({ type: "SET_CURRENT_TIME", payload: time })
    }
  }, [])

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    dispatch({ type: "SET_VOLUME", payload: volume })
  }, [])

  const toggleMute = useCallback(() => {
    const newMutedState = !state.isMuted
    if (audioRef.current) {
      audioRef.current.muted = newMutedState
      audioRef.current.volume = newMutedState ? 0 : state.volume
    }
    dispatch({ type: "SET_MUTED", payload: newMutedState })
  }, [state.isMuted, state.volume])

  const value: AudioContextType = {
    state,
    playEpisode,
    togglePlayPause,
    setCurrentTime,
    setVolume,
    toggleMute,
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case KEYBOARD_SHORTCUTS.PLAY_PAUSE:
        e.preventDefault()
        state.isPlaying ? audioRef.current?.pause() : audioRef.current?.play()
        break
      case KEYBOARD_SHORTCUTS.MUTE:
        toggleMute()
        break
      // ... outros casos
    }
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

const useAudio = () => useContext(AudioContext)

export { AudioProvider, useAudio }
