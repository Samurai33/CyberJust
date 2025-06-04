"use client"

import {
  Clock,
  Calendar,
  Tag,
  AlertTriangle,
  FileText,
  Mic,
  Music,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDashboard } from "@/contexts/DashboardContext"
import { getStatusColor, getThreatColor } from "@/lib/utils"

export function ProjectDetails() {
  const {
    selectedProject,
    closeProjectDetails,
    openProjectModal,
    openTimelineModal,
    openResourceModal,
    openTranscriptModal,
    openAudioModal,
    editTimelineEvent,
    deleteTimelineEvent,
    editResource,
    deleteResource,
    editTranscript,
    deleteTranscript,
    showConfirmation,
  } = useDashboard()

  if (!selectedProject) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case "article":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "report":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "law":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "guide":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "video":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const getTranscriptTypeColor = (type: string) => {
    switch (type) {
      case "narration":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "interview":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "expert":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "victim":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <div className="fixed inset-0 z-[140] bg-black/95 backdrop-blur-sm overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={closeProjectDetails} className="text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={() => openProjectModal(selectedProject)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Episódio
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700 mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(selectedProject.status)} variant="outline">
                    {selectedProject.status}
                  </Badge>
                  <Badge className={getThreatColor(selectedProject.threat)} variant="outline">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {selectedProject.threat}
                  </Badge>
                </div>
                <CardTitle className="text-2xl text-cyan-400 font-mono">{selectedProject.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedProject.date}
                  </div>
                  {selectedProject.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedProject.duration}
                    </div>
                  )}
                  {selectedProject.category && <span>{selectedProject.category}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-6">{selectedProject.description}</p>
                {selectedProject.fullDescription && (
                  <div className="mb-6">
                    <h3 className="text-lg font-mono text-cyan-400 mb-2">DESCRIÇÃO COMPLETA</h3>
                    <p className="text-gray-300">{selectedProject.fullDescription}</p>
                  </div>
                )}

                {/* Tags */}
                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-mono text-cyan-400 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      TAGS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-gray-300 border-gray-600">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {selectedProject.keyPoints && selectedProject.keyPoints.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-mono text-cyan-400 mb-2">PONTOS PRINCIPAIS</h3>
                    <ul className="space-y-2">
                      {selectedProject.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                          <span className="text-cyan-400">▶</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {selectedProject.warnings && selectedProject.warnings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-mono text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      AVISOS
                    </h3>
                    <ul className="space-y-2">
                      {selectedProject.warnings.map((warning, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-red-300 bg-red-900/20 border border-red-500/30 p-2 rounded"
                        >
                          <AlertTriangle className="w-4 h-4 mt-0.5" />
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Audio */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-mono text-cyan-400 flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      ÁUDIO
                    </h3>
                    <Button size="sm" variant="outline" onClick={() => openAudioModal(selectedProject)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Gerenciar Áudio
                    </Button>
                  </div>
                  {selectedProject.audioUrl ? (
                    <div className="bg-gray-800 p-4 rounded-md">
                      <audio controls className="w-full">
                        <source src={selectedProject.audioUrl} type="audio/mpeg" />
                        Seu navegador não suporta o elemento de áudio.
                      </audio>
                    </div>
                  ) : (
                    <p className="text-gray-400">Nenhum áudio associado a este episódio.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="timeline" className="mb-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-700">
                <TabsTrigger
                  value="timeline"
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                >
                  TIMELINE
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                >
                  RECURSOS
                </TabsTrigger>
                <TabsTrigger
                  value="transcript"
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                >
                  TRANSCRIÇÃO
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-4">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-mono text-cyan-400">TIMELINE DO CASO</CardTitle>
                    <Button size="sm" onClick={() => openTimelineModal(selectedProject)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Evento
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {selectedProject.timeline && selectedProject.timeline.length > 0 ? (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />
                        <div className="space-y-6">
                          {selectedProject.timeline.map((event) => (
                            <div key={event.id} className="relative pl-10">
                              <div
                                className={`absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center ${
                                  getSeverityColor(event.severity).split(" ")[0]
                                }`}
                              >
                                <Clock className="w-4 h-4" />
                              </div>
                              <div className="bg-gray-800 p-4 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={getSeverityColor(event.severity)} variant="outline">
                                      {event.severity.toUpperCase()}
                                    </Badge>
                                    <Badge
                                      className={
                                        event.completed
                                          ? "bg-green-500/20 text-green-400 border-green-500/50"
                                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                      }
                                      variant="outline"
                                    >
                                      {event.completed ? "CONCLUÍDO" : "PENDENTE"}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-400">{event.date}</div>
                                </div>
                                <h4 className="text-white font-medium mb-2">{event.title}</h4>
                                <p className="text-gray-300 text-sm">{event.description}</p>
                                <div className="flex justify-end gap-2 mt-4">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => editTimelineEvent(selectedProject.id, event)}
                                    className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/20"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      showConfirmation({
                                        title: "Excluir Evento",
                                        message: "Tem certeza que deseja excluir este evento da timeline?",
                                        confirmText: "Excluir",
                                        onConfirm: () => deleteTimelineEvent(selectedProject.id, event.id),
                                      })
                                    }
                                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Excluir
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Nenhum evento na timeline.</p>
                        <Button onClick={() => openTimelineModal(selectedProject)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeiro Evento
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-mono text-cyan-400">RECURSOS</CardTitle>
                    <Button size="sm" onClick={() => openResourceModal(selectedProject)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Recurso
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {selectedProject.resources && selectedProject.resources.length > 0 ? (
                      <div className="grid gap-4">
                        {selectedProject.resources.map((resource) => (
                          <div key={resource.id} className="bg-gray-800 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={getResourceTypeColor(resource.type)} variant="outline">
                                {resource.type.toUpperCase()}
                              </Badge>
                              <div className="text-sm text-gray-400">{resource.source}</div>
                            </div>
                            <h4 className="text-white font-medium mb-2">{resource.title}</h4>
                            <p className="text-gray-300 text-sm mb-3">{resource.description}</p>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline text-sm flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              {resource.url}
                            </a>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => editResource(selectedProject.id, resource)}
                                className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/20"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  showConfirmation({
                                    title: "Excluir Recurso",
                                    message: "Tem certeza que deseja excluir este recurso?",
                                    confirmText: "Excluir",
                                    onConfirm: () => deleteResource(selectedProject.id, resource.id),
                                  })
                                }
                                className="text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Nenhum recurso disponível.</p>
                        <Button onClick={() => openResourceModal(selectedProject)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeiro Recurso
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcript" className="mt-4">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-mono text-cyan-400">TRANSCRIÇÃO</CardTitle>
                    <Button size="sm" onClick={() => openTranscriptModal(selectedProject)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Segmento
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {selectedProject.transcript && selectedProject.transcript.length > 0 ? (
                      <div className="space-y-4">
                        {selectedProject.transcript.map((segment) => (
                          <div key={segment.id} className="bg-gray-800 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={getTranscriptTypeColor(segment.type || "narration")} variant="outline">
                                {segment.type?.toUpperCase() || "NARRAÇÃO"}
                              </Badge>
                              <div className="text-sm text-gray-400">{segment.timestamp}</div>
                            </div>
                            <h4 className="text-white font-medium mb-2">{segment.speaker}</h4>
                            <p className="text-gray-300 text-sm">{segment.text}</p>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => editTranscript(selectedProject.id, segment)}
                                className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/20"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  showConfirmation({
                                    title: "Excluir Segmento",
                                    message: "Tem certeza que deseja excluir este segmento da transcrição?",
                                    confirmText: "Excluir",
                                    onConfirm: () => deleteTranscript(selectedProject.id, segment.id),
                                  })
                                }
                                className="text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Mic className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Nenhuma transcrição disponível.</p>
                        <Button onClick={() => openTranscriptModal(selectedProject)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeiro Segmento
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            {/* Experts */}
            <Card className="bg-gray-900 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-mono text-cyan-400">ESPECIALISTAS</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProject.experts && selectedProject.experts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedProject.experts.map((expert) => (
                      <div key={expert.id} className="bg-gray-800 p-4 rounded-md">
                        <h4 className="text-white font-medium">{expert.name}</h4>
                        <p className="text-cyan-400 text-sm">{expert.role}</p>
                        {expert.organization && <p className="text-gray-400 text-xs mb-2">{expert.organization}</p>}
                        <p className="text-gray-300 text-sm">{expert.bio}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">Nenhum especialista associado a este episódio.</p>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-mono text-cyan-400">METADADOS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID:</span>
                    <span className="text-gray-300 font-mono">{selectedProject.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Criado em:</span>
                    <span className="text-gray-300">{selectedProject.createdAt || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Atualizado em:</span>
                    <span className="text-gray-300">{selectedProject.updatedAt || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Versão:</span>
                    <span className="text-gray-300">{selectedProject.version || "1.0"}</span>
                  </div>
                  {selectedProject.author && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Autor:</span>
                      <span className="text-gray-300">{selectedProject.author}</span>
                    </div>
                  )}
                  {selectedProject.views && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visualizações:</span>
                      <span className="text-gray-300">{selectedProject.views.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedProject.rating && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avaliação:</span>
                      <span className="text-gray-300">{selectedProject.rating}/5</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
