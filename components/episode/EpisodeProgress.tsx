"use client"

import { CheckCircle, Clock, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEpisodeProgress } from "@/hooks/useEpisodeProgress"
import { useAudio } from "@/contexts/AudioContext"

interface EpisodeProgressProps {
  episodeId: string
}

export function EpisodeProgress({ episodeId }: EpisodeProgressProps) {
  const { getProgress, resetProgress } = useEpisodeProgress()
  const { formatTime } = useAudio()

  const progress = getProgress(episodeId)

  if (!progress) {
    return null
  }

  const progressPercentage = (progress.currentTime / progress.duration) * 100

  return (
    <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {progress.completed ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Clock className="w-5 h-5 text-cyan-400" />
            )}
            <span className="text-white font-mono text-sm">
              {progress.completed ? "EPISÓDIO CONCLUÍDO" : "PROGRESSO"}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => resetProgress(episodeId)}
            className="text-gray-400 hover:text-white h-6 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            RESETAR
          </Button>
        </div>

        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2 bg-gray-800" />
          <div className="flex justify-between text-xs text-gray-400 font-mono">
            <span>{formatTime(progress.currentTime)}</span>
            <span>{Math.round(progressPercentage)}%</span>
            <span>{formatTime(progress.duration)}</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Última reprodução: {progress.lastPlayed.toLocaleDateString("pt-BR")} às{" "}
          {progress.lastPlayed.toLocaleTimeString("pt-BR")}
        </div>
      </CardContent>
    </Card>
  )
}
