"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

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

interface UIState {
  glitchText: string
  mousePosition: { x: number; y: number }
  activeEpisode: number | null
  selectedEpisodeModal: Episode | null
  selectedLuluModal: boolean
}

interface UIContextType extends UIState {
  setActiveEpisode: (episode: number | null) => void
  setSelectedEpisodeModal: (episode: Episode | null) => void
  setSelectedLuluModal: (show: boolean) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [glitchText, setGlitchText] = useState("CYBERJUSTIÇA")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [activeEpisode, setActiveEpisode] = useState<number | null>(null)
  const [selectedEpisodeModal, setSelectedEpisodeModal] = useState<Episode | null>(null)
  const [selectedLuluModal, setSelectedLuluModal] = useState(false)

  // Mouse tracking effect
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Glitch text effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const glitchChars = ["█", "▓", "▒", "░", "▄", "▀", "■", "□", "◆", "◇"]
      const originalText = "CYBERJUSTIÇA"
      let glitched = originalText

      if (Math.random() < 0.3) {
        const randomIndex = Math.floor(Math.random() * originalText.length)
        const randomChar = glitchChars[Math.floor(Math.random() * glitchChars.length)]
        glitched = originalText.substring(0, randomIndex) + randomChar + originalText.substring(randomIndex + 1)

        setTimeout(() => setGlitchText(originalText), 150)
      }

      setGlitchText(glitched)
    }, 2500)

    return () => clearInterval(glitchInterval)
  }, [])

  const value: UIContextType = {
    glitchText,
    mousePosition,
    activeEpisode,
    selectedEpisodeModal,
    selectedLuluModal,
    setActiveEpisode,
    setSelectedEpisodeModal,
    setSelectedLuluModal,
  }

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider")
  }
  return context
}
