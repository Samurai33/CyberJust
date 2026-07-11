import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useLocalStorage } from "./useLocalStorage"

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns the initial value when nothing is stored yet", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"))
    expect(result.current[0]).toBe("default")
  })

  it("reads an existing value from localStorage on mount", () => {
    window.localStorage.setItem("test-key", JSON.stringify("stored value"))
    const { result } = renderHook(() => useLocalStorage("test-key", "default"))
    expect(result.current[0]).toBe("stored value")
  })

  it("persists a new value to localStorage and updates state", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"))

    act(() => {
      result.current[1]("updated")
    })

    expect(result.current[0]).toBe("updated")
    expect(window.localStorage.getItem("test-key")).toBe(JSON.stringify("updated"))
  })

  it("supports a functional updater, like useState", () => {
    const { result } = renderHook(() => useLocalStorage<number>("counter", 0))

    act(() => {
      result.current[1]((prev) => prev + 1)
    })
    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(2)
  })

  it("falls back to the initial value if localStorage holds malformed JSON", () => {
    window.localStorage.setItem("broken-key", "{not valid json")
    const { result } = renderHook(() => useLocalStorage("broken-key", "fallback"))
    expect(result.current[0]).toBe("fallback")
  })
})
