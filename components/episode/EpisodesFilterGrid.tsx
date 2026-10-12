"use client"

import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { Calendar, Clock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EpisodeBadge } from "@/components/ui/episode-badge"
import { EpisodeListenButton } from "@/components/episode/EpisodeListenButton"
import type { Episode } from "@/types"

interface EpisodesFilterGridProps {
  episodes: Episode[]
}

export function EpisodesFilterGrid({ episodes }: EpisodesFilterGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [threatFilter, setThreatFilter] = useState("all")
  const query = useDeferredValue(searchTerm).trim().toLowerCase()

  const filteredEpisodes = episodes.filter((episode) => {
    const matchesSearch =
      episode.title.toLowerCase().includes(query) || episode.description.toLowerCase().includes(query)
    const matchesStatus = statusFilter === "all" || episode.status === statusFilter
    const matchesThreat = threatFilter === "all" || episode.threat === threatFilter

    return matchesSearch && matchesStatus && matchesThreat
  })

  return (
    <>
      {/* Filters */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar episódios..."
            aria-label="Buscar episódios"
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
                <EpisodeBadge status={episode.status} />
                <EpisodeBadge variant="threat" threat={episode.threat} showIcon />
              </div>

              <CardTitle className="text-lg group-hover:text-cyan-400 transition-colors">
                <Link href={`/episodes/${episode.id}`} className="hover:underline">
                  {episode.title}
                </Link>
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

              <div className="flex flex-wrap items-start gap-2">
                <EpisodeListenButton episode={episode} size="sm" />

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
    </>
  )
}
