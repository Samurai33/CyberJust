"use client"

import { Card, CardContent } from "@/components/ui/card"

export function AboutSection() {
  return (
    <section id="sobre" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
              SOBRE NOSSO PROTOCOLO
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Sistema de análise de crimes cibernéticos</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Card className="bg-black/50 border-cyan-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <p className="text-gray-300 leading-relaxed mb-4">
                  O <span className="text-cyan-400 font-mono">CyberJustiça Brasil</span> traz semanalmente análises
                  aprofundadas de casos reais de crimes cibernéticos que abalaram o país. Com especialistas em segurança
                  digital, autoridades e investigadores, desvendamos os métodos dos criminosos e como eles foram
                  capturados.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Nossas entrevistas exclusivas com vítimas oferecem uma perspectiva única sobre o impacto desses
                  crimes, enquanto nosso conteúdo educativo fornece ferramentas práticas para sua proteção digital.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { value: "50+", label: "CASOS ANALISADOS", color: "cyan" },
              { value: "100K+", label: "USUÁRIOS PROTEGIDOS", color: "red" },
              { value: "20+", label: "ESPECIALISTAS", color: "purple" },
              { value: "3", label: "ANOS ATIVOS", color: "green" },
            ].map((stat, index) => (
              <Card
                key={index}
                className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group text-center"
              >
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm font-mono">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
