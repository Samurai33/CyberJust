"use client"

import type React from "react"
import { AlertTriangle, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type ChipListVariant = "badge" | "list" | "warning-list"

interface ChipListFieldProps {
  label: React.ReactNode
  items: string[]
  inputValue: string
  onInputChange: (value: string) => void
  onAdd: () => void
  onRemove: (item: string) => void
  placeholder: string
  disabled?: boolean
  addIcon?: React.ReactNode
  variant?: ChipListVariant
}

// Shared "add/remove chip" field — used for tags, key points and warnings,
// which previously each reimplemented the same add/remove pattern.
export function ChipListField({
  label,
  items,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
  disabled,
  addIcon = <Plus className="w-4 h-4" />,
  variant = "badge",
}: ChipListFieldProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onAdd()
    }
  }

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2 font-mono">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="bg-gray-900 border-cyan-500/30 text-white flex-1"
          disabled={disabled}
        />
        <Button type="button" onClick={onAdd} size="icon" variant="outline" disabled={disabled || !inputValue.trim()}>
          {addIcon}
        </Button>
      </div>

      {variant === "badge" ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="border-cyan-500/50 text-cyan-400 cursor-pointer hover:bg-red-500/20"
              onClick={() => !disabled && onRemove(item)}
            >
              {item} ×
            </Badge>
          ))}
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={
                variant === "warning-list"
                  ? "flex items-center gap-2 bg-red-900/20 border border-red-500/30 p-2 rounded"
                  : "flex items-center gap-2 bg-gray-800 p-2 rounded"
              }
            >
              {variant === "warning-list" ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <span className="text-cyan-400">▶</span>
              )}
              <span className={variant === "warning-list" ? "text-red-300 text-sm flex-1" : "text-gray-300 text-sm flex-1"}>
                {item}
              </span>
              <Button
                type="button"
                onClick={() => onRemove(item)}
                size="icon"
                variant="ghost"
                className="text-red-400 hover:text-red-300 h-10 w-10"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
