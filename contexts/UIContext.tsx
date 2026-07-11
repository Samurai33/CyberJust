"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { Episode, UIState } from "@/types"
import { useKeyboard } from "@/hooks/useKeyboard"

interface UIContextType extends Omit<UIState, "glitchText" | "mousePosition"> {
  setActiveEpisode: (episode: number | null) => void
  setSelectedEpisodeModal: (episode: Episode | null) => void
  setSelectedLuluModal: (show: boolean) => void
  setEpisodeFilters: (filters: Partial<UIState["episodeFilters"]>) => void
  resetFilters: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

const initialFilters = {
  search: "",
  status: "all",
  threat: "all",
  category: "all",
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activeEpisode, setActiveEpisode] = useState<number | null>(null)
  const [selectedEpisodeModal, setSelectedEpisodeModal] = useState<Episode | null>(null)
  const [selectedLuluModal, setSelectedLuluModal] = useState(false)
  const [episodeFilters, setEpisodeFiltersState] = useState(initialFilters)

  // Close modals with Escape key
  useKeyboard("Escape", () => {
    setSelectedEpisodeModal(null)
    setSelectedLuluModal(false)
  })

  const setEpisodeFilters = (filters: Partial<UIState["episodeFilters"]>) => {
    setEpisodeFiltersState((prev) => ({ ...prev, ...filters }))
  }

  const resetFilters = () => {
    setEpisodeFiltersState(initialFilters)
  }

  const value: UIContextType = {
    activeEpisode,
    selectedEpisodeModal,
    selectedLuluModal,
    episodeFilters,
    setActiveEpisode,
    setSelectedEpisodeModal,
    setSelectedLuluModal,
    setEpisodeFilters,
    resetFilters,
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
