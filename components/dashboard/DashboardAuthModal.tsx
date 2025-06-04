"use client"

import type React from "react"

import { useState } from "react"
import { X, Shield, Lock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/contexts/DashboardContext"

export function DashboardAuthModal() {
  const { showAuthModal, authenticate, closeAuthModal } = useDashboard()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)

  if (!showAuthModal) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (authenticate(code)) {
      setCode("")
      setError("")
      setAttempts(0)
    } else {
      setError("Código de acesso inválido")
      setAttempts((prev) => prev + 1)
      setCode("")

      if (attempts >= 2) {
        setTimeout(() => {
          closeAuthModal()
          setAttempts(0)
          setError("")
        }, 2000)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-black border-2 border-cyan-500/50 max-w-md w-full shadow-2xl shadow-cyan-500/25">
        <CardHeader className="bg-gradient-to-r from-cyan-900/50 to-red-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <CardTitle className="text-cyan-400 font-mono">ACESSO RESTRITO</CardTitle>
                <p className="text-xs text-gray-400 font-mono">SISTEMA DE GERENCIAMENTO</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeAuthModal}
              className="text-gray-400 hover:text-white hover:bg-red-500/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl text-white font-mono mb-2">AUTENTICAÇÃO REQUERIDA</h3>
            <p className="text-gray-400 text-sm">
              Insira o código de acesso para acessar o painel de gerenciamento de projetos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">CÓDIGO DE ACESSO:</label>
              <Input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código secreto..."
                className="bg-gray-900 border-cyan-500/30 text-white font-mono text-center tracking-widest"
                autoFocus
                maxLength={10}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm font-mono">{error}</p>
              </div>
            )}

            {attempts > 0 && (
              <div className="text-center">
                <p className="text-yellow-400 text-xs font-mono">
                  TENTATIVAS: {attempts}/3
                  {attempts >= 2 && " - BLOQUEIO AUTOMÁTICO EM 2s"}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                disabled={!code.trim() || attempts >= 3}
              >
                <Shield className="w-4 h-4 mr-2" />
                AUTENTICAR
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeAuthModal}
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                CANCELAR
              </Button>
            </div>
          </form>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-500 text-center font-mono">SISTEMA PROTEGIDO • ACESSO AUTORIZADO APENAS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
