"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Route error boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="bg-black/50 border-red-500/30 backdrop-blur-sm max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-red-400 font-mono">ERRO DO SISTEMA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <p className="text-red-300 font-mono text-sm">CLASSIFICAÇÃO: CRÍTICO</p>
            <p className="text-gray-300 text-sm mt-2">Algo deu errado ao carregar esta página. Tente novamente.</p>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
              <p className="text-gray-400 font-mono text-xs">DEBUG: {error.message}</p>
            </div>
          )}

          <Button
            onClick={reset}
            className="w-full bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            TENTAR NOVAMENTE
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
