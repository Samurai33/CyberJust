"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Save, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "@/contexts/DashboardContext"
import type { TimelineEvent } from "@/types/project"

export function TimelineModal() {
  const {
    showTimelineModal,
    selectedProject,
    selectedTimeline,
    isEditingTimeline,
    closeTimelineModal,
    addTimelineEvent,
    updateTimelineEvent,
  } = useDashboard()

  const [formData, setFormData] = useState<Omit<TimelineEvent, "id">>({
    date: "",
    title: "",
    description: "",
    severity: "medium",
    completed: false,
  })

  useEffect(() => {
    if (selectedTimeline && isEditingTimeline) {
      setFormData({
        date: selectedTimeline.date,
        title: selectedTimeline.title,
        description: selectedTimeline.description,
        severity: selectedTimeline.severity,
        completed: selectedTimeline.completed,
      })
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        title: "",
        description: "",
        severity: "medium",
        completed: false,
      })
    }
  }, [selectedTimeline, isEditingTimeline, showTimelineModal])

  if (!showTimelineModal || !selectedProject) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditingTimeline && selectedTimeline) {
      updateTimelineEvent(selectedProject.id, selectedTimeline.id, formData)
    } else {
      addTimelineEvent(selectedProject.id, formData)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-black border-2 border-cyan-500/50 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/25">
        <CardHeader className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Clock className="w-5 h-5 text-black" />
              </div>
              <CardTitle className="text-cyan-400 font-mono">
                {isEditingTimeline ? "EDITAR EVENTO" : "NOVO EVENTO"}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeTimelineModal}
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
                <label className="block text-sm text-gray-400 mb-2 font-mono">DATA:</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="bg-gray-900 border-cyan-500/30 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">TÍTULO:</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do evento..."
                  className="bg-gray-900 border-cyan-500/30 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">DESCRIÇÃO:</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do evento..."
                  className="bg-gray-900 border-cyan-500/30 text-white min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">SEVERIDADE:</label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: "critical" | "high" | "medium" | "low") =>
                      setFormData((prev) => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger className="bg-gray-900 border-cyan-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">CRÍTICO</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">ALTO</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">MÉDIO</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">BAIXO</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">STATUS:</label>
                  <Select
                    value={formData.completed ? "completed" : "pending"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, completed: value === "completed" }))}
                  >
                    <SelectTrigger className="bg-gray-900 border-cyan-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">CONCLUÍDO</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">PENDENTE</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditingTimeline ? "ATUALIZAR EVENTO" : "ADICIONAR EVENTO"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeTimelineModal}
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
