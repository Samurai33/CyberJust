"use client"

import { X, Shield, FileText, Clock, Eye, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUI } from "@/contexts/UIContext"

export function LuluModal() {
  const { selectedLuluModal, setSelectedLuluModal } = useUI()

  if (!selectedLuluModal) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black border-2 border-red-500/50 rounded-lg max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl shadow-red-500/25">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-900/50 to-cyan-900/50 border-b border-red-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-mono text-sm">CLASSIFICAÇÃO:</span>
                  <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-mono border border-red-500/50">
                    CRÍTICO
                  </span>
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-mono border border-yellow-500/50">
                    NÍVEL 5
                  </span>
                </div>
                <h2 className="text-white font-mono text-lg">CASO LULU - RELATÓRIO CONFIDENCIAL</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLuluModal(false)}
              className="text-gray-400 hover:text-white hover:bg-red-500/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
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

          {/* Classification Footer */}
          <div className="border-t border-red-500/30 pt-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-red-400">CLASSIFICAÇÃO: CRÍTICO</span>
                <span className="text-yellow-400">NÍVEL DE ACESSO: 5</span>
                <span className="text-cyan-400">ORIGEM: CYBERJUSTIÇA BRASIL</span>
              </div>
              <div className="text-gray-500">DOCUMENTO GERADO EM: {new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
