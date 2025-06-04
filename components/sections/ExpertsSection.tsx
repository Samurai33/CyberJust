"use client"

import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useExperts } from "@/contexts/ExpertsContext"
import { useEffect, useState } from "react"

export function ExpertsSection() {
  const { experts, refreshExperts } = useExperts()
  const [, setUpdateTrigger] = useState(0)

  // Escuta por atualizações nos experts
  useEffect(() => {
    const handleExpertsUpdate = () => {
      refreshExperts()
      setUpdateTrigger((prev) => prev + 1)
    }

    // Escuta o evento customizado de atualização de experts
    window.addEventListener("expertsUpdated", handleExpertsUpdate)

    // Também escuta mudanças no localStorage
    window.addEventListener("storage", (e) => {
      if (e.key === "cyberjustica-experts") {
        handleExpertsUpdate()
      }
    })

    return () => {
      window.removeEventListener("expertsUpdated", handleExpertsUpdate)
      window.removeEventListener("storage", handleExpertsUpdate)
    }
  }, [refreshExperts])

  // Se não houver experts, mostra uma mensagem
  if (experts.length === 0) {
    return (
      <section id="especialistas" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                AGENTES ESPECIALIZADOS
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Equipe de investigação cibernética</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Nenhum agente especializado encontrado.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="especialistas" className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              AGENTES ESPECIALIZADOS
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Equipe de investigação cibernética</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {experts.map((expert, index) => (
            <Card
              key={expert.id || index}
              className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm"
            >
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {expert.avatar ? (
                    <img
                      src={expert.avatar || "/placeholder.svg"}
                      alt={expert.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs">ATIVO</Badge>
                  {expert.organization && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 font-mono text-xs">
                      {expert.organization}
                    </Badge>
                  )}
                </div>
                <CardTitle className="group-hover:text-cyan-400 transition-colors font-mono">{expert.name}</CardTitle>
                <CardDescription className="text-purple-400 font-mono">{expert.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm text-center">
                  {expert.bio}
                </p>
                {expert.contact && (expert.contact.email || expert.contact.phone || expert.contact.linkedin) && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-500 space-y-1">
                      {expert.contact.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400">Email:</span>
                          <span className="truncate">{expert.contact.email}</span>
                        </div>
                      )}
                      {expert.contact.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400">Tel:</span>
                          <span>{expert.contact.phone}</span>
                        </div>
                      )}
                      {expert.contact.linkedin && (
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400">LinkedIn:</span>
                          <span className="truncate">{expert.contact.linkedin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
