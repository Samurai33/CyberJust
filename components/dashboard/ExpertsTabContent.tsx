"use client"

import { Plus, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ExpertCard } from "./ExpertCard"
import type { ProjectExpert } from "@/types/project"

interface ExpertsTabContentProps {
  experts: ProjectExpert[]
  filteredExperts: ProjectExpert[]
  expertSearchTerm: string
  onExpertSearchTermChange: (value: string) => void
  onOpenExpertModal: () => void
}

export function ExpertsTabContent({
  experts,
  filteredExperts,
  expertSearchTerm,
  onExpertSearchTermChange,
  onOpenExpertModal,
}: ExpertsTabContentProps) {
  return (
    <>
      {/* Experts Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar agentes..."
            value={expertSearchTerm}
            onChange={(e) => onExpertSearchTermChange(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-white"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {filteredExperts.length} de {experts.length} agentes
          </div>
          <Button
            onClick={onOpenExpertModal}
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
                onClick={onOpenExpertModal}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                ADICIONAR PRIMEIRO AGENTE
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
