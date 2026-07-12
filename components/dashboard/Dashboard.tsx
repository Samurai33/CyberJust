"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { useDebounce } from "@/hooks/useDebounce"
import { Plus, LogOut, BarChart3, FolderOpen, Settings, Radio, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDashboard } from "@/contexts/DashboardContext"
import { useAuth } from "@/contexts/AuthContext"
import { ProjectsTabContent } from "./ProjectsTabContent"
import { HomepageEpisodesTabContent } from "./HomepageEpisodesTabContent"
import { ExpertsTabContent } from "./ExpertsTabContent"

// Deferred to their own chunks — react-hook-form + zod forms only needed once a modal opens (#34).
const ProjectModal = dynamic(() => import("./ProjectModal").then((mod) => mod.ProjectModal), { ssr: false })
const ExpertModal = dynamic(() => import("./ExpertModal").then((mod) => mod.ExpertModal), { ssr: false })

export function Dashboard() {
  const {
    projects,
    experts,
    openProjectModal,
    openExpertModal,
    activeTab,
    setActiveTab,
    convertEpisodeToProject,
  } = useDashboard()
  const { logout } = useAuth()

  // Project filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [threatFilter, setThreatFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Expert filters
  const [expertSearchTerm, setExpertSearchTerm] = useState("")

  // Filter states
  const [showFilters, setShowFilters] = useState(false)

  const clearFilters = useCallback(() => {
    setSearchTerm("")
    setStatusFilter("all")
    setThreatFilter("all")
    setCategoryFilter("all")
    setExpertSearchTerm("")
  }, [])

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchLower = debouncedSearchTerm.toLowerCase()
      const matchesSearch =
        !debouncedSearchTerm ||
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        (project.fullDescription && project.fullDescription.toLowerCase().includes(searchLower)) ||
        (project.tags && project.tags.some((tag) => tag.toLowerCase().includes(searchLower))) ||
        (project.category && project.category.toLowerCase().includes(searchLower))

      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      const matchesThreat = threatFilter === "all" || project.threat === threatFilter
      const matchesCategory = categoryFilter === "all" || project.category === categoryFilter

      return matchesSearch && matchesStatus && matchesThreat && matchesCategory
    })
  }, [projects, debouncedSearchTerm, statusFilter, threatFilter, categoryFilter])

  const filteredExperts = useMemo(() => {
    return experts.filter((expert) => {
      const searchLower = expertSearchTerm.toLowerCase()
      return (
        !expertSearchTerm ||
        expert.name.toLowerCase().includes(searchLower) ||
        expert.role.toLowerCase().includes(searchLower) ||
        expert.bio.toLowerCase().includes(searchLower) ||
        (expert.organization && expert.organization.toLowerCase().includes(searchLower))
      )
    })
  }, [experts, expertSearchTerm])

  const stats = useMemo(
    () => ({
      total: projects.length,
      scheduled: projects.filter((p) => p.status === "AGENDADO").length,
      resolved: projects.filter((p) => p.status === "RESOLVIDO").length,
      active: projects.filter((p) => p.status === "ATIVO").length,
      experts: experts.length,
    }),
    [projects, experts],
  )

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || threatFilter !== "all" || categoryFilter !== "all" || expertSearchTerm

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-mono">
              PAINEL DE GERENCIAMENTO
            </h1>
            <p className="text-gray-400 mt-2">Sistema de controle de episódios e agentes</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => openProjectModal()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              NOVO EPISÓDIO
            </Button>
            <Button variant="outline" onClick={logout} className="border-red-500/50 text-red-400 hover:bg-red-500/20">
              <LogOut className="w-4 h-4 mr-2" />
              SAIR
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Total de Episódios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Episódios Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Agendados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.scheduled}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Resolvidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.resolved}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Agentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.experts}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              MEUS EPISÓDIOS
            </TabsTrigger>
            <TabsTrigger value="homepage" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              EPISÓDIOS DA HOMEPAGE
            </TabsTrigger>
            <TabsTrigger value="experts" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              AGENTES ESPECIALIZADOS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <ProjectsTabContent
              projects={projects}
              filteredProjects={filteredProjects}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              threatFilter={threatFilter}
              onThreatFilterChange={setThreatFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((prev) => !prev)}
              hasActiveFilters={!!hasActiveFilters}
              onClearFilters={clearFilters}
              onOpenProjectModal={() => openProjectModal()}
            />
          </TabsContent>

          <TabsContent value="homepage" className="mt-6">
            <HomepageEpisodesTabContent onConvertEpisodeToProject={convertEpisodeToProject} />
          </TabsContent>

          <TabsContent value="experts" className="mt-6">
            <ExpertsTabContent
              experts={experts}
              filteredExperts={filteredExperts}
              expertSearchTerm={expertSearchTerm}
              onExpertSearchTermChange={setExpertSearchTerm}
              onOpenExpertModal={() => openExpertModal()}
            />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <ProjectModal />
        <ExpertModal />
      </div>
    </div>
  )
}
