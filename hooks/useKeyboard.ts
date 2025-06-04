"use client"

import { useEffect } from "react"

export function useKeyboard(key: string, callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        callback()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [key, callback, ...deps])
}
