"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"

// Same-tab writes don't fire the "storage" event, so notify subscribers here.
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * localStorage-backed state. The server snapshot is always `initialValue`
 * and the stored value is picked up during hydration, so there's no
 * server/client markup mismatch. `initialValue` should be referentially
 * stable (a module-level constant) when it's an object/array.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  )
  const value = useMemo(() => parse(raw, initialValue), [raw, initialValue])

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parse(readRaw(key), initialValue)
      const resolved = next instanceof Function ? next(prev) : next
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved))
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
        return
      }
      listeners.forEach((listener) => listener())
    },
    [key, initialValue],
  )

  return [value, setValue] as const
}
