"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRatings } from "@/contexts/RatingContext"

interface EpisodeRatingProps {
  episodeId: string | number
}

export function EpisodeRating({ episodeId }: EpisodeRatingProps) {
  const { getEpisodeRatings, getAverageRating, getUserRating, addRating, updateRating } = useRatings()
  const [selectedRating, setSelectedRating] = useState(0)
  const [review, setReview] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const episodeRatings = getEpisodeRatings(episodeId)
  const averageRating = getAverageRating(episodeId)
  const userRating = getUserRating(episodeId)

  const handleSubmitRating = () => {
    if (selectedRating > 0) {
      if (userRating) {
        updateRating(userRating.id, { rating: selectedRating, review: review || undefined })
      } else {
        addRating(episodeId, selectedRating, review || undefined)
      }
      setIsDialogOpen(false)
      setSelectedRating(0)
      setReview("")
    }
  }

  const renderStars = (rating: number, interactive = false, size: "sm" | "md" | "lg" = "md") => {
    const starSize = size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
            } ${interactive ? "cursor-pointer hover:text-yellow-300" : ""}`}
            onClick={interactive ? () => setSelectedRating(star) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Avaliações do Episódio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Rating Display */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {renderStars(Math.round(averageRating), false, "lg")}
            <span className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</span>
          </div>
          <p className="text-gray-400 text-sm">
            {episodeRatings.length} avaliação{episodeRatings.length !== 1 ? "ões" : ""}
          </p>
        </div>

        {/* User Rating Section */}
        <div className="space-y-3">
          {userRating ? (
            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Sua avaliação:</span>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-gray-600">
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Editar Avaliação</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Classificação:</label>
                          {renderStars(selectedRating || userRating.rating, true, "lg")}
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Comentário (opcional):</label>
                          <Textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Compartilhe sua opinião sobre este episódio..."
                            className="bg-gray-800 border-gray-600"
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={handleSubmitRating}
                          disabled={selectedRating === 0}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500"
                        >
                          Atualizar Avaliação
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(userRating.rating)}
                  <Badge variant="outline" className="text-xs">
                    {new Date(userRating.timestamp).toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
                {userRating.review && <p className="text-gray-300 text-sm">{userRating.review}</p>}
              </CardContent>
            </Card>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500">
                  <Star className="w-4 h-4 mr-2" />
                  Avaliar Episódio
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Avaliar Episódio</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Classificação:</label>
                    {renderStars(selectedRating, true, "lg")}
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Comentário (opcional):</label>
                    <Textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Compartilhe sua opinião sobre este episódio..."
                      className="bg-gray-800 border-gray-600"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitRating}
                    disabled={selectedRating === 0}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500"
                  >
                    Enviar Avaliação
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Recent Reviews */}
        {episodeRatings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-400">Avaliações Recentes:</h4>
            {episodeRatings.slice(0, 3).map((rating) => (
              <Card key={rating.id} className="bg-gray-800 border-gray-600">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    {renderStars(rating.rating, false, "sm")}
                    <Badge variant="outline" className="text-xs">
                      {new Date(rating.timestamp).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                  {rating.review && <p className="text-gray-300 text-sm">{rating.review}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
