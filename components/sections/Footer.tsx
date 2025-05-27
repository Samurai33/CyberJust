"use client"

import { Shield } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-gray-800 bg-black/50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-red-500 rounded-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
                CYBERJUSTIÇA BRASIL
              </span>
              <div className="text-xs text-gray-400 font-mono">SISTEMA DE PROTEÇÃO DIGITAL</div>
            </div>
          </div>

          <div className="text-gray-400 text-sm font-mono">
            © 2024 CyberJustiça Brasil. Todos os direitos reservados.
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="text-center">
          <p className="text-gray-500 text-sm font-mono">
            {">"} "A segurança digital não é um destino, mas uma jornada contínua de vigilância e proteção."
          </p>
        </div>
      </div>
    </footer>
  )
}
