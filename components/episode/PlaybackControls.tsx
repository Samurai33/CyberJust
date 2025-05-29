"use client"

import { useState } from "react"
import { Settings, Gauge, Download, Share2, Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface PlaybackControlsProps {
  episodeId: string
  isBookmarked: boolean
  onBookmarkToggle: () => void
  onShare: () => void
  onDownload: () => void
}

export function PlaybackControls({
  episodeId,
  isBookmarked,
  onBookmarkToggle,
  onShare,
  onDownload,
}: PlaybackControlsProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState("1")
  const [showSettings, setShowSettings] = useState(false)

  const playbackSpeeds = [
    { value: "0.5", label: "0.5x" },
    { value: "0.75", label: "0.75x" },
    { value: "1", label: "1x (Normal)" },
    { value: "1.25", label: "1.25x" },
    { value: "1.5", label: "1.5x" },
    { value: "1.75", label: "1.75x" },
    { value: "2", label: "2x" },
  ]

  return (
    <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-mono text-sm">CONTROLES DE REPRODUÇÃO</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onBookmarkToggle}
            className={`border-gray-600 ${
              isBookmarked ? "text-yellow-400 border-yellow-500/50" : "text-gray-400 hover:text-white"
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 mr-2" /> : <Bookmark className="w-4 h-4 mr-2" />}
            {isBookmarked ? "SALVO" : "SALVAR"}
          </Button>

          <Button variant="outline" onClick={onShare} className="border-gray-600 text-gray-400 hover:text-white">
            <Share2 className="w-4 h-4 mr-2" />
            COMPARTILHAR
          </Button>

          <Button variant="outline" onClick={onDownload} className="border-gray-600 text-gray-400 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            BAIXAR
          </Button>

          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-gray-400" />
            <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
              <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {playbackSpeeds.map((speed) => (
                  <SelectItem key={speed.value} value={speed.value} className="text-white">
                    {speed.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showSettings && (
          <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Velocidade de Reprodução</span>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 font-mono text-xs">
                {playbackSpeeds.find((s) => s.value === playbackSpeed)?.label}
              </Badge>
            </div>

            <div className="text-xs text-gray-500">
              Ajuste a velocidade de reprodução conforme sua preferência de escuta.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
