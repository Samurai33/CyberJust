"use client"

import { Shield, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="relative z-50 p-6 backdrop-blur-sm bg-black/50 border-b border-cyan-500/30">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-red-500 rounded-sm flex items-center justify-center">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
              CYBERJUSTIÇA
            </span>
            <div className="text-xs text-gray-400 font-mono">BRASIL.SYS</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["CASOS", "PROTOCOLOS", "ESPECIALISTAS", "PROTEÇÃO", "DENÚNCIAS"].map((item) => (
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

        <Button className="bg-gradient-to-r from-cyan-500 to-red-600 hover:from-cyan-400 hover:to-red-500 border-0 shadow-lg shadow-cyan-500/25">
          <Headphones className="w-4 h-4 mr-2" />
          OUÇA AGORA
        </Button>
      </div>
    </nav>
  )
}
