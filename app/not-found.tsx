import Link from "next/link"
import { Home, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="bg-black/50 border-cyan-500/30 backdrop-blur-sm max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <SearchX className="w-8 h-8 text-cyan-400" />
          </div>
          <CardTitle className="text-cyan-400 font-mono">404 - NÃO ENCONTRADO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-sm text-center">A página que você procura não existe ou foi movida.</p>

          <Button
            asChild
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              VOLTAR AO INÍCIO
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
