"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SITE_URL } from "@/lib/constants"

interface EpisodeShareButtonProps {
  episodeId: string | number
  title: string
  size?: "sm" | "lg"
  showLabel?: boolean
  className?: string
}

export function EpisodeShareButton({
  episodeId,
  title,
  size = "lg",
  showLabel = true,
  className,
}: EpisodeShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${SITE_URL}/episodes/${episodeId}`

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User dismissed the native share sheet - not an error.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy episode link:", error)
    }
  }

  return (
    <Button size={size} variant="outline" className={className} onClick={handleShare} aria-label="Compartilhar episódio">
      {copied ? (
        <Check className={showLabel ? "w-4 h-4 mr-1" : "w-3 h-3"} />
      ) : (
        <Share2 className={showLabel ? "w-4 h-4 mr-1" : "w-3 h-3"} />
      )}
      {showLabel && (copied ? "Copiado!" : "Compartilhar")}
    </Button>
  )
}
