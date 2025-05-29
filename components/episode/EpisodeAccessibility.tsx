"use client"

import { useState } from "react"
import { Accessibility, Type, Volume2, Eye, Keyboard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export function EpisodeAccessibility() {
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    fontSize: [16],
    keyboardNavigation: true,
  })

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))

    // Apply settings to document
    const root = document.documentElement

    switch (key) {
      case "highContrast":
        root.classList.toggle("high-contrast", value)
        break
      case "largeText":
        root.classList.toggle("large-text", value)
        break
      case "reducedMotion":
        root.classList.toggle("reduced-motion", value)
        break
      case "fontSize":
        root.style.setProperty("--base-font-size", `${value[0]}px`)
        break
    }
  }

  return (
    <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white font-mono flex items-center gap-2">
          <Accessibility className="w-5 h-5" />
          ACESSIBILIDADE
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            <div>
              <label className="text-sm text-white">Alto Contraste</label>
              <p className="text-xs text-gray-400">Melhora a visibilidade do texto</p>
            </div>
          </div>
          <Switch checked={settings.highContrast} onCheckedChange={(value) => updateSetting("highContrast", value)} />
        </div>

        {/* Large Text */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-gray-400" />
            <div>
              <label className="text-sm text-white">Texto Grande</label>
              <p className="text-xs text-gray-400">Aumenta o tamanho do texto</p>
            </div>
          </div>
          <Switch checked={settings.largeText} onCheckedChange={(value) => updateSetting("largeText", value)} />
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-white">Tamanho da Fonte</label>
          </div>
          <Slider
            value={settings.fontSize}
            onValueChange={(value) => updateSetting("fontSize", value)}
            max={24}
            min={12}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>12px</span>
            <span>{settings.fontSize[0]}px</span>
            <span>24px</span>
          </div>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <div>
              <label className="text-sm text-white">Reduzir Movimento</label>
              <p className="text-xs text-gray-400">Diminui animações e efeitos</p>
            </div>
          </div>
          <Switch checked={settings.reducedMotion} onCheckedChange={(value) => updateSetting("reducedMotion", value)} />
        </div>

        {/* Keyboard Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-gray-400" />
            <div>
              <label className="text-sm text-white">Navegação por Teclado</label>
              <p className="text-xs text-gray-400">Atalhos de teclado habilitados</p>
            </div>
          </div>
          <Switch
            checked={settings.keyboardNavigation}
            onCheckedChange={(value) => updateSetting("keyboardNavigation", value)}
          />
        </div>

        {/* Keyboard Shortcuts Help */}
        {settings.keyboardNavigation && (
          <div className="border border-gray-700 rounded-lg p-3 bg-gray-900/30">
            <h4 className="text-sm text-white font-mono mb-2">ATALHOS DE TECLADO</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Espaço</span>
                <span>Play/Pause</span>
              </div>
              <div className="flex justify-between">
                <span>← →</span>
                <span>Retroceder/Avançar 15s</span>
              </div>
              <div className="flex justify-between">
                <span>↑ ↓</span>
                <span>Volume +/-</span>
              </div>
              <div className="flex justify-between">
                <span>M</span>
                <span>Mudo</span>
              </div>
              <div className="flex justify-between">
                <span>F</span>
                <span>Tela cheia</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
