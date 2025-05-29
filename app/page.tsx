"use client"

import { Navigation } from "@/components/sections/Navigation"
import { Background } from "@/components/sections/Background"
import { HeroSection } from "@/components/sections/HeroSection"
import { AboutSection } from "@/components/sections/AboutSection"
import { EpisodesSection } from "@/components/sections/EpisodesSection"
import { CrimeTypesSection } from "@/components/sections/CrimeTypesSection"
import { ExpertsSection } from "@/components/sections/ExpertsSection"
import { ProtectionSection } from "@/components/sections/ProtectionSection"
import { StatsSection } from "@/components/sections/StatsSection"
import { ContactSection } from "@/components/sections/ContactSection"
import { TerminalSection } from "@/components/sections/TerminalSection"
import { Footer } from "@/components/sections/Footer"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import { SecurityModal } from "@/components/modals/SecurityModal"
import { LuluModal } from "@/components/modals/LuluModal"

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

const episodes: Episode[] = [
  {
    id: 13,
    title: "Crimes cibernéticos, fraude e estelionato",
    date: "15/05/2024",
    description:
      "Revela como quadrilhas brasileiras estão utilizando tecnologias avançadas para aplicar golpes financeiros sofisticados e como as autoridades estão respondendo.",
    status: "ATIVO",
    threat: "ALTO",
    audioUrl: null,
    duration: "45:30",
  },
  {
    id: 6,
    title: "Caso Lulu - uso indevido de dados pessoais",
    date: "2023",
    description:
      "Um dos casos mais impactantes de 2023, exploramos como criminosos utilizaram dados vazados para criar um esquema de fraude que afetou milhares de brasileiros.",
    status: "ARQUIVADO",
    threat: "CRÍTICO",
    audioUrl: "/placeholder-audio.mp3",
  },
  {
    id: 5,
    title: '"NaMoral" - Combate à corrupção nas redes',
    date: "2023",
    description:
      "Detalhamos a operação que desmantelou uma rede de corrupção que operava através de plataformas digitais, com entrevistas exclusivas dos investigadores.",
    status: "RESOLVIDO",
    threat: "MÉDIO",
    audioUrl: "/placeholder-audio.mp3",
  },
  {
    id: "ESPECIAL",
    title: "Proteção de crianças e adolescentes online",
    date: "06/05/2025",
    description:
      "Este especial abordará os perigos que crianças enfrentam online e estratégias eficazes de proteção, com depoimentos de especialistas.",
    status: "AGENDADO",
    threat: "ALTO",
    audioUrl: "https://audio.jukehost.co.uk/O2Voc6ZqKgWKe9b3ho7xZOBWVu5Yp2oh",
  },
]

export default function CyberJusticaBrasil() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Background />
      <Navigation />
      <HeroSection episodes={episodes} />
      <AboutSection />
      <EpisodesSection episodes={episodes} />
      <CrimeTypesSection />
      <ExpertsSection />
      <ProtectionSection />
      <StatsSection />
      <ContactSection />
      <TerminalSection />
      <Footer />

      {/* Modals */}
      <SecurityModal />
      <LuluModal />

      {/* Audio Player */}
      <AudioPlayer />
    </div>
  )
}
