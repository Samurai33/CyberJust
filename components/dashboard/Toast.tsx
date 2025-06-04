"use client"

import { useEffect } from "react"
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react"
import { useDashboard } from "@/contexts/DashboardContext"

export function Toast() {
  const { toast, hideToast } = useDashboard()

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        hideToast()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [toast.visible, hideToast])

  if (!toast.visible) return null

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500/10 border-green-500/30"
      case "error":
        return "bg-red-500/10 border-red-500/30"
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30"
      default:
        return "bg-blue-500/10 border-blue-500/30"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[200] animate-slide-up">
      <div className={`p-4 rounded-md border shadow-lg backdrop-blur-sm ${getBgColor()}`}>
        <div className="flex items-center gap-3">
          {getIcon()}
          <div className="flex-1">
            <p className="text-white font-medium">{toast.message}</p>
          </div>
          <button onClick={hideToast} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
