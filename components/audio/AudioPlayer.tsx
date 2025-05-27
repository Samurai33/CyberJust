"use client"

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAudio } from "@/contexts/AudioContext"

export function AudioPlayer() {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isPlayerExpanded,
    isLoading,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    togglePlayerExpanded,
    formatTime,
  } = useAudio()

  if (!currentEpisode) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-cyan-500/30">
      <div className="container mx-auto px-6 py-4">
        {/* Compact Player */}
        {!isPlayerExpanded && (
          <div className="flex items-center gap-4">
            {/* Episode Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white font-mono text-sm truncate">
                  EP {currentEpisode.id}: {currentEpisode.title}
                  {!currentEpisode.audioUrl && <span className="text-yellow-400 ml-2">[DEMO]</span>}
                </div>
                <div className="text-gray-400 text-xs font-mono">CyberJustiça Brasil</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                onClick={() => seek(Math.max(0, currentTime - 15))}
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500 w-10 h-10 rounded-full"
                onClick={togglePlayPause}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                onClick={() => seek(Math.min(duration, currentTime + 15))}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-xs text-gray-400 font-mono">{formatTime(currentTime)}</span>
              <div
                className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const percentage = x / rect.width
                  const newTime = percentage * duration
                  seek(newTime)
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 font-mono">{formatTime(duration)}</span>
            </div>

            {/* Volume & Expand */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={togglePlayerExpanded}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Expanded Player */}
        {isPlayerExpanded && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Radio className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-xl text-white font-mono">
                    EP {currentEpisode.id}: {currentEpisode.title}
                  </div>
                  <div className="text-gray-400 font-mono">CyberJustiça Brasil • {currentEpisode.date}</div>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={togglePlayerExpanded}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Waveform Visualization */}
            <div className="relative h-20 bg-gray-900/50 rounded-lg overflow-hidden border border-cyan-500/30">
              <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-gradient-to-t from-cyan-400 to-red-500 rounded-full transition-all duration-300 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                    style={{
                      height: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.1}s`,
                      opacity: i < (currentTime / duration) * 50 ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Progress Overlay */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500/20 to-red-500/20 transition-all duration-300"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="ghost"
                className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                onClick={() => seek(Math.max(0, currentTime - 15))}
              >
                <SkipBack className="w-6 h-6" />
                <span className="ml-2 font-mono text-sm">-15s</span>
              </Button>

              <Button
                size="lg"
                className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500 w-16 h-16 rounded-full shadow-lg shadow-red-500/25"
                onClick={togglePlayPause}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>

              <Button
                variant="ghost"
                className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                onClick={() => seek(Math.min(duration, currentTime + 15))}
              >
                <span className="mr-2 font-mono text-sm">+15s</span>
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 font-mono min-w-[3rem]">{formatTime(currentTime)}</span>

                <div
                  className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percentage = x / rect.width
                    const newTime = percentage * duration
                    seek(newTime)
                  }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-red-500 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/25"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                <span className="text-sm text-gray-400 font-mono min-w-[3rem]">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-4">
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <div className="flex items-center gap-2 w-32">
                <div
                  className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percentage = x / rect.width
                    setVolume(percentage)
                  }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-cyan-500 rounded-full"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                </div>
              </div>

              <span className="text-xs text-gray-400 font-mono min-w-[2rem]">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Episode Info */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    className={`font-mono text-xs ${
                      currentEpisode.threat === "CRÍTICO"
                        ? "bg-red-500/20 text-red-400 border-red-500/50"
                        : currentEpisode.threat === "ALTO"
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                    }`}
                  >
                    {currentEpisode.threat}
                  </Badge>
                  <Badge
                    className={`font-mono text-xs ${
                      currentEpisode.status === "ATIVO"
                        ? "bg-green-500/20 text-green-400 border-green-500/50"
                        : currentEpisode.status === "AGENDADO"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                          : currentEpisode.status === "RESOLVIDO"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                    }`}
                  >
                    {currentEpisode.status}
                  </Badge>
                </div>
                <p className="text-gray-300 text-sm">{currentEpisode.description}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
