"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Upload, Save, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useDashboard } from "@/contexts/DashboardContext"

export function AudioUploadModal() {
  const { showAudioModal, selectedProject, closeAudioModal, updateProjectAudio } = useDashboard()
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!showAudioModal || !selectedProject) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type.includes("audio")) {
        setFile(selectedFile)
      } else {
        alert("Por favor, selecione um arquivo de áudio válido.")
      }
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAudioUrl(e.target.value)
  }

  const simulateUpload = () => {
    if (!file) return

    setUploading(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)

          // Em um ambiente real, aqui seria onde o arquivo seria realmente enviado
          // e a URL retornada seria usada para atualizar o projeto
          const simulatedUrl = `/audio/${file.name}`
          updateProjectAudio(selectedProject.id, simulatedUrl)

          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handleUrlSubmit = () => {
    if (!audioUrl) return
    updateProjectAudio(selectedProject.id, audioUrl)
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-black border-2 border-cyan-500/50 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/25">
        <CardHeader className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Music className="w-5 h-5 text-black" />
              </div>
              <CardTitle className="text-cyan-400 font-mono">GERENCIAR ÁUDIO</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeAudioModal}
              className="text-gray-400 hover:text-white hover:bg-red-500/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-8">
            {/* Áudio atual */}
            <div className="space-y-2">
              <h3 className="text-lg font-mono text-cyan-400">ÁUDIO ATUAL</h3>
              {selectedProject.audioUrl ? (
                <div className="bg-gray-900 p-4 rounded-md">
                  <p className="text-white mb-2">{selectedProject.audioUrl}</p>
                  <audio controls className="w-full">
                    <source src={selectedProject.audioUrl} type="audio/mpeg" />
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>
              ) : (
                <p className="text-gray-400">Nenhum áudio associado a este episódio.</p>
              )}
            </div>

            {/* Upload de arquivo */}
            <div className="space-y-4">
              <h3 className="text-lg font-mono text-cyan-400">UPLOAD DE ARQUIVO</h3>
              <div className="bg-gray-900/50 border border-dashed border-gray-700 rounded-md p-8 text-center">
                <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="mb-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </Button>
                {file && (
                  <div className="text-sm text-gray-300 mt-2">
                    <p>Arquivo selecionado: {file.name}</p>
                    <p>Tamanho: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              {file && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-end">
                    <Button
                      onClick={simulateUpload}
                      disabled={uploading}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                    >
                      {uploading ? "Enviando..." : "Enviar Arquivo"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* URL externa */}
            <div className="space-y-4">
              <h3 className="text-lg font-mono text-cyan-400">URL EXTERNA</h3>
              <div className="space-y-2">
                <Input
                  value={audioUrl}
                  onChange={handleUrlChange}
                  placeholder="https://exemplo.com/audio.mp3"
                  className="bg-gray-900 border-cyan-500/30 text-white"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleUrlSubmit}
                    disabled={!audioUrl}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar URL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
