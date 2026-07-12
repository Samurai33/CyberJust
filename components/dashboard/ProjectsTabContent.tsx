"use client"

import { Plus, Search, FolderOpen, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectCard } from "./ProjectCard"
import { DashboardSelect } from "./DashboardSelect"
import { EPISODE_STATUS, THREAT_LEVELS } from "@/lib/constants"
import { PROJECT_CATEGORIES } from "@/lib/projectUtils"
import type { Project } from "@/types/project"

interface ProjectsTabContentProps {
  projects: Project[]
  filteredProjects: Project[]
  searchTerm: string
  onSearchTermChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  threatFilter: string
  onThreatFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  onOpenProjectModal: () => void
}

export function ProjectsTabContent({
  projects,
  filteredProjects,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  threatFilter,
  onThreatFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  onOpenProjectModal,
}: ProjectsTabContentProps) {
  return (
    <>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onToggleFilters} className="border-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              FILTROS
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-red-400 hover:text-red-300">
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
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <DashboardSelect
              value={statusFilter}
              onValueChange={onStatusFilterChange}
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
              onValueChange={onThreatFilterChange}
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
              onValueChange={onCategoryFilterChange}
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
                onClick={onOpenProjectModal}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                CRIAR PRIMEIRO EPISÓDIO
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
