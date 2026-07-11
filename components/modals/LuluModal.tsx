"use client"

import { FileText, Clock, Eye, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassifiedDocumentModal } from "@/components/modals/ClassifiedDocumentModal"
import { useUI } from "@/contexts/UIContext"

export function LuluModal() {
  const { selectedLuluModal, setSelectedLuluModal } = useUI()

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
          <span className="text-red-400 font-mono text-sm">CASO CRÍTICO - 2023</span>
        </div>
        <h3 className="text-xl text-white font-mono mb-2">Caso Lulu: Uso Indevido de Dados Pessoais em 2023</h3>
        <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            2023
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            NÍVEL DE AMEAÇA: CRÍTICO
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            STATUS: ARQUIVADO
          </div>
        </div>
      </div>

      {/* Content */}
      <Card className="bg-gray-900/50 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 font-mono">Caso Lulu: Análise Completa</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 text-sm space-y-4">
          <p>
            Em 2023, o Brasil enfrentou um dos maiores escândalos de vazamento e uso indevido de dados pessoais de
            sua história. O Caso Lulu expôs como criminosos utilizaram informações vazadas para criar um sofisticado
            esquema de fraudes, afetando centenas de milhares de brasileiros.
          </p>
          <p>
            Este documento analisa o escândalo, seu contexto, impactos, respostas institucionais e lições aprendidas
            para a proteção de dados no país.
          </p>
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <p className="text-red-300 font-mono text-xs">
              CLASSIFICADO: Centenas de milhares de brasileiros expostos a fraudes e tentativas de extorsão
            </p>
          </div>
        </CardContent>
      </Card>
    </ClassifiedDocumentModal>
  )
}
