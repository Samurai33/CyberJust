import type React from "react"
import { combineClasses, getStatusColor, getThreatColor } from "@/lib/styles"

interface BadgeProps {
  children: React.ReactNode
  variant?: "status" | "threat" | "default"
  value?: string
  className?: string
}

export function Badge({ children, variant = "default", value, className }: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "status":
        return value ? getStatusColor(value) : ""
      case "threat":
        return value ? getThreatColor(value) : ""
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <span
      className={combineClasses(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
        getVariantClasses(),
        className,
      )}
    >
      {children}
    </span>
  )
}
