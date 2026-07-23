import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import type { Episode, AudioState } from "@/types"
import { audioReducer, AudioProvider, useAudio, useAudioTime } from "./AudioContext"

function episode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: 1,
    title: "Episode One",
    date: "01/01/2024",
    description: "desc",
    status: "ATIVO",
    threat: "BAIXO",
    audioUrl: "https://cdn.jsdelivr.net/gh/example/episode-1.m4a",
    ...overrides,
  }
}

// jsdom has no real HTMLMediaElement playback/decoding support, so `new
// Audio()` and its events are faked here. `"MediaSource" in window` is false
// under jsdom (MediaSource isn't defined at all), so playEpisode always
// takes the plain `audio.src = url` fallback path in these tests, never the
// MSE branch - that branch is exercised manually in the browser per
// CLAUDE.md, not unit-tested here.
class FakeAudio {
  static instances: FakeAudio[] = []
  src = ""
  volume = 1
  preload = ""
  currentTime = 0
  duration = 0
  private listeners: Record<string, Array<() => void>> = {}

  constructor() {
    FakeAudio.instances.push(this)
  }

  addEventListener(event: string, cb: () => void) {
    ;(this.listeners[event] ??= []).push(cb)
  }

  removeEventListener(event: string, cb: () => void) {
    this.listeners[event] = (this.listeners[event] ?? []).filter((fn) => fn !== cb)
  }

  emit(event: string) {
    for (const cb of this.listeners[event] ?? []) cb()
  }

  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
}

function latestAudio(): FakeAudio {
  const audio = FakeAudio.instances.at(-1)
  if (!audio) throw new Error("no FakeAudio instance created")
  return audio
}

function renderAudio() {
  return renderHook(
    () => ({ controls: useAudio(), time: useAudioTime() }),
    { wrapper: ({ children }) => <AudioProvider>{children}</AudioProvider> },
  )
}

describe("audioReducer", () => {
  const base: AudioState = {
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

  it("SET_EPISODE sets the episode and resets time/playing/error", () => {
    const ep = episode()
    const state = audioReducer(
      { ...base, currentTime: 42, isPlaying: true, error: "old error" },
      { type: "SET_EPISODE", payload: ep },
    )
    expect(state.currentEpisode).toBe(ep)
    expect(state.currentTime).toBe(0)
    expect(state.duration).toBe(0)
    expect(state.isPlaying).toBe(false)
    expect(state.error).toBeNull()
  })

  it("SET_ERROR with a real message stops loading and playing", () => {
    const state = audioReducer(
      { ...base, isLoading: true, isPlaying: true },
      { type: "SET_ERROR", payload: "boom" },
    )
    expect(state.error).toBe("boom")
    expect(state.isLoading).toBe(false)
    expect(state.isPlaying).toBe(false)
  })

  it("SET_ERROR with null (clearing) only clears the error, leaving loading/playing untouched (regression)", () => {
    const state = audioReducer(
      { ...base, isLoading: true, isPlaying: true, error: "old error" },
      { type: "SET_ERROR", payload: null },
    )
    expect(state.error).toBeNull()
    expect(state.isLoading).toBe(true)
    expect(state.isPlaying).toBe(true)
  })

  it("ADD_TO_HISTORY dedupes by id, most-recent first, capped at 10", () => {
    let state = base
    for (let i = 1; i <= 11; i++) {
      state = audioReducer(state, { type: "ADD_TO_HISTORY", payload: episode({ id: i }) })
    }
    expect(state.playbackHistory).toHaveLength(10)
    expect(state.playbackHistory[0].id).toBe(11)

    // Re-adding an id already in history moves it to the front, doesn't duplicate.
    state = audioReducer(state, { type: "ADD_TO_HISTORY", payload: episode({ id: 5 }) })
    expect(state.playbackHistory.filter((e) => e.id === 5)).toHaveLength(1)
    expect(state.playbackHistory[0].id).toBe(5)
  })

  it("RESET_PLAYER clears playback state but keeps volume and history", () => {
    const history = [episode({ id: 2 })]
    const state = audioReducer(
      { ...base, currentEpisode: episode(), isPlaying: true, currentTime: 30, volume: 0.3, playbackHistory: history },
      { type: "RESET_PLAYER" },
    )
    expect(state.currentEpisode).toBeNull()
    expect(state.isPlaying).toBe(false)
    expect(state.currentTime).toBe(0)
    expect(state.volume).toBe(0.3)
    expect(state.playbackHistory).toBe(history)
  })
})

describe("AudioProvider / useAudio / useAudioTime", () => {
  beforeEach(() => {
    FakeAudio.instances = []
    vi.stubGlobal("Audio", FakeAudio)
  })

  it("rejects playback when the episode has no audioUrl, without creating an Audio element", async () => {
    const { result } = renderAudio()

    act(() => {
      result.current.controls.playEpisode(episode({ id: 9, audioUrl: null }))
    })

    expect(result.current.controls.error).toMatch(/não disponível/i)
    expect(FakeAudio.instances).toHaveLength(0)
  })

  it("playEpisode sets currentEpisode/isLoading immediately, then isPlaying once play() resolves", async () => {
    const { result } = renderAudio()
    const ep = episode()

    act(() => {
      result.current.controls.playEpisode(ep)
    })

    expect(result.current.controls.currentEpisode?.id).toBe(ep.id)
    expect(result.current.controls.isLoading).toBe(true)

    await waitFor(() => expect(result.current.controls.isPlaying).toBe(true))
    expect(latestAudio().play).toHaveBeenCalledTimes(1)
  })

  it("timeupdate/loadedmetadata events update useAudioTime() without changing useAudio()'s isPlaying reference unnecessarily", async () => {
    const { result } = renderAudio()

    act(() => {
      result.current.controls.playEpisode(episode())
    })
    await waitFor(() => expect(result.current.controls.isPlaying).toBe(true))

    const audio = latestAudio()
    act(() => {
      audio.duration = 120
      audio.emit("loadedmetadata")
      audio.currentTime = 5
      audio.emit("timeupdate")
    })

    expect(result.current.time.duration).toBe(120)
    expect(result.current.time.currentTime).toBe(5)
  })

  it("togglePlayPause pauses then resumes the same episode", async () => {
    const { result } = renderAudio()

    act(() => {
      result.current.controls.playEpisode(episode())
    })
    await waitFor(() => expect(result.current.controls.isPlaying).toBe(true))

    act(() => {
      result.current.controls.togglePlayPause()
    })
    expect(result.current.controls.isPlaying).toBe(false)
    expect(latestAudio().pause).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.controls.togglePlayPause()
    })
    await waitFor(() => expect(result.current.controls.isPlaying).toBe(true))
  })

  it("regression (#106): an error event for a stale episode after switching tracks does not overwrite the new episode's state", async () => {
    const { result } = renderAudio()

    act(() => {
      result.current.controls.playEpisode(episode({ id: 7 }))
    })
    await waitFor(() => expect(FakeAudio.instances).toHaveLength(1))
    const staleAudio = latestAudio()

    // Switch to a different episode before the first one ever fires an event -
    // this creates a second FakeAudio instance and moves currentEpisodeIdRef on.
    act(() => {
      result.current.controls.playEpisode(episode({ id: 3 }))
    })
    await waitFor(() => expect(FakeAudio.instances).toHaveLength(2))

    // The stale (episode 7) audio element now reports an error. The staleness
    // guard in the `error` handler must ignore it since the ref has moved on.
    act(() => {
      staleAudio.emit("error")
    })

    expect(result.current.controls.currentEpisode?.id).toBe(3)
    expect(result.current.controls.error).toBeNull()
  })

  it("isEpisodePlaying reflects only the currently playing episode", async () => {
    const { result } = renderAudio()

    act(() => {
      result.current.controls.playEpisode(episode({ id: 1 }))
    })
    await waitFor(() => expect(result.current.controls.isPlaying).toBe(true))

    expect(result.current.controls.isEpisodePlaying(1)).toBe(true)
    expect(result.current.controls.isEpisodePlaying(2)).toBe(false)
  })
})
