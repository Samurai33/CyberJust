"use client"

import { Edit, Trash2, Calendar, Clock, AlertTriangle, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "@/contexts/DashboardContext"
import { useAudio } from "@/contexts/AudioContext"
import { getStatusColor, getThreatColor } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Project } from "@/types/project"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { openProjectModal, deleteProject } = useDashboard()
  const { playEpisode, isEpisodePlaying, togglePlayPause, isLoading, currentEpisode } = useAudio()

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir o episódio "${project.title}"?`)) {
      deleteProject(project.id)
    }
  }

  const handlePlayEpisode = () => {
    if (!project.audioUrl) return

    if (isEpisodePlaying(project.id)) {
      togglePlayPause()
    } else {
      playEpisode(project)
    }
  }

  const isCurrentlyPlaying = isEpisodePlaying(project.id)
  const hasAudio = !!project.audioUrl

  return (
    <Card className="bg-gray-900 border-gray-700 hover:border-cyan-500/50 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(project.status)} variant="outline">
                {project.status}
              </Badge>
              <Badge className={getThreatColor(project.threat)} variant="outline">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {project.threat}
              </Badge>
              {isCurrentlyPlaying && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs animate-pulse">
                  REPRODUZINDO
                </Badge>
              )}
            </div>
            <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">{project.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {project.date}
              </div>
              {project.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {project.duration}
                </div>
              )}
              {project.category && <span>{project.category}</span>}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openProjectModal(project)}
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/20"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-300 text-sm line-clamp-2">{project.description}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className={`${
              hasAudio
                ? isCurrentlyPlaying
                  ? "bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500"
                  : "bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
                : "bg-gray-600 hover:bg-gray-500 cursor-not-allowed"
            }`}
            onClick={handlePlayEpisode}
            disabled={isLoading || !hasAudio}
          >
            {isLoading && currentEpisode?.id === project.id ? (
              <LoadingSpinner size="sm" className="mr-1" />
            ) : isCurrentlyPlaying ? (
              <Pause className="w-3 h-3 mr-1" />
            ) : (
              <Play className="w-3 h-3 mr-1" />
            )}
            {!hasAudio
              ? "SEM ÁUDIO"
              : isLoading && currentEpisode?.id === project.id
                ? "CARREGANDO..."
                : isCurrentlyPlaying
                  ? "PAUSAR"
                  : "REPRODUZIR"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openProjectModal(project)}
            className="border-gray-600 text-gray-300 hover:text-white"
          >
            DETALHES
          </Button>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Key Points */}
        {project.keyPoints && project.keyPoints.length > 0 && (
          <div className="mt-2">
            <h4 className="text-xs font-semibold text-cyan-400 mb-1">PONTOS PRINCIPAIS:</h4>
            <div className="text-xs text-gray-400">
              {project.keyPoints.length} ponto{project.keyPoints.length !== 1 ? "s" : ""} registrado
              {project.keyPoints.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
