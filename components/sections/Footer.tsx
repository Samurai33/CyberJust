import Link from "next/link"
import { Shield } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { NAVIGATION_ITEMS } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-gray-800 bg-black/50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-red-500 rounded-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
                CYBERJUSTIÇA BRASIL
              </span>
              <div className="text-xs text-gray-400 font-mono">SISTEMA DE PROTEÇÃO DIGITAL</div>
            </div>
          </Link>

          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-mono">
            {NAVIGATION_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="text-gray-400 hover:text-cyan-400 transition-colors">
                {item.label}
              </Link>
            ))}
            <a
              href="https://new.safernet.org.br/denuncie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              SAFERNET
            </a>
          </nav>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-mono">
          <p className="text-gray-500">
            {">"} &ldquo;A segurança digital não é um destino, mas uma jornada contínua de vigilância e proteção.&rdquo;
          </p>
          <p className="text-gray-400">© {new Date().getFullYear()} CyberJustiça Brasil</p>
        </div>
      </div>
    </footer>
  )
}
