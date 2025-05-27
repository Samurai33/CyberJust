"use client"

import { MessageSquare, AlertTriangle, Radio } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ContactSection() {
  return (
    <section id="denúncias" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              CANAIS DE COMUNICAÇÃO
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Estabeleça conexão com nossa central</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm text-center">
            <CardContent className="p-6">
              <MessageSquare className="h-12 w-12 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors font-mono">
                SUGESTÕES DE TEMAS
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Tem uma história para compartilhar ou um tema que gostaria de ver abordado? Preencha nosso formulário e
                ajude a construir nossos próximos episódios.
              </p>
              <Button variant="outline" size="sm" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                ENVIAR SUGESTÃO
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm text-center">
            <CardContent className="p-6">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white mb-2 group-hover:text-red-400 transition-colors font-mono">
                DENÚNCIAS
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Para denúncias de crimes cibernéticos, direcione-as aos canais oficiais: Delegacia Virtual, SaferNet ou
                Ministério Público.
              </p>
              <Button variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500/10">
                CANAIS OFICIAIS
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm text-center">
            <CardContent className="p-6">
              <Radio className="h-12 w-12 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white mb-2 group-hover:text-purple-400 transition-colors font-mono">
                ONDE NOS ENCONTRAR
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Disponível em todas as principais plataformas: Spotify, Apple Podcasts, Google Podcasts, Deezer e
                YouTube.
              </p>
              <Button variant="outline" size="sm" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                TODAS AS PLATAFORMAS
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
