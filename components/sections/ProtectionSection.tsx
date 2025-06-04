"use client"

import { Lock, Shield, AlertTriangle, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PROTECTION_TIPS } from "@/lib/constants"

const iconMap = {
  "FORTALEÇA SUAS SENHAS": Lock,
  "PROTEJA SEUS DADOS": Shield,
  "IDENTIFIQUE TENTATIVAS DE GOLPE": AlertTriangle,
  "SAIBA COMO DENUNCIAR": Phone,
}

export function ProtectionSection() {
  return (
    <section id="proteção" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
              PROTOCOLOS DE SEGURANÇA
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Diretrizes de proteção cibernética</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROTECTION_TIPS.map((tip, index) => {
            const Icon = iconMap[tip.title as keyof typeof iconMap] || Lock

            return (
              <Card
                key={index}
                className="bg-black/50 border-gray-800 hover:border-green-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-green-500/25 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white group-hover:text-green-400 transition-colors font-mono text-sm">
                      {tip.title}
                    </h3>
                  </div>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">{tip.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
