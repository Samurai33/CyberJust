"use client"

import { CreditCard, Database, Heart, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const crimeTypes = [
  {
    icon: CreditCard,
    title: "FRAUDES FINANCEIRAS",
    desc: "Golpes bancários e estelionato digital",
    color: "red",
    threat: "CRÍTICO",
  },
  {
    icon: Database,
    title: "ROUBO DE DADOS",
    desc: "Uso indevido de informações pessoais",
    color: "orange",
    threat: "ALTO",
  },
  {
    icon: Heart,
    title: "CRIMES CONTRA DIGNIDADE",
    desc: "Violações da intimidade e dignidade sexual",
    color: "purple",
    threat: "ALTO",
  },
  {
    icon: UserCheck,
    title: "ALICIAMENTO ONLINE",
    desc: "Predadores digitais em redes sociais",
    color: "yellow",
    threat: "CRÍTICO",
  },
  {
    icon: Heart,
    title: "GOLPES EM RELACIONAMENTOS",
    desc: "Fraudes em aplicativos de encontros",
    color: "pink",
    threat: "MÉDIO",
  },
]

export function CrimeTypesSection() {
  return (
    <section id="protocolos" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-transparent">
              TIPOS DE AMEAÇAS CIBERNÉTICAS
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Classificação de vetores de ataque</p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
          {crimeTypes.map((crime, index) => (
            <Card
              key={index}
              className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm text-center"
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <crime.icon className="w-8 h-8 text-white" />
                  </div>
                  <Badge
                    className={`font-mono text-xs mb-2 ${
                      crime.threat === "CRÍTICO"
                        ? "bg-red-500/20 text-red-400 border-red-500/50"
                        : crime.threat === "ALTO"
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                    }`}
                  >
                    {crime.threat}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors font-mono">
                  {crime.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">{crime.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
