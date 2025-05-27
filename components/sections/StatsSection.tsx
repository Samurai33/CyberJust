"use client"

import { TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function StatsSection() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              ESTATÍSTICAS ALARMANTES
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Dados de ameaças cibernéticas no Brasil</p>
        </div>

        <Card className="bg-black/50 border-red-500/30 backdrop-blur-sm p-8 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-12 w-12 text-red-500" />
              <span className="text-6xl font-bold text-red-500 font-mono">+100%</span>
            </div>
            <p className="text-xl text-gray-300 font-mono">AUMENTO NAS DENÚNCIAS DE CRIMES CIBERNÉTICOS DESDE 2018</p>
          </div>

          <Separator className="my-8 bg-gray-700" />

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h4 className="font-bold text-cyan-400 mb-3 font-mono">GRUPOS MAIS VULNERÁVEIS</h4>
              <p className="text-gray-300 text-sm">
                Idosos e jovens entre 18-25 anos são os alvos mais frequentes de golpistas que exploram inexperiência
                digital ou confiança excessiva nas plataformas online.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h4 className="font-bold text-purple-400 mb-3 font-mono">CRIMES MAIS COMUNS</h4>
              <p className="text-gray-300 text-sm">
                Fraudes bancárias lideram o ranking, seguidas por crimes contra a dignidade sexual e roubo de dados
                pessoais.
              </p>
            </Card>
          </div>
        </Card>
      </div>
    </section>
  )
}
