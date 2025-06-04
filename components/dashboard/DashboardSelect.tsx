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
          "bg-gray-900 border-cyan-500/30 text-white hover:border-cyan-500/50 focus:border-cyan-500 transition-colors",
          error && "border-red-500 focus:border-red-500",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <CustomSelectValue placeholder={placeholder} />
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
      </CustomSelectTrigger>
      <CustomSelectContent className="bg-gray-900 border-gray-700 text-white shadow-2xl" style={{ zIndex: 9999 }}>
        {options.map((option) => (
          <CustomSelectItem
            key={option.value}
            value={option.value}
            className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
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
  const statusOptions = [
    { value: "ATIVO", label: "ATIVO" },
    { value: "ARQUIVADO", label: "ARQUIVADO" },
    { value: "RESOLVIDO", label: "RESOLVIDO" },
    { value: "AGENDADO", label: "AGENDADO" },
    { value: "EM_ANDAMENTO", label: "EM ANDAMENTO" },
    { value: "CONCLUIDO", label: "CONCLUÍDO" },
  ]

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
  const threatOptions = [
    { value: "CRÍTICO", label: "CRÍTICO" },
    { value: "ALTO", label: "ALTO" },
    { value: "MÉDIO", label: "MÉDIO" },
    { value: "BAIXO", label: "BAIXO" },
  ]

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
  categories: string[]
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
