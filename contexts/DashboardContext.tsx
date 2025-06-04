"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { Project, ProjectFormData, ProjectExpert } from "@/types/project"
import type { Episode } from "@/types"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { episodes } from "@/data/episodes"
import {
  syncProjectsWithEpisodes,
  createNewProject,
  episodeToProject,
  updateEpisodesFromProjects,
} from "@/services/projectSync"
import { useExperts } from "./ExpertsContext"

interface DashboardState {
  isAuthenticated: boolean
  logoClickCount: number
  showAuthModal: boolean
  projects: Project[]
  selectedProject: Project | null
  selectedExpert: ProjectExpert | null
  showProjectModal: boolean
  showExpertModal: boolean
  isEditing: boolean
  isEditingExpert: boolean
  activeTab: string
}

interface DashboardContextType extends DashboardState {
  handleLogoClick: () => void
  authenticate: (code: string) => boolean
  logout: () => void
  closeAuthModal: () => void
  createProject: (data: ProjectFormData) => void
  updateProject: (id: string | number, data: Partial<ProjectFormData>) => void
  deleteProject: (id: string | number) => void
  selectProject: (project: Project | null) => void
  openProjectModal: (project?: Project) => void
  closeProjectModal: () => void
  resetClickCount: () => void
  setActiveTab: (tab: string) => void
  convertEpisodeToProject: (episode: Episode) => void
  openExpertModal: (expert?: ProjectExpert) => void
  closeExpertModal: () => void
  experts: ProjectExpert[]
  createExpert: (data: Omit<ProjectExpert, "id">) => void
  updateExpert: (id: string, data: Omit<ProjectExpert, "id">) => void
  deleteExpert: (id: string) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

const SECRET_CODE = "cyber33"
const REQUIRED_CLICKS = 3

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [logoClickCount, setLogoClickCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedExpert, setSelectedExpert] = useState<ProjectExpert | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showExpertModal, setShowExpertModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingExpert, setIsEditingExpert] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [projects, setProjects] = useLocalStorage<Project[]>("cyberjustica-projects", [])

  // Usa o contexto de experts
  const { experts, createExpert, updateExpert, deleteExpert } = useExperts()

  // Sincroniza os projetos com os episódios na inicialização
  useEffect(() => {
    const syncedProjects = syncProjectsWithEpisodes(projects)
    if (syncedProjects.length !== projects.length) {
      setProjects(syncedProjects)
    }
  }, [])

  // Reset click count after 5 seconds of inactivity
  useEffect(() => {
    if (logoClickCount > 0 && logoClickCount < REQUIRED_CLICKS) {
      const timer = setTimeout(() => {
        setLogoClickCount(0)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [logoClickCount])

  const handleLogoClick = useCallback(() => {
    if (isAuthenticated) return

    const newCount = logoClickCount + 1
    setLogoClickCount(newCount)

    if (newCount >= REQUIRED_CLICKS) {
      setShowAuthModal(true)
      setLogoClickCount(0)
    }
  }, [logoClickCount, isAuthenticated])

  const authenticate = useCallback((code: string) => {
    if (code === SECRET_CODE) {
      setIsAuthenticated(true)
      setShowAuthModal(false)
      setLogoClickCount(0)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setSelectedProject(null)
    setSelectedExpert(null)
    setShowProjectModal(false)
    setShowExpertModal(false)
    setLogoClickCount(0)
  }, [])

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false)
    setLogoClickCount(0)
  }, [])

  const resetClickCount = useCallback(() => {
    setLogoClickCount(0)
  }, [])

  const createProjectHandler = useCallback(
    (data: ProjectFormData) => {
      const newProject = createNewProject(data)
      const updatedProjects = [newProject, ...projects]
      setProjects(updatedProjects)
      setShowProjectModal(false)
      setSelectedProject(null)

      // Sincroniza com os episódios
      updateEpisodesFromProjects(updatedProjects)
    },
    [projects, setProjects],
  )

  const updateProjectHandler = useCallback(
    (id: string | number, data: Partial<ProjectFormData>) => {
      const updatedProjects = projects.map((project) =>
        String(project.id) === String(id) ? { ...project, ...data, updatedAt: new Date().toISOString() } : project,
      )

      setProjects(updatedProjects)
      setShowProjectModal(false)
      setSelectedProject(null)

      // Sincroniza com os episódios
      updateEpisodesFromProjects(updatedProjects)
    },
    [projects, setProjects],
  )

  const deleteProjectHandler = useCallback(
    (id: string | number) => {
      // Não permitir excluir episódios originais
      const isOriginalEpisode = episodes.some((e) => String(e.id) === String(id))

      if (isOriginalEpisode) {
        alert("Não é possível excluir episódios originais do sistema.")
        return
      }

      const updatedProjects = projects.filter((project) => String(project.id) !== String(id))
      setProjects(updatedProjects)

      if (selectedProject && String(selectedProject.id) === String(id)) {
        setSelectedProject(null)
      }

      // Sincroniza com os episódios
      updateEpisodesFromProjects(updatedProjects)
    },
    [projects, setProjects, selectedProject],
  )

  const selectProject = useCallback((project: Project | null) => {
    setSelectedProject(project)
  }, [])

  const openProjectModal = useCallback((project?: Project) => {
    if (project) {
      setSelectedProject(project)
      setIsEditing(true)
    } else {
      setSelectedProject(null)
      setIsEditing(false)
    }
    setShowProjectModal(true)
  }, [])

  const closeProjectModal = useCallback(() => {
    setShowProjectModal(false)
    setSelectedProject(null)
    setIsEditing(false)
  }, [])

  const openExpertModal = useCallback((expert?: ProjectExpert) => {
    if (expert) {
      setSelectedExpert(expert)
      setIsEditingExpert(true)
    } else {
      setSelectedExpert(null)
      setIsEditingExpert(false)
    }
    setShowExpertModal(true)
  }, [])

  const closeExpertModal = useCallback(() => {
    setShowExpertModal(false)
    setSelectedExpert(null)
    setIsEditingExpert(false)
  }, [])

  const convertEpisodeToProject = useCallback(
    (episode: Episode) => {
      const project = episodeToProject(episode)

      // Verifica se o projeto já existe
      const existingProject = projects.find((p) => String(p.id) === String(project.id))

      if (!existingProject) {
        setProjects([project, ...projects])
      }

      // Abre o modal para edição
      setSelectedProject(project)
      setIsEditing(true)
      setShowProjectModal(true)
    },
    [projects, setProjects],
  )

  // Wrapper para as funções de expert que fecham o modal
  const createExpertHandler = useCallback(
    (data: Omit<ProjectExpert, "id">) => {
      createExpert(data)
      closeExpertModal()
    },
    [createExpert],
  )

  const updateExpertHandler = useCallback(
    (id: string, data: Omit<ProjectExpert, "id">) => {
      updateExpert(id, data)
      closeExpertModal()
    },
    [updateExpert],
  )

  const value: DashboardContextType = {
    isAuthenticated,
    logoClickCount,
    showAuthModal,
    projects,
    experts,
    selectedProject,
    selectedExpert,
    showProjectModal,
    showExpertModal,
    isEditing,
    isEditingExpert,
    activeTab,
    handleLogoClick,
    authenticate,
    logout,
    closeAuthModal,
    createProject: createProjectHandler,
    updateProject: updateProjectHandler,
    deleteProject: deleteProjectHandler,
    selectProject,
    openProjectModal,
    closeProjectModal,
    resetClickCount,
    setActiveTab,
    convertEpisodeToProject,
    createExpert: createExpertHandler,
    updateExpert: updateExpertHandler,
    deleteExpert,
    openExpertModal,
    closeExpertModal,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
