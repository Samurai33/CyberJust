"use client"

import { Button } from "@/components/ui/button"

interface EpisodeResourceButtonProps {
  url: string
}

export function EpisodeResourceButton({ url }: EpisodeResourceButtonProps) {
  return (
    <Button size="sm" variant="outline" className="w-full" onClick={() => window.open(url, "_blank")}>
      Acessar Recurso
    </Button>
  )
}
