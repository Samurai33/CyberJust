"use client"

import { useState } from "react"
import { Star, MessageSquare, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useEpisodeRatings } from "@/hooks/useEpisodeRatings"

interface EpisodeRatingProps {
  episodeId: string
}

export function EpisodeRating({ episodeId }: EpisodeRatingProps) {
  const { rateEpisode, getRating, removeRating } = useEpisodeRatings()
  const [isEditing, setIsEditing] = useState(false)
  const [tempRating, setTempRating] = useState(0)
  const [tempReview, setTempReview] = useState("")
  const [hoveredStar, setHoveredStar] = useState(0)

  const currentRating = getRating(episodeId)

  const handleStartEdit = () => {
    setIsEditing(true)
    setTempRating(currentRating?.rating || 0)
    setTempReview(currentRating?.review || "")
  }

  const handleSave = () => {
    if (tempRating > 0) {
      rateEpisode(episodeId, tempRating, tempReview.trim() || undefined)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setTempRating(0)
    setTempReview("")
    setHoveredStar(0)
  }

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1
      const isFilled = starNumber <= (interactive ? hoveredStar || tempRating : rating)

      return (
        <Star
          key={i}
          className={`w-5 h-5 ${
            isFilled ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
          } ${interactive ? "cursor-pointer hover:text-yellow-300" : ""} transition-colors`}
          onClick={interactive ? () => setTempRating(starNumber) : undefined}
          onMouseEnter={interactive ? () => setHoveredStar(starNumber) : undefined}
          onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
        />
      )
    })
  }

  return (
    <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white font-mono flex items-center gap-2">
          <Star className="w-5 h-5" />
          AVALIAÇÃO
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isEditing && !currentRating ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-3">{renderStars(0)}</div>
            <p className="text-gray-400 mb-4">Avalie este episódio</p>
            <Button
              onClick={handleStartEdit}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500"
            >
              <Star className="w-4 h-4 mr-2" />
              AVALIAR EPISÓDIO
            </Button>
          </div>
        ) : !isEditing && currentRating ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderStars(currentRating.rating)}
                <span className="text-yellow-400 font-mono">{currentRating.rating}/5</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartEdit}
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                EDITAR
              </Button>
            </div>

            {currentRating.review && (
              <div className="border-l-2 border-yellow-500/50 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-mono text-sm">COMENTÁRIO</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{currentRating.review}</p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Avaliado em {currentRating.updatedAt.toLocaleDateString("pt-BR")}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => removeRating(episodeId)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              REMOVER AVALIAÇÃO
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Classificação</label>
              <div className="flex items-center gap-2">
                {renderStars(tempRating, true)}
                <span className="text-yellow-400 font-mono ml-2">
                  {tempRating > 0 ? `${tempRating}/5` : "Selecione"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Comentário (opcional)</label>
              <Textarea
                placeholder="Compartilhe sua opinião sobre este episódio..."
                value={tempReview}
                onChange={(e) => setTempReview(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-400"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={tempRating === 0}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500"
              >
                <Save className="w-4 h-4 mr-2" />
                SALVAR AVALIAÇÃO
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                CANCELAR
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
