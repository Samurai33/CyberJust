"use client"

import { useState, useEffect, useCallback } from "react"

interface EpisodeNote {
  id: string
  episodeId: string
  timestamp: number
  text: string
  createdAt: Date
  updatedAt: Date
}

export function useEpisodeNotes() {
  const [notes, setNotes] = useState<Record<string, EpisodeNote[]>>({})

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("cyberjustica-notes")
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes)
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach((episodeId) => {
          parsed[episodeId] = parsed[episodeId].map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          }))
        })
        setNotes(parsed)
      } catch (error) {
        console.error("Failed to load episode notes:", error)
      }
    }
  }, [])

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("cyberjustica-notes", JSON.stringify(notes))
  }, [notes])

  const addNote = useCallback((episodeId: string, timestamp: number, text: string) => {
    const newNote: EpisodeNote = {
      id: `${episodeId}-${Date.now()}`,
      episodeId,
      timestamp,
      text,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setNotes((prev) => ({
      ...prev,
      [episodeId]: [...(prev[episodeId] || []), newNote].sort((a, b) => a.timestamp - b.timestamp),
    }))

    return newNote.id
  }, [])

  const updateNote = useCallback((noteId: string, text: string) => {
    setNotes((prev) => {
      const newNotes = { ...prev }
      Object.keys(newNotes).forEach((episodeId) => {
        newNotes[episodeId] = newNotes[episodeId].map((note) =>
          note.id === noteId ? { ...note, text, updatedAt: new Date() } : note,
        )
      })
      return newNotes
    })
  }, [])

  const deleteNote = useCallback((noteId: string) => {
    setNotes((prev) => {
      const newNotes = { ...prev }
      Object.keys(newNotes).forEach((episodeId) => {
        newNotes[episodeId] = newNotes[episodeId].filter((note) => note.id !== noteId)
      })
      return newNotes
    })
  }, [])

  const getNotesForEpisode = useCallback(
    (episodeId: string): EpisodeNote[] => {
      return notes[episodeId] || []
    },
    [notes],
  )

  const exportNotes = useCallback(
    (episodeId?: string) => {
      const notesToExport = episodeId ? { [episodeId]: notes[episodeId] } : notes
      const dataStr = JSON.stringify(notesToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `cyberjustica-notes-${episodeId || "all"}-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    },
    [notes],
  )

  return {
    addNote,
    updateNote,
    deleteNote,
    getNotesForEpisode,
    exportNotes,
    allNotes: notes,
  }
}
