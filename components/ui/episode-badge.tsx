import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { getStatusColor, getThreatColor } from "@/lib/utils"
import type { EpisodeStatus, ThreatLevel } from "@/types"

interface EpisodeBadgeProps {
  status?: EpisodeStatus
  threat?: ThreatLevel
  variant?: "status" | "threat"
  showIcon?: boolean
}

export function EpisodeBadge({ status, threat, variant = "status", showIcon = false }: EpisodeBadgeProps) {
  if (variant === "status" && status) {
    return (
      <Badge className={getStatusColor(status)} variant="outline">
        {status}
      </Badge>
    )
  }

  if (variant === "threat" && threat) {
    return (
      <Badge className={getThreatColor(threat)} variant="outline">
        {showIcon && <AlertTriangle className="w-3 h-3 mr-1" />}
        {threat}
      </Badge>
    )
  }

  return null
}
