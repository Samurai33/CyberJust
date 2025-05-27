"use client"

import { ChevronDown, Play, Radio, Volume2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUI } from "@/contexts/UIContext"
import { useAudio } from "@/contexts/AudioContext"

interface Episode {
  id: number | string
  title: string
  date: string
  description: string
  status: string
  threat: string
  audioUrl?: string | null
  duration?: string
}

interface HeroSectionProps {
  episodes: Episode[]
}

export function HeroSection({ episodes }: HeroSectionProps) {
  const { glitchText } = useUI()
  const { playEpisode } = useAudio()

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-5xl mx-auto">
        <div className="mb-8">
          <Badge className="bg-gradient-to-r from-red-500/20 to-cyan-500/20 text-red-400 border-red-500/50 mb-4 font-mono">
            <AlertTriangle className="w-3 h-3 mr-1" />
            SISTEMA DE INVESTIGAÇÃO ATIVO
          </Badge>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-4 relative">
          <span
            className="bg-gradient-to-r from-cyan-400 via-red-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
            style={{
              textShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
              filter: "drop-shadow(0 0 10px rgba(255, 0, 0, 0.3))",
            }}
          >
            {glitchText}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent opacity-30 blur-sm">
            {glitchText}
          </div>
        </h1>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          BRASIL: HISTÓRIAS REAIS DE <span className="text-red-400">CRIMES CIBERNÉTICOS</span>
        </h2>

        <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed font-mono">
          <span className="text-cyan-400">{">"}</span> Desvendamos os bastidores dos maiores crimes digitais do Brasil.{" "}
          <span className="text-red-400">Histórias reais</span>, especialistas renomados e{" "}
          <span className="text-purple-400">dicas essenciais</span> para sua proteção no mundo virtual.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500 shadow-lg shadow-red-500/25 group"
            onClick={() => playEpisode(episodes[0])}
          >
            <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            OUÇA AGORA
            <Volume2 className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
          >
            <Radio className="w-5 h-5 mr-2" />
            INSCREVA-SE
          </Button>
        </div>

        <div className="animate-bounce">
          <ChevronDown className="w-8 h-8 text-cyan-400 mx-auto" />
        </div>
      </div>

      {/* Animated Rings */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 border border-cyan-500/30 rounded-full animate-spin-slow" />
          <div className="absolute inset-4 border border-red-500/30 rounded-full animate-spin-reverse" />
          <div className="absolute inset-8 border border-purple-500/30 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
