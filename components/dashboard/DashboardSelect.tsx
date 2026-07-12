"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from "@/components/ui/custom-select"
import { EPISODE_STATUS, THREAT_LEVELS } from "@/lib/constants"

interface DashboardSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  className?: string
  error?: boolean
  required?: boolean
}

export function DashboardSelect({
  value,
  onValueChange,
  placeholder = "Selecione uma opção...",
  options,
  disabled = false,
  className,
  error = false,
  required = false,
}: DashboardSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <CustomSelect
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CustomSelectTrigger
        className={cn(
          "bg-background border-cyan-500/30 text-foreground hover:border-cyan-500/50 focus:border-cyan-500 transition-colors",
          error && "border-red-500 focus:border-red-500",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <CustomSelectValue placeholder={placeholder} />
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
      </CustomSelectTrigger>
      <CustomSelectContent className="bg-popover border-border text-popover-foreground shadow-2xl" style={{ zIndex: 9999 }}>
        {options.map((option) => (
          <CustomSelectItem
            key={option.value}
            value={option.value}
            className="hover:bg-accent focus:bg-accent cursor-pointer"
          >
            {option.label}
          </CustomSelectItem>
        ))}
      </CustomSelectContent>
    </CustomSelect>
  )
}

// Componente específico para seleção de status
export function StatusSelect({
  value,
  onValueChange,
  disabled = false,
  error = false,
}: {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  error?: boolean
}) {
  const statusOptions = Object.keys(EPISODE_STATUS).map((status) => ({
    value: status,
    label: status,
  }))

  return (
    <DashboardSelect
      value={value}
      onValueChange={onValueChange}
      placeholder="Selecione o status..."
      options={statusOptions}
      disabled={disabled}
      error={error}
    />
  )
}

// Componente específico para seleção de nível de ameaça
export function ThreatSelect({
  value,
  onValueChange,
  disabled = false,
  error = false,
}: {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  error?: boolean
}) {
  const threatOptions = Object.keys(THREAT_LEVELS).map((threat) => ({
    value: threat,
    label: threat,
  }))

  return (
    <DashboardSelect
      value={value}
      onValueChange={onValueChange}
      placeholder="Selecione o nível de ameaça..."
      options={threatOptions}
      disabled={disabled}
      error={error}
    />
  )
}

// Componente específico para seleção de categoria
export function CategorySelect({
  value,
  onValueChange,
  disabled = false,
  error = false,
  categories,
}: {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  categories: readonly string[]
}) {
  const categoryOptions = categories.map((category) => ({
    value: category,
    label: category,
  }))

  return (
    <DashboardSelect
      value={value}
      onValueChange={onValueChange}
      placeholder="Selecione uma categoria..."
      options={categoryOptions}
      disabled={disabled}
      error={error}
    />
  )
}
