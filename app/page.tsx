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
import { DashboardAuthModal } from "@/components/dashboard/DashboardAuthModal"
import { Dashboard } from "@/components/dashboard/Dashboard"
import { episodes } from "@/data/episodes"
import { useDashboard } from "@/contexts/DashboardContext"

export default function CyberJusticaBrasil() {
  const { isAuthenticated } = useDashboard()

  if (isAuthenticated) {
    return <Dashboard />
  }

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
      <DashboardAuthModal />

      {/* Audio Player */}
      <AudioPlayer />
    </div>
  )
}
