"use client"

import { Users, Edit, Trash2, Mail, Phone, Linkedin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "@/contexts/DashboardContext"
import type { ProjectExpert } from "@/types/project"

interface ExpertCardProps {
  expert: ProjectExpert
}

export function ExpertCard({ expert }: ExpertCardProps) {
  const { openExpertModal, deleteExpert } = useDashboard()

  return (
    <Card className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
          {expert.avatar ? (
            <img
              src={expert.avatar || "/placeholder.svg"}
              alt={expert.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Users className="w-10 h-10 text-white" />
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs">ATIVO</Badge>
          {expert.organization && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 font-mono text-xs">
              {expert.organization}
            </Badge>
          )}
        </div>
        <CardTitle className="group-hover:text-cyan-400 transition-colors font-mono">{expert.name}</CardTitle>
        <CardDescription className="text-purple-400 font-mono">{expert.role}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm text-center mb-4">
          {expert.bio}
        </p>

        {/* Contact Info */}
        <div className="space-y-2 mt-4">
          {expert.contact?.email && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Mail className="w-3 h-3" />
              <span>{expert.contact.email}</span>
            </div>
          )}
          {expert.contact?.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone className="w-3 h-3" />
              <span>{expert.contact.phone}</span>
            </div>
          )}
          {expert.contact?.linkedin && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Linkedin className="w-3 h-3" />
              <span>{expert.contact.linkedin}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            onClick={() => openExpertModal(expert)}
          >
            <Edit className="w-3 h-3 mr-1" />
            EDITAR
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => deleteExpert(expert.id)}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            REMOVER
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
