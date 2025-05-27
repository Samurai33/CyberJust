"use client"

import { Card, CardContent } from "@/components/ui/card"

export function TerminalSection() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <Card className="bg-black border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
          <CardContent className="p-0">
            <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-400 text-sm ml-4 font-mono">cyberjustica://terminal/v3.2.1</span>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="text-green-400 mb-2">
                <span className="text-cyan-400">admin@cyberjustica:~$</span> system.status()
              </div>
              <div className="text-gray-300 mb-4">
                <div>
                  {">"} Inicializando protocolos de investigação... <span className="text-green-400">[OK]</span>
                </div>
                <div>
                  {">"} Carregando base de dados de crimes... <span className="text-green-400">[OK]</span>
                </div>
                <div>
                  {">"} Estabelecendo conexão com especialistas... <span className="text-green-400">[OK]</span>
                </div>
                <div>
                  {">"} Calibrando sistemas de proteção... <span className="text-yellow-400">[PENDENTE]</span>
                </div>
              </div>
              <div className="text-cyan-400 mb-2">
                <span className="text-cyan-400">admin@cyberjustica:~$</span> podcast.listen()
              </div>
              <div className="text-purple-400">Conexão estabelecida. Bem-vindo ao CyberJustiça Brasil.</div>
              <div className="text-red-400 mt-2">AVISO: Mantenha-se sempre vigilante no mundo digital.</div>
              <div className="text-cyan-400 mt-4 animate-pulse">
                <span className="text-cyan-400">admin@cyberjustica:~$</span>{" "}
                <span className="bg-cyan-400 w-2 h-4 inline-block ml-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
