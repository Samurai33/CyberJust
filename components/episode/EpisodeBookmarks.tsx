"use client"

import { useState } from "react"
import { Bookmark, BookmarkPlus, Clock, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAudio, useAudioTime } from "@/contexts/AudioContext"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import type { EpisodeBookmark } from "@/types"

const NO_BOOKMARKS: EpisodeBookmark[] = []
const DUPLICATE_TOLERANCE_SECONDS = 5

interface EpisodeBookmarksProps {
  episodeId: string | number
}

export function EpisodeBookmarks({ episodeId }: EpisodeBookmarksProps) {
  const [allBookmarks, setAllBookmarks] = useLocalStorage("cyberjus-bookmarks", NO_BOOKMARKS)
  const { currentEpisode } = useAudio()
  const { currentTime, seek, formatTime } = useAudioTime()
  const [newBookmarkNote, setNewBookmarkNote] = useState("")
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null)
  const [editNote, setEditNote] = useState("")

  // Bookmarks only make sense against this episode's own playback position.
  const isThisEpisodeLoaded = currentEpisode?.id === episodeId
  const bookmarks = allBookmarks
    .filter((b) => b.episodeId === episodeId)
    .sort((a, b) => a.timestamp - b.timestamp)
  const hasBookmarkHere = bookmarks.some((b) => Math.abs(b.timestamp - currentTime) <= DUPLICATE_TOLERANCE_SECONDS)

  const handleAddBookmark = () => {
    if (!isThisEpisodeLoaded || hasBookmarkHere) return
    const bookmark: EpisodeBookmark = {
      id: crypto.randomUUID(),
      episodeId,
      timestamp: currentTime,
      note: newBookmarkNote || undefined,
      createdAt: new Date().toISOString(),
    }
    setAllBookmarks((prev) => [...prev, bookmark])
    setNewBookmarkNote("")
  }

  const removeBookmark = (bookmarkId: string) => {
    setAllBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId))
  }

  const handleUpdateBookmark = (bookmarkId: string) => {
    setAllBookmarks((prev) => prev.map((b) => (b.id === bookmarkId ? { ...b, note: editNote } : b)))
    setEditingBookmark(null)
    setEditNote("")
  }

  const startEditing = (bookmarkId: string, currentNote: string) => {
    setEditingBookmark(bookmarkId)
    setEditNote(currentNote || "")
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Bookmark className="w-5 h-5" />
          Marcadores do Episódio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Bookmark */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAddBookmark}
              disabled={!isThisEpisodeLoaded || hasBookmarkHere}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Marcar Posição Atual
            </Button>
            <Badge variant="outline" className="font-mono">
              {isThisEpisodeLoaded ? formatTime(currentTime) : "--:--"}
            </Badge>
          </div>
          {!isThisEpisodeLoaded && (
            <p className="text-xs text-gray-500">Inicie este episódio para marcar uma posição.</p>
          )}
          <Input
            placeholder="Adicionar nota (opcional)"
            value={newBookmarkNote}
            onChange={(e) => setNewBookmarkNote(e.target.value)}
            className="bg-gray-800 border-gray-600"
          />
        </div>

        {/* Bookmarks List */}
        <div className="space-y-3">
          {bookmarks.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nenhum marcador criado ainda</p>
          ) : (
            bookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => seek(bookmark.timestamp)}
                          disabled={!isThisEpisodeLoaded}
                          className="text-cyan-400 hover:text-white hover:bg-cyan-500/20 p-1 h-auto"
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(bookmark.timestamp)}
                        </Button>
                        <Badge variant="outline" className="text-xs">
                          {new Date(bookmark.createdAt).toLocaleDateString("pt-BR")}
                        </Badge>
                      </div>

                      {editingBookmark === bookmark.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Adicionar nota..."
                            className="bg-gray-700 border-gray-600 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateBookmark(bookmark.id)}
                              className="bg-green-600 hover:bg-green-500"
                            >
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingBookmark(null)}
                              className="border-gray-600"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {bookmark.note ? (
                            <p className="text-gray-300 text-sm mb-2">{bookmark.note}</p>
                          ) : (
                            <p className="text-gray-500 text-sm italic mb-2">Sem nota</p>
                          )}
                        </div>
                      )}
                    </div>

                    {editingBookmark !== bookmark.id && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(bookmark.id, bookmark.note || "")}
                          aria-label="Editar nota"
                          className="text-gray-400 hover:text-white p-1 h-auto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBookmark(bookmark.id)}
                          aria-label="Remover marcador"
                          className="text-red-400 hover:text-red-300 p-1 h-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {bookmarks.length > 0 && (
          <div className="text-center pt-2">
            <Badge variant="outline" className="text-xs">
              {bookmarks.length} marcador{bookmarks.length !== 1 ? "es" : ""} criado{bookmarks.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
