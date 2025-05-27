"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Play,
  Pause,
  Calendar,
  Clock,
  User,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  CheckCircle,
  Accessibility,
  Building,
  MessageSquare,
  Globe,
  BookOpen,
  Newspaper,
  Scale,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/sections/Navigation"
import { Background } from "@/components/sections/Background"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import { useAudio } from "@/contexts/AudioContext"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { episodesData, type Episode } from "@/data/episodes"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useEpisodeProgress } from "@/hooks/useEpisodeProgress"
import { EpisodeNotes } from "@/components/episode/EpisodeNotes"
import { EpisodeRating } from "@/components/episode/EpisodeRating"
import { EpisodeProgress } from "@/components/episode/EpisodeProgress"
import { PlaybackControls } from "@/components/episode/PlaybackControls"
import { EpisodeRecommendations } from "@/components/episode/EpisodeRecommendations"
import { EpisodeAccessibility } from "@/components/episode/EpisodeAccessibility"

function EpisodeDetailContent() {
  const params = useParams()
  const router = useRouter()
  const episodeId = params.id as string

  const [episode, setEpisode] = useState<Episode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [transcriptSearch, setTranscriptSearch] = useState("")
  const [expandedSections, setExpandedSections] = useState({
    timeline: false,
    statistics: false,
    resources: false,
  })
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [showAccessibility, setShowAccessibility] = useState(false)

  const {
    playEpisode,
    togglePlayPause,
    seek,
    currentTime,
    duration,
    isLoading: audioLoading,
    currentEpisode,
    isPlaying,
  } = useAudio()
  const { updateProgress } = useEpisodeProgress()

  // Update progress when audio time changes
  useEffect(() => {
    if (currentEpisode?.id === episodeId && currentTime > 0 && duration > 0) {
      updateProgress(episodeId, currentTime, duration)
    }
  }, [currentTime, duration, currentEpisode, episodeId, updateProgress])

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      " ": () => togglePlayPause(),
      arrowleft: () => seek(Math.max(0, currentTime - 15)),
      arrowright: () => seek(Math.min(duration, currentTime + 15)),
      m: () => {}, // Mute functionality would go here
      f: () => {}, // Fullscreen functionality would go here
    },
    !!episode,
  )

  useEffect(() => {
    const loadEpisode = async () => {
      try {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 800))
        const episodeData = episodesData[episodeId]
        if (!episodeData) {
          setError("Episódio não encontrado")
          return
        }
        setEpisode(episodeData)

        // Check if episode is bookmarked
        const bookmarks = JSON.parse(localStorage.getItem("cyberjustica-bookmarks") || "[]")
        setIsBookmarked(bookmarks.includes(episodeId))
      } catch (err) {
        setError("Erro ao carregar episódio")
      } finally {
        setIsLoading(false)
      }
    }

    loadEpisode()
  }, [episodeId])

  const handlePlayEpisode = () => {
    if (episode) {
      playEpisode(episode)
    }
  }

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem("cyberjustica-bookmarks") || "[]")
    let newBookmarks

    if (isBookmarked) {
      newBookmarks = bookmarks.filter((id: string) => id !== episodeId)
    } else {
      newBookmarks = [...bookmarks, episodeId]
    }

    localStorage.setItem("cyberjustica-bookmarks", JSON.stringify(newBookmarks))
    setIsBookmarked(!isBookmarked)
  }

  const handleShare = async () => {
    const shareData = {
      title: `CyberJustiça Brasil - ${episode?.title}`,
      text: episode?.description,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        await navigator.clipboard.writeText(window.location.href)
        alert("Link copiado para a área de transferência!")
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert("Link copiado para a área de transferência!")
      } catch (err) {
        console.error("Failed to copy to clipboard")
      }
    }
  }

  const handleDownload = () => {
    // Simulate download functionality
    alert("Funcionalidade de download será implementada em breve!")
  }

  const handleCopyTranscript = async (text: string, timestamp: string) => {
    try {
      await navigator.clipboard.writeText(`[${timestamp}] ${text}`)
      setCopiedText(timestamp)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error("Failed to copy text")
    }
  }

  const filteredTranscript = episode?.transcript?.filter(
    (segment) =>
      segment.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      segment.speaker.toLowerCase().includes(transcriptSearch.toLowerCase()),
  )

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ATIVO":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "AGENDADO":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "RESOLVIDO":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "ARQUIVADO":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case "CRÍTICO":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "ALTO":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "MÉDIO":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const getSpeakerColor = (type?: string) => {
    switch (type) {
      case "expert":
        return "text-cyan-400"
      case "interview":
        return "text-purple-400"
      case "victim":
        return "text-yellow-400"
      default:
        return "text-gray-300"
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Background />
        <Navigation />
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-700 rounded w-1/4" />
            <div className="h-12 bg-gray-700 rounded w-3/4" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-64 bg-gray-700 rounded" />
                <div className="h-32 bg-gray-700 rounded" />
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-700 rounded" />
                <div className="h-32 bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-black/50 border-red-500/30 backdrop-blur-sm max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-mono text-red-400 mb-2">EPISÓDIO NÃO ENCONTRADO</h2>
            <p className="text-gray-300 mb-4">{error || "O episódio solicitado não existe."}</p>
            <Button
              onClick={() => router.push("/episodes")}
              className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
            >
              VOLTAR AOS EPISÓDIOS
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Background />
      <Navigation />

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Back Button and Accessibility Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            VOLTAR
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowAccessibility(!showAccessibility)}
            className="text-gray-400 hover:text-white hover:bg-gray-500/20"
          >
            <Accessibility className="w-4 h-4 mr-2" />
            ACESSIBILIDADE
          </Button>
        </div>

        {/* Accessibility Panel */}
        {showAccessibility && (
          <div className="mb-6">
            <EpisodeAccessibility />
          </div>
        )}

        {/* Episode Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-gray-800 text-cyan-400 font-mono">
              EPISÓDIO {episode.id}
            </Badge>
            <Badge className={`font-mono ${getStatusColor(episode.status)}`}>{episode.status}</Badge>
            <Badge className={`font-mono ${getThreatColor(episode.threat)}`}>{episode.threat}</Badge>
            {episode.category && (
              <Badge variant="outline" className="border-purple-500/50 text-purple-400 font-mono">
                {episode.category}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-mono bg-gradient-to-r from-cyan-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
            {episode.title}
          </h1>

          <div className="flex items-center gap-6 text-gray-400 font-mono text-sm mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {episode.date}
            </div>
            {episode.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {episode.duration}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              CLASSIFICAÇÃO: {episode.threat}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
              onClick={handlePlayEpisode}
              disabled={audioLoading}
            >
              {audioLoading ? (
                <div className="w-5 h-5 mr-2 border border-white border-t-transparent rounded-full animate-spin" />
              ) : currentEpisode?.id === episode.id && isPlaying ? (
                <Pause className="w-5 h-5 mr-2" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {audioLoading
                ? "CARREGANDO..."
                : currentEpisode?.id === episode.id && isPlaying
                  ? "PAUSAR"
                  : "REPRODUZIR"}
            </Button>
          </div>

          <p className="text-gray-300 text-lg leading-relaxed">{episode.fullDescription || episode.description}</p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Episode Progress */}
            <EpisodeProgress episodeId={episodeId} />

            {/* Key Points */}
            {episode.keyPoints && (
              <Card className="bg-black/50 border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    PONTOS PRINCIPAIS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {episode.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-cyan-400 mt-1">▶</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {episode.warnings && (
              <Card className="bg-black/50 border-red-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    ALERTAS DE SEGURANÇA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {episode.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-red-400 mt-1">⚠</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Episode Notes */}
            <EpisodeNotes episodeId={episodeId} />

            {/* Tabs for detailed content */}
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-900/50 border border-gray-700 rounded-lg p-1">
                <TabsTrigger
                  value="transcript"
                  className="font-mono text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-400 transition-all duration-200"
                >
                  TRANSCRIÇÃO
                </TabsTrigger>
                <TabsTrigger
                  value="experts"
                  className="font-mono text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-400 transition-all duration-200"
                >
                  ESPECIALISTAS
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="font-mono text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-400 transition-all duration-200"
                >
                  CRONOLOGIA
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="font-mono text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=inactive]:text-gray-400 transition-all duration-200"
                >
                  RECURSOS
                </TabsTrigger>
              </TabsList>

              {/* Transcript Tab */}
              <TabsContent value="transcript" className="space-y-4">
                <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-mono flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        TRANSCRIÇÃO COMPLETA
                      </CardTitle>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar na transcrição..."
                          value={transcriptSearch}
                          onChange={(e) => setTranscriptSearch(e.target.value)}
                          className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {(filteredTranscript || episode.transcript || []).map((segment, index) => (
                          <div
                            key={index}
                            className="border-l-2 border-gray-700 pl-4 hover:border-cyan-500/50 transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-400 font-mono text-sm">[{segment.timestamp}]</span>
                                <span className={`font-mono text-sm ${getSpeakerColor(segment.type)}`}>
                                  {segment.speaker}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyTranscript(segment.text, segment.timestamp)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {copiedText === segment.timestamp ? (
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{segment.text}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experts Tab */}
              <TabsContent value="experts" className="space-y-4">
                {!episode.experts || episode.experts.length === 0 ? (
                  <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-mono text-gray-400 mb-2">NENHUM ESPECIALISTA CADASTRADO</h3>
                      <p className="text-gray-500 text-sm">Este episódio ainda não possui especialistas registrados.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {episode.experts.map((expert, index) => (
                      <Card
                        key={index}
                        className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm"
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
                              <User className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                                <h3 className="text-xl font-mono text-white mb-2 md:mb-0">{expert.name}</h3>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-mono text-xs">
                                    ESPECIALISTA
                                  </Badge>
                                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 font-mono text-xs">
                                    ATIVO
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                  <Shield className="w-4 h-4 text-cyan-400" />
                                  <p className="text-cyan-400 font-mono text-sm">{expert.role}</p>
                                </div>
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                  <Building className="w-4 h-4 text-purple-400" />
                                  <p className="text-purple-400 font-mono text-sm">{expert.organization}</p>
                                </div>
                              </div>

                              <p className="text-gray-300 text-sm leading-relaxed mb-4">{expert.bio}</p>

                              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {expert.profileUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                                    onClick={() => window.open(expert.profileUrl, "_blank")}
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    PERFIL
                                  </Button>
                                )}
                                {expert.contactEmail && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                                    onClick={() => window.open(`mailto:${expert.contactEmail}`, "_blank")}
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    CONTATO
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
                                  onClick={() => {
                                    const shareText = `Conheça ${expert.name}, ${expert.role} na ${expert.organization}. Especialista em segurança cibernética no CyberJustiça Brasil.`
                                    if (navigator.share) {
                                      navigator.share({
                                        title: expert.name,
                                        text: shareText,
                                        url: window.location.href,
                                      })
                                    } else {
                                      navigator.clipboard.writeText(shareText)
                                      alert("Informações copiadas!")
                                    }
                                  }}
                                >
                                  <Share2 className="w-3 h-3 mr-1" />
                                  COMPARTILHAR
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4">
                {!episode.timeline || episode.timeline.length === 0 ? (
                  <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-mono text-gray-400 mb-2">CRONOLOGIA NÃO DISPONÍVEL</h3>
                      <p className="text-gray-500 text-sm">
                        Este episódio ainda não possui uma linha do tempo detalhada.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white font-mono flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        LINHA DO TEMPO DOS EVENTOS
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-purple-500 to-red-500"></div>

                        <div className="space-y-8">
                          {episode.timeline.map((event, index) => (
                            <div key={index} className="relative flex items-start gap-6">
                              {/* Timeline dot */}
                              <div
                                className={`relative z-10 w-4 h-4 rounded-full border-2 border-black flex-shrink-0 ${getSeverityColor(event.severity)}`}
                              >
                                <div className="absolute inset-0.5 rounded-full bg-black"></div>
                                <div
                                  className={`absolute inset-1 rounded-full ${getSeverityColor(event.severity)}`}
                                ></div>
                              </div>

                              {/* Event content */}
                              <div className="flex-1 pb-8">
                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                                      <span className="text-cyan-400 font-mono text-sm font-bold">{event.date}</span>
                                      <Badge
                                        className={`font-mono text-xs ${
                                          event.severity === "critical"
                                            ? "bg-red-500/20 text-red-400 border-red-500/50"
                                            : event.severity === "high"
                                              ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                                              : event.severity === "medium"
                                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                                : "bg-green-500/20 text-green-400 border-green-500/50"
                                        }`}
                                      >
                                        {event.severity?.toUpperCase() || "BAIXO"}
                                      </Badge>
                                    </div>

                                    <div className="text-xs text-gray-500 font-mono">EVENTO #{index + 1}</div>
                                  </div>

                                  <h4 className="text-white font-mono text-lg mb-2">{event.event}</h4>
                                  <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>

                                  {/* Progress indicator */}
                                  <div className="mt-3 flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${((index + 1) / episode.timeline.length) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">
                                      {Math.round(((index + 1) / episode.timeline.length) * 100)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-4">
                {!episode.resources || episode.resources.length === 0 ? (
                  <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-mono text-gray-400 mb-2">RECURSOS NÃO DISPONÍVEIS</h3>
                      <p className="text-gray-500 text-sm">
                        Este episódio ainda não possui recursos adicionais cadastrados.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Resource categories */}
                    {["law", "report", "guide", "article"].map((type) => {
                      const resourcesOfType = episode.resources?.filter((r) => r.type === type) || []
                      if (resourcesOfType.length === 0) return null

                      const typeConfig = {
                        law: { label: "LEGISLAÇÃO", icon: Scale, color: "red" },
                        report: { label: "RELATÓRIOS", icon: FileText, color: "blue" },
                        guide: { label: "GUIAS", icon: BookOpen, color: "green" },
                        article: { label: "ARTIGOS", icon: Newspaper, color: "purple" },
                      }

                      const config = typeConfig[type as keyof typeof typeConfig]
                      const IconComponent = config.icon

                      return (
                        <Card key={type} className="bg-black/50 border-gray-800 backdrop-blur-sm">
                          <CardHeader>
                            <CardTitle className={`font-mono flex items-center gap-2 text-${config.color}-400`}>
                              <IconComponent className="w-5 h-5" />
                              {config.label} ({resourcesOfType.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {resourcesOfType.map((resource, index) => (
                              <div
                                key={index}
                                className="border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all duration-300 group"
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="text-white font-mono text-lg group-hover:text-cyan-400 transition-colors">
                                        {resource.title}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className={`font-mono text-xs border-${config.color}-500/50 text-${config.color}-400`}
                                      >
                                        {resource.type.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-3">{resource.description}</p>

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Globe className="w-3 h-3" />
                                      <span className="font-mono">RECURSO EXTERNO</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 group-hover:border-cyan-400"
                                      onClick={() => window.open(resource.url, "_blank")}
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      ACESSAR
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-white"
                                      onClick={() => navigator.clipboard.writeText(resource.url)}
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      COPIAR LINK
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Playback Controls */}
            <PlaybackControls
              episodeId={episodeId}
              isBookmarked={isBookmarked}
              onBookmarkToggle={handleBookmark}
              onShare={handleShare}
              onDownload={handleDownload}
            />

            {/* Episode Rating */}
            <EpisodeRating episodeId={episodeId} />

            {/* Statistics */}
            {episode.statistics && (
              <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white font-mono text-sm">ESTATÍSTICAS</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection("statistics")}
                      className="text-gray-400 hover:text-white"
                    >
                      {expandedSections.statistics ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {expandedSections.statistics && (
                  <CardContent className="space-y-4">
                    {episode.statistics.map((stat, index) => (
                      <div key={index} className="border-l-2 border-cyan-500/50 pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold text-cyan-400 font-mono">{stat.value}</span>
                          {stat.trend && (
                            <span
                              className={`text-xs ${
                                stat.trend === "up"
                                  ? "text-green-400"
                                  : stat.trend === "down"
                                    ? "text-red-400"
                                    : "text-gray-400"
                              }`}
                            >
                              {stat.trend === "up" ? "↗" : stat.trend === "down" ? "↘" : "→"}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-mono text-sm mb-1">{stat.label}</p>
                        <p className="text-gray-400 text-xs">{stat.description}</p>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Episode Recommendations */}
            <EpisodeRecommendations currentEpisodeId={episodeId} currentEpisode={episode} />

            {/* Tags */}
            {episode.tags && (
              <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white font-mono text-sm">TAGS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {episode.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-gray-600 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 cursor-pointer font-mono text-xs"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Cases */}
            {episode.relatedCases && (
              <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white font-mono text-sm">CASOS RELACIONADOS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {episode.relatedCases.map((relatedCase, index) => (
                      <div
                        key={index}
                        className="p-2 border border-gray-700 rounded hover:border-cyan-500/50 transition-colors cursor-pointer"
                      >
                        <span className="text-cyan-400 font-mono text-sm">{relatedCase}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AudioPlayer />
    </div>
  )
}

export default function EpisodeDetailPage() {
  return (
    <ErrorBoundary>
      <EpisodeDetailContent />
    </ErrorBoundary>
  )
}
