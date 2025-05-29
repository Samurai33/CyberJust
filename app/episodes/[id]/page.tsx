"use client"

import { useState } from "react"
import { useParams, notFound } from "next/navigation"
import {
  Play,
  Calendar,
  AlertTriangle,
  Clock,
  Share2,
  Download,
  Star,
  Users,
  TimerIcon as Timeline,
  BookOpen,
  ArrowLeft,
  Bookmark,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { getEpisodeById } from "@/data/episodes"
import { useAudio } from "@/contexts/AudioContext"
import { EpisodeBookmarks } from "@/components/episode/EpisodeBookmarks"
import { EpisodeRating } from "@/components/episode/EpisodeRating"
import { EpisodeAnalytics } from "@/components/episode/EpisodeAnalytics"
import { EpisodeRecommendations } from "@/components/episode/EpisodeRecommendations"

export default function EpisodeDetailPage() {
  const params = useParams()
  const { playEpisode, isEpisodePlaying, isLoading } = useAudio()
  const [activeTab, setActiveTab] = useState("transcript")

  const episode = getEpisodeById(params.id as string)

  if (!episode) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ATIVO":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "ARQUIVADO":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "RESOLVIDO":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "AGENDADO":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
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
      case "BAIXO":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const getSeverityColor = (severity: string) => {
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

  const isCurrentlyPlaying = isEpisodePlaying(episode.id)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/episodes">
            <Button variant="ghost" className="text-cyan-400 hover:text-white hover:bg-cyan-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Episódios
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 mb-4">
            <Badge className={getStatusColor(episode.status)}>{episode.status}</Badge>
            <Badge className={getThreatColor(episode.threat)}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {episode.threat}
            </Badge>
            {episode.category && (
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                {episode.category}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
            {episode.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {episode.date}
            </div>
            {episode.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {episode.duration}
              </div>
            )}
            <div className="text-cyan-400 font-mono">EP {episode.id}</div>
          </div>

          <p className="text-lg text-gray-300 mb-8 leading-relaxed">{episode.fullDescription || episode.description}</p>

          {/* Key Points */}
          {episode.keyPoints && episode.keyPoints.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 font-mono">PONTOS PRINCIPAIS</h3>
              <ul className="space-y-2">
                {episode.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-cyan-400 mt-1">▶</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {episode.audioUrl && (
              <Button
                size="lg"
                onClick={() => playEpisode(episode)}
                disabled={isLoading}
                className={`${
                  isCurrentlyPlaying
                    ? "bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500"
                    : "bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 mr-2 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {isCurrentlyPlaying ? "Reproduzindo..." : "Ouvir Episódio"}
              </Button>
            )}

            <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar
            </Button>

            <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-900 border-gray-700">
            <TabsTrigger value="transcript" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <BookOpen className="w-4 h-4 mr-2" />
              TRANSCRIÇÃO
            </TabsTrigger>
            <TabsTrigger value="experts" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Users className="w-4 h-4 mr-2" />
              ESPECIALISTAS
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Timeline className="w-4 h-4 mr-2" />
              CRONOLOGIA
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Star className="w-4 h-4 mr-2" />
              RECURSOS
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Bookmark className="w-4 h-4 mr-2" />
              MARCADORES
            </TabsTrigger>
            <TabsTrigger value="rating" className="data-[state=active]:bg-white data-[state=active]:text-black">
              <Star className="w-4 h-4 mr-2" />
              AVALIAÇÃO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="mt-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Transcrição do Episódio</CardTitle>
                <CardDescription>Transcrição completa com timestamps para fácil navegação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {episode.transcript && episode.transcript.length > 0 ? (
                  episode.transcript.map((segment) => (
                    <div key={segment.id} className="border-l-2 border-cyan-500/30 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-cyan-400 font-mono text-sm">{segment.timestamp}</span>
                        <span className="text-gray-400 text-sm">{segment.speaker}</span>
                        {segment.type && (
                          <Badge variant="outline" className="text-xs">
                            {segment.type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-300">{segment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">Transcrição não disponível para este episódio.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {episode.experts && episode.experts.length > 0 ? (
                episode.experts.map((expert) => (
                  <Card key={expert.id} className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={expert.avatar || "/placeholder.svg"} alt={expert.name} />
                          <AvatarFallback className="bg-cyan-500 text-black">
                            {expert.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg text-cyan-400">{expert.name}</CardTitle>
                          <CardDescription>{expert.role}</CardDescription>
                          <p className="text-sm text-gray-400">{expert.organization}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{expert.bio}</p>
                      {expert.contact && (
                        <div className="space-y-2">
                          {expert.contact.email && (
                            <Button size="sm" variant="outline" className="w-full">
                              Contato
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-400 col-span-full">Informações de especialistas não disponíveis.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Cronologia dos Eventos</CardTitle>
                <CardDescription>Timeline detalhada dos principais marcos do caso</CardDescription>
              </CardHeader>
              <CardContent>
                {episode.timeline && episode.timeline.length > 0 ? (
                  <div className="space-y-6">
                    {episode.timeline.map((event, index) => (
                      <div key={event.id} className="relative">
                        {index !== episode.timeline!.length - 1 && (
                          <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-700" />
                        )}
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-8 h-8 rounded-full ${getSeverityColor(event.severity)} flex items-center justify-center flex-shrink-0`}
                          >
                            <div className="w-3 h-3 bg-white rounded-full" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{event.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {event.date}
                              </Badge>
                              {event.completed && (
                                <Badge className="bg-green-500/20 text-green-400 text-xs">Concluído</Badge>
                              )}
                            </div>
                            <p className="text-gray-300">{event.description}</p>
                            {event.completed && <Progress value={100} className="mt-2 h-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">Cronologia não disponível para este episódio.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {episode.resources && episode.resources.length > 0 ? (
                episode.resources.map((resource) => (
                  <Card key={resource.id} className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-cyan-400">{resource.title}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mr-2">
                          {resource.type.toUpperCase()}
                        </Badge>
                        {resource.source}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{resource.description}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(resource.url, "_blank")}
                      >
                        Acessar Recurso
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-400 col-span-full">Recursos não disponíveis para este episódio.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="bookmarks" className="mt-6">
            <EpisodeBookmarks episodeId={episode.id} />
          </TabsContent>

          <TabsContent value="rating" className="mt-6">
            <EpisodeRating episodeId={episode.id} />
          </TabsContent>
        </Tabs>

        {/* Analytics and Recommendations */}
        <div className="mt-12 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">ANALYTICS DO EPISÓDIO</h2>
            <EpisodeAnalytics episodeId={episode.id} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">VOCÊ TAMBÉM PODE GOSTAR</h2>
            <EpisodeRecommendations currentEpisodeId={episode.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
