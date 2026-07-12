"use client"

import type React from "react"
import { createContext, useContext, useCallback, useMemo } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { generateId } from "@/lib/utils"
import { EXPERTS } from "@/lib/constants"
import type { ProjectExpert } from "@/types/project"

interface ExpertsContextType {
  experts: ProjectExpert[]
  createExpert: (data: Omit<ProjectExpert, "id">) => void
  updateExpert: (id: string, data: Omit<ProjectExpert, "id">) => void
  deleteExpert: (id: string) => void
  getExpertById: (id: string) => ProjectExpert | undefined
  refreshExperts: () => void
}

const ExpertsContext = createContext<ExpertsContextType | undefined>(undefined)

// Seed data for experts when localStorage has none yet. Computed once at
// module scope rather than inside the provider, so useLocalStorage's lazy
// initializer (which already reads localStorage on mount with no extra
// effect) can use it directly as the fallback instead of patching state
// after the fact from a setState-in-effect.
const seededExperts: ProjectExpert[] = EXPERTS.map((expert) => ({
  id: generateId(),
  name: expert.name,
  role: expert.role,
  organization: "",
  bio: expert.description,
  avatar: "",
  contact: {
    email: "",
    phone: "",
    linkedin: "",
  },
}))

export function ExpertsProvider({ children }: { children: React.ReactNode }) {
  const [experts, setExperts] = useLocalStorage<ProjectExpert[]>("cyberjustica-experts", seededExperts)

  const createExpert = useCallback(
    (data: Omit<ProjectExpert, "id">) => {
      const newExpert: ProjectExpert = {
        id: generateId(),
        ...data,
      }
      const updatedExperts = [...experts, newExpert]
      setExperts(updatedExperts)

      // Dispara um evento customizado para notificar outras partes da aplicação
      window.dispatchEvent(new CustomEvent("expertsUpdated", { detail: updatedExperts }))
    },
    [experts, setExperts],
  )

  const updateExpert = useCallback(
    (id: string, data: Omit<ProjectExpert, "id">) => {
      const updatedExperts = experts.map((expert) =>
        expert.id === id
          ? {
              ...expert,
              ...data,
            }
          : expert,
      )
      setExperts(updatedExperts)

      // Dispara um evento customizado para notificar outras partes da aplicação
      window.dispatchEvent(new CustomEvent("expertsUpdated", { detail: updatedExperts }))
    },
    [experts, setExperts],
  )

  const deleteExpert = useCallback(
    (id: string) => {
      const updatedExperts = experts.filter((expert) => expert.id !== id)
      setExperts(updatedExperts)

      // Dispara um evento customizado para notificar outras partes da aplicação
      window.dispatchEvent(new CustomEvent("expertsUpdated", { detail: updatedExperts }))
    },
    [experts, setExperts],
  )

  const getExpertById = useCallback(
    (id: string) => {
      return experts.find((expert) => expert.id === id)
    },
    [experts],
  )

  const refreshExperts = useCallback(() => {
    // Força uma re-leitura do localStorage
    const storedExperts = localStorage.getItem("cyberjustica-experts")
    if (storedExperts) {
      try {
        const parsedExperts = JSON.parse(storedExperts)
        setExperts(parsedExperts)
      } catch (error) {
        console.error("Erro ao fazer parse dos experts:", error)
      }
    }
  }, [setExperts])

  const value: ExpertsContextType = useMemo(
    () => ({
      experts,
      createExpert,
      updateExpert,
      deleteExpert,
      getExpertById,
      refreshExperts,
    }),
    [experts, createExpert, updateExpert, deleteExpert, getExpertById, refreshExperts],
  )

  return <ExpertsContext.Provider value={value}>{children}</ExpertsContext.Provider>
}

export function useExperts() {
  const context = useContext(ExpertsContext)
  if (context === undefined) {
    throw new Error("useExperts must be used within an ExpertsProvider")
  }
  return context
}
