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
import { episodes } from "@/data/episodes"

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <Background />
      <HeroSection />
      <AboutSection />
      <EpisodesSection episodes={episodes} />
      <CrimeTypesSection />
      <ExpertsSection />
      <ProtectionSection />
      <StatsSection />
      <ContactSection />
      <TerminalSection />
    </div>
  )
}
