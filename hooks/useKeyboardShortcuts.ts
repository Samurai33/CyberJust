"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcuts {
  [key: string]: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts, enabled = true) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const withCtrl = event.ctrlKey || event.metaKey
      const withShift = event.shiftKey
      const withAlt = event.altKey

      let shortcutKey = key
      if (withCtrl) shortcutKey = `ctrl+${shortcutKey}`
      if (withShift) shortcutKey = `shift+${shortcutKey}`
      if (withAlt) shortcutKey = `alt+${shortcutKey}`

      if (shortcuts[shortcutKey]) {
        event.preventDefault()
        shortcuts[shortcutKey]()
      }
    },
    [shortcuts, enabled],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])
}
