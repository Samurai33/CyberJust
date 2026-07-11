"use client"

import { useState } from "react"
import { Shield, Headphones, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"

const NAV_ITEMS = ["CASOS", "PROTOCOLOS", "ESPECIALISTAS", "PROTEÇÃO", "DENÚNCIAS"]

export function Navigation() {
  const { handleLogoClick, logoClickCount, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="relative z-50 p-6 backdrop-blur-sm bg-black/50 border-b border-cyan-500/30">
      <div className="container mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div
            className={`w-10 h-10 bg-gradient-to-r from-cyan-400 to-red-500 rounded-sm flex items-center justify-center transition-all duration-300 ${
              logoClickCount > 0 && !isAuthenticated ? "animate-pulse scale-110" : ""
            }`}
          >
            <Shield className="w-6 h-6 text-black" />
          </div>
          <div className="text-left">
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
              CYBERJUSTIÇA
            </span>
            <div className="text-xs text-gray-400 font-mono">
              BRASIL.SYS
              {logoClickCount > 0 && !isAuthenticated && (
                <span className="ml-2 text-cyan-400 animate-pulse">[{logoClickCount}/3]</span>
              )}
            </div>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-cyan-400 hover:text-white transition-all duration-300 hover:glow-text relative group text-sm font-mono"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-red-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-gradient-to-r from-cyan-500 to-red-600 hover:from-cyan-400 hover:to-red-500 border-0 shadow-lg shadow-cyan-500/25">
            <Headphones className="w-4 h-4 mr-2" />
            OUÇA AGORA
          </Button>

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
              <div className="flex flex-col gap-6 mt-10">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-cyan-400 hover:text-white transition-all duration-300 text-lg font-mono"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
