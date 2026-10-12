import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EXPERTS } from "@/lib/constants"

export function ExpertsSection() {
  return (
    <section id="especialistas" className="py-20 px-6 scroll-mt-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              AGENTES ESPECIALIZADOS
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Equipe de investigação cibernética</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {EXPERTS.map((expert) => (
            <Card
              key={expert.name}
              className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm"
            >
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs">
                    {expert.status}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 font-mono text-xs">
                    {expert.clearance}
                  </Badge>
                </div>
                <CardTitle className="group-hover:text-cyan-400 transition-colors font-mono">{expert.name}</CardTitle>
                <CardDescription className="text-purple-400 font-mono">{expert.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm text-center">
                  {expert.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
