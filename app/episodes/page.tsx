"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Play, Calendar, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navigation } from "@/components/sections/Navigation"
import { Background } from "@/components/sections/Background"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import { useAudio } from "@/contexts/AudioContext"
import { useUI } from "@/contexts/UIContext"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { allEpisodes, type Episode } from "@/data/episodes"

const EPISODES_PER_PAGE = 6

function EpisodesPageContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [threatFilter, setThreatFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { playEpisode, isLoading: audioLoading } = useAudio()
  const { setSelectedLuluModal } = useUI()

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Filter and search episodes
  const filteredEpisodes = useMemo(() => {
    try {
      return allEpisodes.filter((episode) => {
        const matchesSearch =
          episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          episode.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          episode.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === "all" || episode.status === statusFilter
        const matchesThreat = threatFilter === "all" || episode.threat === threatFilter
        const matchesCategory = categoryFilter === "all" || episode.category === categoryFilter

        return matchesSearch && matchesStatus && matchesThreat && matchesCategory
      })
    } catch (err) {
      setError("Erro ao filtrar episódios")
      return []
    }
  }, [searchTerm, statusFilter, threatFilter, categoryFilter])

  // Pagination
  const totalPages = Math.ceil(filteredEpisodes.length / EPISODES_PER_PAGE)
  const startIndex = (currentPage - 1) * EPISODES_PER_PAGE
  const paginatedEpisodes = filteredEpisodes.slice(startIndex, startIndex + EPISODES_PER_PAGE)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, threatFilter, categoryFilter])

  const handlePlayEpisode = (episode: Episode) => {
    try {
      playEpisode(episode)
    } catch (err) {
      setError("Erro ao reproduzir episódio")
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-black/50 border-red-500/30 backdrop-blur-sm max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-mono text-red-400 mb-2">ERRO DO SISTEMA</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button
              onClick={() => {
                setError(null)
                window.location.reload()
              }}
              className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
            >
              TENTAR NOVAMENTE
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

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-cyan-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
              ARQUIVO DE EPISÓDIOS
            </span>
          </h1>
          <p className="text-gray-400 text-lg font-mono">Base de dados completa de investigações cibernéticas</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-mono">
              {filteredEpisodes.length} CASOS DOCUMENTADOS
            </Badge>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/50 font-mono">ACESSO AUTORIZADO</Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-black/50 border-cyan-500/30 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar episódios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                  <SelectItem value="AGENDADO">Agendado</SelectItem>
                  <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                </SelectContent>
              </Select>

              {/* Threat Filter */}
              <Select value={threatFilter} onValueChange={setThreatFilter}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Ameaça" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">Todas as Ameaças</SelectItem>
                  <SelectItem value="CRÍTICO">Crítico</SelectItem>
                  <SelectItem value="ALTO">Alto</SelectItem>
                  <SelectItem value="MÉDIO">Médio</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="Fraudes Financeiras">Fraudes Financeiras</SelectItem>
                  <SelectItem value="Vazamento de Dados">Vazamento de Dados</SelectItem>
                  <SelectItem value="Malware">Malware</SelectItem>
                  <SelectItem value="Corrupção Digital">Corrupção Digital</SelectItem>
                  <SelectItem value="Desinformação">Desinformação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-black/50 border-gray-800 animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-6 bg-gray-700 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded" />
                    <div className="h-3 bg-gray-700 rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Episodes Grid */}
        {!isLoading && (
          <>
            {paginatedEpisodes.length === 0 ? (
              <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-mono text-gray-400 mb-2">NENHUM EPISÓDIO ENCONTRADO</h3>
                  <p className="text-gray-500">Tente ajustar os filtros de busca</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedEpisodes.map((episode) => (
                  <Card
                    key={episode.id}
                    className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-gray-800 text-cyan-400 font-mono text-xs">
                            EP {episode.id}
                          </Badge>
                          <Badge className={`font-mono text-xs ${getStatusColor(episode.status)}`}>
                            {episode.status}
                          </Badge>
                        </div>
                        <Badge className={`font-mono text-xs ${getThreatColor(episode.threat)}`}>
                          {episode.threat}
                        </Badge>
                      </div>

                      <CardTitle
                        className="group-hover:text-red-400 transition-colors font-mono cursor-pointer hover:underline text-sm leading-tight"
                        onClick={() => {
                          window.location.href = `/episodes/${episode.id}`
                        }}
                      >
                        {episode.title}
                      </CardTitle>

                      <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {episode.date}
                        </div>
                        {episode.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {episode.duration}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm mb-4 line-clamp-3">
                        {episode.description}
                      </p>

                      {episode.category && (
                        <div className="mb-4">
                          <Badge variant="outline" className="border-purple-500/50 text-purple-400 font-mono text-xs">
                            {episode.category}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500 flex-1"
                          onClick={() => handlePlayEpisode(episode)}
                          disabled={audioLoading}
                        >
                          {audioLoading ? (
                            <div className="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 mr-1" />
                          )}
                          {audioLoading ? "CARREGANDO..." : "REPRODUZIR"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-400 hover:text-white"
                          onClick={() => {
                            if (episode.id === 6) {
                              setSelectedLuluModal(true)
                            } else {
                              window.location.href = `/episodes/${episode.id}`
                            }
                          }}
                        >
                          DETALHES
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-600 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  ANTERIOR
                </Button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1
                    const isCurrentPage = page === currentPage
                    const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1

                    if (!showPage && page !== 2 && page !== totalPages - 1) {
                      if (page === 3 && currentPage > 4)
                        return (
                          <span key={page} className="text-gray-500">
                            ...
                          </span>
                        )
                      if (page === totalPages - 2 && currentPage < totalPages - 3)
                        return (
                          <span key={page} className="text-gray-500">
                            ...
                          </span>
                        )
                      return null
                    }

                    return (
                      <Button
                        key={page}
                        variant={isCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={
                          isCurrentPage
                            ? "bg-gradient-to-r from-red-500 to-cyan-600"
                            : "border-gray-600 text-gray-400 hover:text-white"
                        }
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-600 text-gray-400 hover:text-white disabled:opacity-50"
                >
                  PRÓXIMO
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <AudioPlayer />
    </div>
  )
}

export default function EpisodesPage() {
  return (
    <ErrorBoundary>
      <EpisodesPageContent />
    </ErrorBoundary>
  )
}
