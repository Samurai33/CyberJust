"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface MobileSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  className?: string
  error?: boolean
}

export function MobileSelect({
  value,
  onValueChange,
  placeholder = "Selecione uma opção...",
  options,
  disabled = false,
  className,
  error = false,
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const selectedOption = options.find((option) => option.value === value)

  if (isMobile) {
    return (
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-gray-900 border-cyan-500/30 text-white hover:border-cyan-500/50",
            error && "border-red-500",
            className,
          )}
        >
          <span className={cn(!selectedOption && "text-gray-400")}>{selectedOption?.label || placeholder}</span>
          <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm">
            <div className="fixed bottom-0 left-0 right-0 z-[301]">
              <Card className="bg-gray-900 border-gray-700 rounded-t-lg rounded-b-none">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-white font-medium">Selecionar opção</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-gray-400">
                      ✕
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onValueChange(option.value)
                          setIsOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition-colors",
                          value === option.value && "bg-gray-800",
                        )}
                      >
                        <span className="text-white">{option.label}</span>
                        {value === option.value && <Check className="h-4 w-4 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop version - use the regular DashboardSelect
  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-between bg-gray-900 border-cyan-500/30 text-white hover:border-cyan-500/50",
          error && "border-red-500",
          className,
        )}
      >
        <span className={cn(!selectedOption && "text-gray-400")}>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[200] mt-1">
          <Card className="bg-gray-900 border-gray-700 shadow-2xl">
            <CardContent className="p-1">
              <div className="max-h-60 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onValueChange(option.value)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 text-left hover:bg-gray-800 rounded transition-colors",
                      value === option.value && "bg-gray-800",
                    )}
                  >
                    <span className="text-white text-sm">{option.label}</span>
                    {value === option.value && <Check className="h-4 w-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
