"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Clock, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useEpisodeNotes } from "@/hooks/useEpisodeNotes"
import { useAudio } from "@/contexts/AudioContext"

interface EpisodeNotesProps {
  episodeId: string
}

export function EpisodeNotes({ episodeId }: EpisodeNotesProps) {
  const { addNote, updateNote, deleteNote, getNotesForEpisode } = useEpisodeNotes()
  const { currentTime, formatTime } = useAudio()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newNoteText, setNewNoteText] = useState("")
  const [editText, setEditText] = useState("")

  const notes = getNotesForEpisode(episodeId)

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      addNote(episodeId, currentTime, newNoteText.trim())
      setNewNoteText("")
      setIsAdding(false)
    }
  }

  const handleEditNote = (noteId: string) => {
    if (editText.trim()) {
      updateNote(noteId, editText.trim())
      setEditingId(null)
      setEditText("")
    }
  }

  const startEdit = (noteId: string, currentText: string) => {
    setEditingId(noteId)
    setEditText(currentText)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  return (
    <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-mono flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            MINHAS ANOTAÇÕES ({notes.length})
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-400 hover:to-cyan-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            NOVA NOTA
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note */}
        {isAdding && (
          <div className="border border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 font-mono text-xs">
                {formatTime(currentTime)}
              </Badge>
            </div>
            <Textarea
              placeholder="Digite sua anotação..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNote} disabled={!newNoteText.trim()}>
                <Save className="w-3 h-3 mr-1" />
                SALVAR
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewNoteText("")
                }}
              >
                <X className="w-3 h-3 mr-1" />
                CANCELAR
              </Button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Edit2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma anotação ainda</p>
            <p className="text-sm">Adicione notas durante a reprodução</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-700 rounded-lg p-3 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-mono text-xs">
                    {formatTime(note.timestamp)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(note.id, note.text)}
                      className="text-gray-400 hover:text-white h-6 w-6 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNote(note.id)}
                      className="text-gray-400 hover:text-red-400 h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="bg-gray-900/50 border-gray-700 text-white"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditNote(note.id)}>
                        <Save className="w-3 h-3 mr-1" />
                        SALVAR
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="w-3 h-3 mr-1" />
                        CANCELAR
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm leading-relaxed">{note.text}</p>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  {note.createdAt.toLocaleDateString("pt-BR")} às {note.createdAt.toLocaleTimeString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
