"use client"

import { useState } from "react"
import Link from "next/link"
import { Play, Calendar, AlertTriangle, Clock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { episodes } from "@/data/episodes"
import { useAudio } from "@/contexts/AudioContext"

export default function EpisodesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [threatFilter, setThreatFilter] = useState("all")
  const { playEpisode } = useAudio()

  const filteredEpisodes = episodes.filter((episode) => {
    const matchesSearch =
      episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || episode.status === statusFilter
    const matchesThreat = threatFilter === "all" || episode.threat === threatFilter

    return matchesSearch && matchesStatus && matchesThreat
  })

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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
            EPISÓDIOS
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore nossa coleção completa de casos reais de crimes cibernéticos no Brasil
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar episódios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-700">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ATIVO">Ativo</SelectItem>
              <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
              <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
              <SelectItem value="AGENDADO">Agendado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={threatFilter} onValueChange={setThreatFilter}>
            <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-700">
              <SelectValue placeholder="Nível de Ameaça" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ameaças</SelectItem>
              <SelectItem value="CRÍTICO">Crítico</SelectItem>
              <SelectItem value="ALTO">Alto</SelectItem>
              <SelectItem value="MÉDIO">Médio</SelectItem>
              <SelectItem value="BAIXO">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEpisodes.map((episode) => (
            <Card
              key={episode.id}
              className="bg-gray-900 border-gray-700 hover:border-cyan-500/50 transition-all duration-300 group"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={getStatusColor(episode.status)}>{episode.status}</Badge>
                  <Badge className={getThreatColor(episode.threat)}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {episode.threat}
                  </Badge>
                </div>

                <CardTitle
                  className="text-lg group-hover:text-cyan-400 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/episodes/${episode.id}`)}
                >
                  {episode.title}
                </CardTitle>

                <CardDescription className="text-gray-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    {episode.date}
                    {episode.duration && (
                      <>
                        <Clock className="w-4 h-4 ml-2" />
                        {episode.duration}
                      </>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-gray-300 mb-4 line-clamp-3">{episode.description}</p>

                <div className="flex gap-2">
                  {episode.audioUrl && (
                    <Button
                      size="sm"
                      onClick={() => playEpisode(episode)}
                      className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Ouvir
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Link href={`/episodes/${episode.id}`}>Detalhes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEpisodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum episódio encontrado com os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
