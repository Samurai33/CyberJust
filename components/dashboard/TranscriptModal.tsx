"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Save, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDashboard } from "@/contexts/DashboardContext"
import type { TranscriptSegment } from "@/types/project"

export function TranscriptModal() {
  const {
    showTranscriptModal,
    selectedProject,
    selectedTranscript,
    isEditingTranscript,
    closeTranscriptModal,
    addTranscript,
    updateTranscript,
  } = useDashboard()

  const [formData, setFormData] = useState<Omit<TranscriptSegment, "id">>({
    timestamp: "00:00",
    speaker: "",
    text: "",
    type: "narration",
  })

  useEffect(() => {
    if (selectedTranscript && isEditingTranscript) {
      setFormData({
        timestamp: selectedTranscript.timestamp,
        speaker: selectedTranscript.speaker,
        text: selectedTranscript.text,
        type: selectedTranscript.type || "narration",
      })
    } else {
      setFormData({
        timestamp: "00:00",
        speaker: "",
        text: "",
        type: "narration",
      })
    }
  }, [selectedTranscript, isEditingTranscript, showTranscriptModal])

  if (!showTranscriptModal || !selectedProject) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditingTranscript && selectedTranscript) {
      updateTranscript(selectedProject.id, selectedTranscript.id, formData)
    } else {
      addTranscript(selectedProject.id, formData)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-black border-2 border-cyan-500/50 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/25">
        <CardHeader className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Mic className="w-5 h-5 text-black" />
              </div>
              <CardTitle className="text-cyan-400 font-mono">
                {isEditingTranscript ? "EDITAR TRANSCRIÇÃO" : "NOVA TRANSCRIÇÃO"}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeTranscriptModal}
              className="text-gray-400 hover:text-white hover:bg-red-500/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">TIMESTAMP:</label>
                <Input
                  value={formData.timestamp}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timestamp: e.target.value }))}
                  placeholder="00:00"
                  className="bg-gray-900 border-cyan-500/30 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 font-mono">TIPO:</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "narration" | "interview" | "expert" | "victim") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-900 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narration">Narração</SelectItem>
                    <SelectItem value="interview">Entrevista</SelectItem>
                    <SelectItem value="expert">Especialista</SelectItem>
                    <SelectItem value="victim">Vítima</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">LOCUTOR:</label>
              <Input
                value={formData.speaker}
                onChange={(e) => setFormData((prev) => ({ ...prev, speaker: e.target.value }))}
                placeholder="Nome do locutor..."
                className="bg-gray-900 border-cyan-500/30 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">TEXTO:</label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="Texto da transcrição..."
                className="bg-gray-900 border-cyan-500/30 text-white min-h-[150px]"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditingTranscript ? "ATUALIZAR TRANSCRIÇÃO" : "ADICIONAR TRANSCRIÇÃO"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeTranscriptModal}
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
