"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Save, Link, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDashboard } from "@/contexts/DashboardContext"
import type { ProjectResource } from "@/types/project"

export function ResourceModal() {
  const {
    showResourceModal,
    selectedProject,
    selectedResource,
    isEditingResource,
    closeResourceModal,
    addResource,
    updateResource,
  } = useDashboard()

  const [formData, setFormData] = useState<Omit<ProjectResource, "id">>({
    title: "",
    url: "",
    type: "article",
    description: "",
    source: "",
  })

  useEffect(() => {
    if (selectedResource && isEditingResource) {
      setFormData({
        title: selectedResource.title,
        url: selectedResource.url,
        type: selectedResource.type,
        description: selectedResource.description,
        source: selectedResource.source,
      })
    } else {
      setFormData({
        title: "",
        url: "",
        type: "article",
        description: "",
        source: "",
      })
    }
  }, [selectedResource, isEditingResource, showResourceModal])

  if (!showResourceModal || !selectedProject) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditingResource && selectedResource) {
      updateResource(selectedProject.id, selectedResource.id, formData)
    } else {
      addResource(selectedProject.id, formData)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-black border-2 border-cyan-500/50 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/25">
        <CardHeader className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-black" />
              </div>
              <CardTitle className="text-cyan-400 font-mono">
                {isEditingResource ? "EDITAR RECURSO" : "NOVO RECURSO"}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeResourceModal}
              className="text-gray-400 hover:text-white hover:bg-red-500/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">TÍTULO:</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do recurso..."
                  className="bg-gray-900 border-cyan-500/30 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">URL:</label>
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="URL do recurso..."
                    className="bg-gray-900 border-cyan-500/30 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">TIPO:</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "article" | "report" | "law" | "guide" | "video" | "document") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-900 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Artigo</SelectItem>
                    <SelectItem value="report">Relatório</SelectItem>
                    <SelectItem value="law">Legislação</SelectItem>
                    <SelectItem value="guide">Guia</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">FONTE:</label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
                  placeholder="Fonte do recurso..."
                  className="bg-gray-900 border-cyan-500/30 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">DESCRIÇÃO:</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do recurso..."
                  className="bg-gray-900 border-cyan-500/30 text-white min-h-[100px]"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditingResource ? "ATUALIZAR RECURSO" : "ADICIONAR RECURSO"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeResourceModal}
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                CANCELAR
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
