"use client"

import { CreditCard, Database, Heart, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EpisodeBadge } from "@/components/ui/episode-badge"
import { CRIME_TYPES } from "@/lib/constants"

const iconMap = {
  "FRAUDES FINANCEIRAS": CreditCard,
  "ROUBO DE DADOS": Database,
  "CRIMES CONTRA DIGNIDADE": Heart,
  "ALICIAMENTO ONLINE": UserCheck,
  "GOLPES EM RELACIONAMENTOS": Heart,
}

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
          {CRIME_TYPES.map((crime, index) => {
            const Icon = iconMap[crime.title as keyof typeof iconMap] || CreditCard

            return (
              <Card
                key={index}
                className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm text-center"
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <EpisodeBadge threat={crime.threat} variant="threat" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors font-mono">
                    {crime.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">{crime.desc}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
