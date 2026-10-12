"use client"

import { useState } from "react"
import Link from "next/link"
import { Shield, Headphones, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAudio } from "@/contexts/AudioContext"
import { episodes } from "@/data/episodes"
import { NAVIGATION_ITEMS } from "@/lib/constants"

const featuredEpisode = episodes.find((episode) => episode.audioUrl)

const linkClass =
  "text-cyan-400 hover:text-white transition-all duration-300 relative group text-sm font-mono"
const underline =
  "absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-red-500 group-hover:w-full transition-all duration-300"

export function Navigation() {
  const { playEpisode } = useAudio()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="relative z-40 p-6 backdrop-blur-sm bg-black/50 border-b border-cyan-500/30">
      <nav className="container mx-auto flex items-center justify-between" aria-label="Principal">
        <Link href="/" className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-red-500 rounded-sm flex items-center justify-center">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
              CYBERJUSTIÇA
            </span>
            <div className="text-xs text-gray-400 font-mono">BRASIL.SYS</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAVIGATION_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
              <span className={underline} />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {featuredEpisode && (
            <Button
              onClick={() => playEpisode(featuredEpisode)}
              className="hidden md:flex bg-gradient-to-r from-cyan-500 to-red-600 hover:from-cyan-400 hover:to-red-500 border-0 shadow-lg shadow-cyan-500/25"
            >
              <Headphones className="w-4 h-4 mr-2" />
              OUÇA AGORA
            </Button>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden border-cyan-500/30 bg-black/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-white"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black border-cyan-500/30 w-3/4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col gap-6 mt-10">
                {NAVIGATION_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-cyan-400 hover:text-white transition-all duration-300 text-lg font-mono"
                  >
                    {item.label}
                  </Link>
                ))}
                {featuredEpisode && (
                  <Button
                    onClick={() => {
                      playEpisode(featuredEpisode)
                      setMobileMenuOpen(false)
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-red-600 hover:from-cyan-400 hover:to-red-500 border-0"
                  >
                    <Headphones className="w-4 h-4 mr-2" />
                    OUÇA AGORA
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
