"use client"

import Link from "next/link"
import { FileText, Clock, Eye, MapPin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassifiedDocumentModal } from "@/components/modals/ClassifiedDocumentModal"
import { useUI } from "@/contexts/UIContext"
import { getEpisodeById } from "@/data/episodes"

// Sourced live from data/episodes.ts instead of hand-maintained copy - a
// previous hardcoded version drifted from the real episode-6 data (wrong
// affected-user count, generic "fraud scheme" framing instead of the actual
// data-leak/cyberbullying story) with nothing to catch it (#140).
const episode = getEpisodeById(6)

export function LuluModal() {
  const { selectedLuluModal, setSelectedLuluModal } = useUI()

  if (!episode) return null

  return (
    <ClassifiedDocumentModal
      open={selectedLuluModal}
      onOpenChange={setSelectedLuluModal}
      classification="CRÍTICO"
      accessLevel={5}
      title="CASO LULU - RELATÓRIO CONFIDENCIAL"
    >
      {/* Case Header */}
      <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-mono text-sm">CASO CRÍTICO - {episode.date}</span>
        </div>
        <h3 className="text-xl text-white font-mono mb-2">{episode.title}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {episode.date}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            NÍVEL DE AMEAÇA: {episode.threat}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            STATUS: {episode.status}
          </div>
        </div>
      </div>

      {/* Content */}
      <Card className="bg-gray-900/50 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 font-mono">Caso Lulu: Análise Completa</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 text-sm space-y-4">
          <p>{episode.fullDescription || episode.description}</p>
          {episode.keyPoints && episode.keyPoints.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
              <p className="text-red-300 font-mono text-xs">CLASSIFICADO: {episode.keyPoints[0]}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button asChild className="w-full bg-gradient-to-r from-cyan-500 to-red-600 hover:from-cyan-400 hover:to-red-500">
        <Link href={`/episodes/${episode.id}`} onClick={() => setSelectedLuluModal(false)}>
          Ver Detalhes Completos
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    </ClassifiedDocumentModal>
  )
}
