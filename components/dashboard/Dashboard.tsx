"use client"

import { useState, useCallback, useMemo } from "react"
import {
  Plus,
  Search,
  LogOut,
  BarChart3,
  FolderOpen,
  Settings,
  Radio,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Filter,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "@/contexts/DashboardContext"
import { ProjectCard } from "./ProjectCard"
import { ProjectModal } from "./ProjectModal"
import { ExpertCard } from "./ExpertCard"
import { ExpertModal } from "./ExpertModal"
import { episodes } from "@/data/episodes"
import { EPISODE_STATUS, THREAT_LEVELS } from "@/lib/constants"
import { PROJECT_CATEGORIES } from "@/lib/projectUtils"
import { DashboardSelect } from "./DashboardSelect"

const getStatusColor = (status: string) => {
  switch (status) {
    case "EM_ANDAMENTO":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "CONCLUIDO":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "ATIVO":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

const getThreatColor = (threat: string) => {
  switch (threat) {
    case "CRÍTICO":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    case "ALTO":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    case "MÉDIO":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "BAIXO":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

export function Dashboard() {
  const {
    projects,
    experts,
    openProjectModal,
    openExpertModal,
    logout,
    activeTab,
    setActiveTab,
    convertEpisodeToProject,
  } = useDashboard()

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

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
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
  }, [projects, searchTerm, statusFilter, threatFilter, categoryFilter])

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
      inProgress: projects.filter((p) => p.status === "EM_ANDAMENTO").length,
      completed: projects.filter((p) => p.status === "CONCLUIDO").length,
      active: projects.filter((p) => p.status === "ATIVO").length,
      experts: experts.length,
    }),
    [projects, experts],
  )

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm || statusFilter !== "all" || threatFilter !== "all" || categoryFilter !== "all" || expertSearchTerm
    )
  }, [searchTerm, statusFilter, threatFilter, categoryFilter, expertSearchTerm])

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.completed}</div>
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
            {/* Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-gray-600"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    FILTROS
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      LIMPAR
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {filteredProjects.length} de {projects.length} episódios
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar episódios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <DashboardSelect
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    placeholder="Status"
                    options={[
                      { value: "all", label: "Todos os Status" },
                      ...Object.keys(EPISODE_STATUS).map((status) => ({
                        value: status,
                        label: status,
                      })),
                    ]}
                    className="w-full md:w-48"
                  />

                  <DashboardSelect
                    value={threatFilter}
                    onValueChange={setThreatFilter}
                    placeholder="Nível de Ameaça"
                    options={[
                      { value: "all", label: "Todas as Ameaças" },
                      ...Object.keys(THREAT_LEVELS).map((threat) => ({
                        value: threat,
                        label: threat,
                      })),
                    ]}
                    className="w-full md:w-48"
                  />

                  <DashboardSelect
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    placeholder="Categoria"
                    options={[
                      { value: "all", label: "Todas as Categorias" },
                      ...PROJECT_CATEGORIES.map((category) => ({
                        value: category,
                        label: category,
                      })),
                    ]}
                    className="w-full md:w-48"
                  />
                </div>
              )}
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center">
                  <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-400 mb-2">Nenhum episódio encontrado</h3>
                  <p className="text-gray-500 mb-6">
                    {projects.length === 0
                      ? "Comece criando seu primeiro episódio."
                      : hasActiveFilters
                        ? "Tente ajustar os filtros de busca."
                        : "Nenhum episódio disponível."}
                  </p>
                  {projects.length === 0 && (
                    <Button
                      onClick={() => openProjectModal()}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      CRIAR PRIMEIRO EPISÓDIO
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="homepage" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {episodes.map((episode) => (
                <Card
                  key={episode.id}
                  className="bg-gray-900 border-gray-700 hover:border-cyan-500/50 transition-all duration-300 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(episode.status)} variant="outline">
                            {episode.status}
                          </Badge>
                          <Badge className={getThreatColor(episode.threat)} variant="outline">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {episode.threat}
                          </Badge>
                        </div>
                        <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                          {episode.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {episode.date}
                          </div>
                          {episode.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {episode.duration}
                            </div>
                          )}
                          {episode.category && <span>{episode.category}</span>}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm line-clamp-2">{episode.description}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => convertEpisodeToProject(episode)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        IMPORTAR PARA DASHBOARD
                      </Button>
                    </div>

                    {/* Tags */}
                    {episode.tags && episode.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {episode.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {tag}
                          </Badge>
                        ))}
                        {episode.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            +{episode.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="experts" className="mt-6">
            {/* Experts Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar agentes..."
                  value={expertSearchTerm}
                  onChange={(e) => setExpertSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  {filteredExperts.length} de {experts.length} agentes
                </div>
                <Button
                  onClick={() => openExpertModal()}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  NOVO AGENTE
                </Button>
              </div>
            </div>

            {/* Experts Grid */}
            {filteredExperts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperts.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-400 mb-2">Nenhum agente encontrado</h3>
                  <p className="text-gray-500 mb-6">
                    {experts.length === 0
                      ? "Comece adicionando seu primeiro agente especializado."
                      : "Tente ajustar os filtros de busca."}
                  </p>
                  {experts.length === 0 && (
                    <Button
                      onClick={() => openExpertModal()}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      ADICIONAR PRIMEIRO AGENTE
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <ProjectModal />
        <ExpertModal />
      </div>
    </div>
  )
}
