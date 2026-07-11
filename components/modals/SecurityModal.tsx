"use client"

import { FileText, AlertTriangle, Clock, Eye, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassifiedDocumentModal } from "@/components/modals/ClassifiedDocumentModal"
import { useUI } from "@/contexts/UIContext"

export function SecurityModal() {
  const { selectedEpisodeModal, setSelectedEpisodeModal } = useUI()

  return (
    <ClassifiedDocumentModal
      open={!!selectedEpisodeModal}
      onOpenChange={(open) => {
        if (!open) setSelectedEpisodeModal(null)
      }}
      classification="CONFIDENCIAL"
      accessLevel={4}
      title="RELATÓRIO DE INVESTIGAÇÃO DIGITAL"
    >
      {selectedEpisodeModal && (
        <>
          {/* Episode Header */}
          <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-500/5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 font-mono text-sm">EPISÓDIO {selectedEpisodeModal.id}</span>
            </div>
            <h3 className="text-xl text-white font-mono mb-2">{selectedEpisodeModal.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedEpisodeModal.date}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                NÍVEL DE AMEAÇA: {selectedEpisodeModal.threat}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                STATUS: {selectedEpisodeModal.status}
              </div>
            </div>
          </div>

          {/* Content */}
          <Card className="bg-gray-900/50 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-orange-400 font-mono flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Relatório de Investigação
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <p>{selectedEpisodeModal.description}</p>
              <p>
                Este documento contém informações classificadas sobre investigações em andamento. O acesso é
                restrito a pessoal autorizado com clearance de segurança adequado.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </ClassifiedDocumentModal>
  )
}
