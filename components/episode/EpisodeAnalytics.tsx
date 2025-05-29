"use client"

import { TrendingUp, Users, Clock, Target, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getEpisodeAnalytics } from "@/data/episodes"

interface EpisodeAnalyticsProps {
  episodeId: string | number
}

export function EpisodeAnalytics({ episodeId }: EpisodeAnalyticsProps) {
  const analytics = getEpisodeAnalytics(episodeId)

  if (!analytics) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Dados de analytics não disponíveis</p>
        </CardContent>
      </Card>
    )
  }

  const completionRate = analytics.views > 0 ? (analytics.completions / analytics.views) * 100 : 0
  const averageListenMinutes = Math.floor(analytics.averageListenTime / 60)
  const averageListenSeconds = analytics.averageListenTime % 60

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Views */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Visualizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-400">{analytics.views.toLocaleString()}</div>
          <p className="text-xs text-gray-500">Total de reproduções</p>
        </CardContent>
      </Card>

      {/* Completions */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Conclusões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">{analytics.completions.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={completionRate} className="flex-1 h-2" />
            <span className="text-xs text-gray-500">{completionRate.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Average Listen Time */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Tempo Médio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-400">
            {averageListenMinutes}:{averageListenSeconds.toString().padStart(2, "0")}
          </div>
          <p className="text-xs text-gray-500">Duração média de escuta</p>
        </CardContent>
      </Card>

      {/* Engagement Score */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Engajamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-400">
            {Math.round((completionRate + (analytics.averageListenTime / 3600) * 100) / 2)}%
          </div>
          <p className="text-xs text-gray-500">Score de engajamento</p>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <Card className="bg-gray-900 border-gray-700 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Estatísticas Detalhadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-white">{analytics.ratings.length}</div>
              <div className="text-sm text-gray-400">Avaliações</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">{analytics.bookmarks.length}</div>
              <div className="text-sm text-gray-400">Marcadores</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                {((analytics.completions / analytics.views) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Taxa de Conclusão</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                {new Date(analytics.lastUpdated).toLocaleDateString("pt-BR")}
              </div>
              <div className="text-sm text-gray-400">Última Atualização</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
