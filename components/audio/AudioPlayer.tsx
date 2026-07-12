"use client"

import { useMemo } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
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

  // Stable per-episode waveform bar heights. Previously these were generated
  // inline with Math.random() on every render, which meant all 50 bars were
  // recomputed on every `timeupdate` tick (several times/sec during playback).
  // A tiny seeded PRNG keyed on episode id keeps the shape stable for a given
  // episode while still varying between episodes.
  const waveformHeights = useMemo(() => {
    const seedStr = String(currentEpisode?.id ?? "default")
    const initialSeed = Array.from(seedStr).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0)
    return Array.from({ length: 50 }).reduce<{ seed: number; heights: number[] }>(
      (state) => {
        const nextSeed = (state.seed * 1664525 + 1013904223) >>> 0
        return { seed: nextSeed, heights: [...state.heights, 20 + (nextSeed / 4294967296) * 60] }
      },
      { seed: initialSeed, heights: [] },
    ).heights
  }, [currentEpisode?.id])

  if (!currentEpisode) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-cyan-500/30">
      <div className="container mx-auto px-6 py-4">
        {/* Compact Player */}
        {!isPlayerExpanded && (
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
            {/* Episode Info */}
            <div className="flex items-center gap-3 w-full md:flex-1 md:min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white font-mono text-sm truncate">
                  EP {currentEpisode.id}: {currentEpisode.title}
                </div>
                <div className="text-gray-400 text-xs font-mono">CyberJustiça Brasil</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
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
            <div className="flex items-center gap-2 w-full md:flex-1 md:max-w-xs">
              <span className="text-xs text-gray-400 font-mono">{formatTime(currentTime)}</span>
              <Slider
                value={[Math.min(currentTime, duration || 100)]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={([newTime]) => seek(newTime)}
                aria-label="Buscar posição de reprodução"
                className="flex-1 [&>span:first-child]:h-1 [&>span:first-child]:bg-gray-800 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-cyan-400 [&>span:first-child>span]:to-red-500 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-cyan-400 [&_[role=slider]]:bg-black [&_[role=slider]]:opacity-0 [&_[role=slider]]:transition-opacity [&_[role=slider]]:hover:opacity-100 [&_[role=slider]]:focus-visible:opacity-100"
              />
              <span className="text-xs text-gray-400 font-mono">{formatTime(duration)}</span>
            </div>

            {/* Volume & Expand */}
            <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto">
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
                {waveformHeights.map((height, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-gradient-to-t from-cyan-400 to-red-500 rounded-full transition-all duration-300 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                    style={{
                      height: `${height}%`,
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

                <Slider
                  value={[Math.min(currentTime, duration || 100)]}
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={([newTime]) => seek(newTime)}
                  aria-label="Buscar posição de reprodução"
                  className="flex-1 [&>span:first-child]:bg-gray-800 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-cyan-400 [&>span:first-child>span]:to-red-500 [&>span:first-child>span]:shadow-lg [&>span:first-child>span]:shadow-cyan-500/25 [&_[role=slider]]:border-cyan-400 [&_[role=slider]]:bg-black"
                />

                <span className="text-sm text-gray-400 font-mono min-w-[3rem]">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-4">
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <div className="flex items-center gap-2 w-32">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([newVolume]) => setVolume(newVolume)}
                  aria-label="Volume"
                  className="flex-1 [&>span:first-child]:h-1 [&>span:first-child]:bg-gray-800 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-purple-400 [&>span:first-child>span]:to-cyan-500 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-black"
                />
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
