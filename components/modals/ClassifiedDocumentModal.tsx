"use client"

import type React from "react"

import { Shield } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ClassifiedDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classification: string
  accessLevel: number | string
  title: string
  children: React.ReactNode
}

/**
 * Shared "classified document" chrome used by LuluModal and SecurityModal:
 * the red/cyan gradient header with classification badges, the Radix Dialog
 * close button, and the classification footer. The document-specific body
 * (case/episode summary block + report card) is passed in as children.
 */
export function ClassifiedDocumentModal({
  open,
  onOpenChange,
  classification,
  accessLevel,
  title,
  children,
}: ClassifiedDocumentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-2 border-red-500/50 max-w-6xl max-h-[90vh] gap-0 overflow-hidden p-0 shadow-2xl shadow-red-500/25">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-900/50 to-cyan-900/50 border-b border-red-500/30 p-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-mono text-sm">CLASSIFICAÇÃO:</span>
                  <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-mono border border-red-500/50">
                    {classification}
                  </span>
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-mono border border-yellow-500/50">
                    NÍVEL {accessLevel}
                  </span>
                </div>
                <DialogTitle className="text-white font-mono text-lg font-normal leading-snug">
                  {title}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
          {children}

          {/* Classification Footer */}
          <div className="border-t border-red-500/30 pt-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-red-400">CLASSIFICAÇÃO: {classification}</span>
                <span className="text-yellow-400">NÍVEL DE ACESSO: {accessLevel}</span>
                <span className="text-cyan-400">ORIGEM: CYBERJUSTIÇA BRASIL</span>
              </div>
              <div className="text-gray-500">DOCUMENTO GERADO EM: {new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
