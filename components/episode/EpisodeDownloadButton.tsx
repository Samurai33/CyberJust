import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EpisodeDownloadButtonProps {
  audioUrl?: string | null
  size?: "sm" | "lg"
  label?: string
  className?: string
}

export function EpisodeDownloadButton({
  audioUrl,
  size = "lg",
  label = "Download",
  className,
}: EpisodeDownloadButtonProps) {
  if (!audioUrl) {
    return (
      <Button size={size} variant="outline" className={className} disabled>
        <Download className="w-4 h-4 mr-1" />
        {label}
      </Button>
    )
  }

  return (
    <Button size={size} variant="outline" className={className} asChild>
      <a href={audioUrl} target="_blank" rel="noopener noreferrer" download>
        <Download className="w-4 h-4 mr-1" />
        {label}
      </a>
    </Button>
  )
}
