"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/contexts/DashboardContext"

export function ConfirmationDialog() {
  const { showConfirmDialog, confirmDialogProps, closeConfirmDialog, confirmAction } = useDashboard()

  if (!showConfirmDialog) return null

  return (
    <div className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-black border-2 border-red-500/50 max-w-md w-full shadow-2xl shadow-red-500/25">
        <CardHeader className="bg-gradient-to-r from-red-900/50 to-black border-b border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-black" />
            </div>
            <CardTitle className="text-red-400 font-mono">{confirmDialogProps.title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-8">
          <p className="text-gray-300">{confirmDialogProps.message}</p>
        </CardContent>

        <CardFooter className="flex justify-end gap-4 p-6 pt-0">
          <Button
            variant="outline"
            onClick={closeConfirmDialog}
            className="border-gray-600 text-gray-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => confirmAction()}
            className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-400 hover:to-red-600"
          >
            {confirmDialogProps.confirmText || "Confirmar"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
