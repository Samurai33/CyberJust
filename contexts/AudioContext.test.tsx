import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
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
    audioUrl: "/audio/episode-1.m4a",
    ...overrides,
  }
}

// jsdom has no real media playback, so `new Audio()` is faked. Events are
// emitted by hand to simulate what a real browser fires.
class FakeAudio {
  static instances: FakeAudio[] = []
  private attrs: Record<string, string> = {}
  volume = 1
  muted = false
  preload = ""
  currentTime = 0
  duration = Number.NaN
  paused = true
  private listeners: Record<string, Array<() => void>> = {}

  constructor() {
    FakeAudio.instances.push(this)
  }

  get src() {
    return this.attrs.src ?? ""
  }
  set src(value: string) {
    this.attrs.src = value
  }
  getAttribute(name: string) {
    return this.attrs[name] ?? null
  }
  removeAttribute(name: string) {
    delete this.attrs[name]
  }

  addEventListener(event: string, cb: () => void) {
    ;(this.listeners[event] ??= []).push(cb)
  }

  emit(event: string) {
    for (const cb of this.listeners[event] ?? []) cb()
  }

  load = vi.fn()
  play = vi.fn(() => {
    this.paused = false
    this.emit("playing")
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    this.paused = true
    this.emit("pause")
  })
}

function onlyAudio(): FakeAudio {
  expect(FakeAudio.instances).toHaveLength(1)
  return FakeAudio.instances[0]
}

function renderAudio() {
  return renderHook(() => ({ controls: useAudio(), time: useAudioTime() }), { wrapper: AudioProvider })
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
  }

  it("SET_EPISODE sets the episode, resets time/error and starts loading", () => {
    const state = audioReducer(
      { ...base, currentTime: 42, duration: 100, isPlaying: true, error: "old" },
      { type: "SET_EPISODE", payload: episode() },
    )
    expect(state).toMatchObject({ currentTime: 0, duration: 0, isPlaying: false, error: null, isLoading: true })
    expect(state.currentEpisode?.id).toBe(1)
  })

  it("SET_ERROR with a message stops loading and playing", () => {
    const state = audioReducer({ ...base, isLoading: true, isPlaying: true }, { type: "SET_ERROR", payload: "boom" })
    expect(state).toMatchObject({ error: "boom", isLoading: false, isPlaying: false })
  })

  it("SET_ERROR with null only clears the error", () => {
    const state = audioReducer({ ...base, isLoading: true, error: "x" }, { type: "SET_ERROR", payload: null })
    expect(state).toMatchObject({ error: null, isLoading: true })
  })

  it("RESET_PLAYER clears playback but keeps volume and mute", () => {
    const state = audioReducer(
      { ...base, currentEpisode: episode(), isPlaying: true, volume: 0.3, isMuted: true },
      { type: "RESET_PLAYER" },
    )
    expect(state).toMatchObject({ currentEpisode: null, isPlaying: false, volume: 0.3, isMuted: true })
  })
})

describe("AudioProvider", () => {
  beforeEach(() => {
    FakeAudio.instances = []
    vi.stubGlobal("Audio", FakeAudio)
  })

  it("rejects an episode without audio and creates no element", () => {
    const { result } = renderAudio()
    act(() => result.current.controls.playEpisode(episode({ id: 3, audioUrl: null })))
    expect(result.current.controls.error).toMatch(/episódio 3/)
    expect(FakeAudio.instances).toHaveLength(0)
  })

  it("plays an episode by assigning src directly (progressive streaming)", async () => {
    const { result } = renderAudio()
    await act(async () => result.current.controls.playEpisode(episode()))
    const audio = onlyAudio()
    expect(audio.src).toBe("/audio/episode-1.m4a")
    expect(audio.load).toHaveBeenCalled()
    expect(result.current.controls.isPlaying).toBe(true)
    expect(result.current.controls.isLoading).toBe(false)
  })

  it("calling playEpisode on the current episode toggles pause/resume", async () => {
    const { result } = renderAudio()
    await act(async () => result.current.controls.playEpisode(episode()))
    await act(async () => result.current.controls.playEpisode(episode()))
    expect(result.current.controls.isPlaying).toBe(false)
    await act(async () => result.current.controls.togglePlayPause())
    expect(result.current.controls.isPlaying).toBe(true)
  })

  it("reuses one audio element when switching episodes", async () => {
    const { result } = renderAudio()
    await act(async () => result.current.controls.playEpisode(episode()))
    await act(async () => result.current.controls.playEpisode(episode({ id: 2, audioUrl: "/audio/episode-2.m4a" })))
    const audio = onlyAudio()
    expect(audio.src).toBe("/audio/episode-2.m4a")
    expect(result.current.controls.currentEpisode?.id).toBe(2)
  })

  it("an error event reports the episode that is actually loaded", async () => {
    const { result } = renderAudio()
    await act(async () => result.current.controls.playEpisode(episode()))
    await act(async () => result.current.controls.playEpisode(episode({ id: 7, audioUrl: "/audio/ep7.m4a" })))
    act(() => onlyAudio().emit("error"))
    expect(result.current.controls.error).toMatch(/episódio 7/)
  })

  it("stopPlayback clears the player without surfacing an error", async () => {
    const { result } = renderAudio()
    await act(async () => result.current.controls.playEpisode(episode()))
    act(() => result.current.controls.stopPlayback())
    act(() => onlyAudio().emit("error"))
    expect(result.current.controls.currentEpisode).toBeNull()
    expect(result.current.controls.error).toBeNull()
  })

  it("timeupdate/loadedmetadata feed useAudioTime, and seek clamps to the duration", async () => {
    const { result } = renderAudio()
    await act(async () => result.current.controls.playEpisode(episode()))
    const audio = onlyAudio()
    audio.duration = 120
    audio.currentTime = 30
    act(() => {
      audio.emit("loadedmetadata")
      audio.emit("timeupdate")
    })
    expect(result.current.time).toMatchObject({ duration: 120, currentTime: 30 })

    act(() => result.current.time.seek(500))
    expect(audio.currentTime).toBe(120)
    act(() => result.current.time.seek(-10))
    expect(audio.currentTime).toBe(0)
  })

  it("mute and volume are mirrored onto the element", async () => {
    const { result } = renderAudio()
    await act(async () => result.current.controls.playEpisode(episode()))
    act(() => result.current.controls.setVolume(0.4))
    act(() => result.current.controls.toggleMute())
    const audio = onlyAudio()
    expect(audio.volume).toBe(0.4)
    expect(audio.muted).toBe(true)
  })
})
