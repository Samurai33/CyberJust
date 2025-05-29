"use client"

import { Lock, Shield, AlertTriangle, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function ProtectionSection() {
  return (
    <section id="protecao" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
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
          {[
            {
              icon: Lock,
              title: "FORTALEÇA SUAS SENHAS",
              description:
                "Utilize senhas fortes e únicas para cada serviço, preferencialmente com gerenciadores de senha. Ative a autenticação em dois fatores sempre que possível.",
              color: "blue",
            },
            {
              icon: Shield,
              title: "PROTEJA SEUS DADOS",
              description:
                "Compartilhe informações pessoais apenas em sites seguros (https://). Evite fornecer dados sensíveis em redes públicas.",
              color: "green",
            },
            {
              icon: AlertTriangle,
              title: "IDENTIFIQUE TENTATIVAS DE GOLPE",
              description:
                "Desconfie de ofertas imperdíveis, mensagens urgentes solicitando dados ou links suspeitos. Verifique sempre a legitimidade.",
              color: "orange",
            },
            {
              icon: Phone,
              title: "SAIBA COMO DENUNCIAR",
              description:
                "Utilize os canais oficiais: delegacias especializadas, SaferNet, ou o portal de denúncias do Ministério Público.",
              color: "red",
            },
          ].map((tip, index) => (
            <Card
              key={index}
              className="bg-black/50 border-gray-800 hover:border-green-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-green-500/25 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <tip.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white group-hover:text-green-400 transition-colors font-mono text-sm">
                    {tip.title}
                  </h3>
                </div>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">{tip.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
