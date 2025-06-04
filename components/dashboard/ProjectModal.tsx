"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { X, Save, Plus, Tag, FileText, Clock, AlertTriangle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFormValidation } from "@/hooks/useFormValidation"
import { PROJECT_CATEGORIES } from "@/lib/projectUtils"
import type { ProjectFormData } from "@/types/project"
import { StatusSelect, ThreatSelect, CategorySelect } from "./DashboardSelect"

// Memoize validation rules to prevent recreation
const validationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 200,
  },
  date: {
    required: true,
    custom: (value: string) => {
      if (!value) return "Data é obrigatória"
      const date = new Date(value)
      if (isNaN(date.getTime())) return "Data inválida"
      if (date > new Date()) return "Data não pode ser futura"
      return null
    },
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 500,
  },
  fullDescription: {
    maxLength: 2000,
  },
  status: {
    required: true,
  },
  threat: {
    required: true,
  },
  audioUrl: {
    custom: (value: string) => {
      if (!value) return null
      try {
        new URL(value)
        return null
      } catch {
        return "URL inválida"
      }
    },
  },
  duration: {
    custom: (value: string) => {
      if (!value) return null
      const timePattern = /^([0-9]{1,2}):([0-5][0-9])$/
      if (!timePattern.test(value)) {
        return "Formato deve ser MM:SS ou HH:MM"
      }
      return null
    },
  },
  category: {
    required: true,
  },
}

export function ProjectModal() {
  const { showProjectModal, selectedProject, isEditing, createProject, updateProject, closeProjectModal } =
    useDashboard()

  // Memoize initial form data to prevent recreation
  const initialFormData = useMemo(
    (): ProjectFormData => ({
      title: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      fullDescription: "",
      status: "ATIVO",
      threat: "MÉDIO",
      audioUrl: null,
      duration: "",
      category: "",
      tags: [],
      keyPoints: [],
      warnings: [],
    }),
    [],
  )

  const {
    data: formData,
    errors,
    touched,
    updateField,
    validateAll,
    resetForm,
    setFormData,
    isValid,
  } = useFormValidation(initialFormData, validationRules)

  const [tagInput, setTagInput] = useState("")
  const [keyPointInput, setKeyPointInput] = useState("")
  const [warningInput, setWarningInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Memoize project data to prevent unnecessary effect triggers
  const projectData = useMemo(() => {
    if (!selectedProject || !isEditing) return null

    return {
      title: selectedProject.title || "",
      date: selectedProject.date || new Date().toISOString().split("T")[0],
      description: selectedProject.description || "",
      fullDescription: selectedProject.fullDescription || "",
      status: selectedProject.status || "ATIVO",
      threat: selectedProject.threat || "MÉDIO",
      audioUrl: selectedProject.audioUrl || null,
      duration: selectedProject.duration || "",
      category: selectedProject.category || "",
      tags: selectedProject.tags || [],
      keyPoints: selectedProject.keyPoints || [],
      warnings: selectedProject.warnings || [],
    }
  }, [selectedProject, isEditing])

  // Reset form when modal opens/closes or when editing different project
  useEffect(() => {
    if (!showProjectModal) return

    if (projectData) {
      setFormData(projectData)
    } else {
      resetForm()
    }

    // Reset input fields
    setTagInput("")
    setKeyPointInput("")
    setWarningInput("")
  }, [showProjectModal, projectData, resetForm, setFormData])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateAll()) {
        return
      }

      setIsSubmitting(true)

      try {
        if (isEditing && selectedProject) {
          await updateProject(selectedProject.id, formData)
        } else {
          await createProject(formData)
        }
      } catch (error) {
        console.error("Erro ao salvar episódio:", error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [validateAll, isEditing, selectedProject, updateProject, createProject, formData],
  )

  const addTag = useCallback(() => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      updateField("tags", [...formData.tags, trimmedTag])
      setTagInput("")
    }
  }, [tagInput, formData.tags, updateField])

  const removeTag = useCallback(
    (tagToRemove: string) => {
      updateField(
        "tags",
        formData.tags.filter((tag) => tag !== tagToRemove),
      )
    },
    [formData.tags, updateField],
  )

  const addKeyPoint = useCallback(() => {
    const trimmedPoint = keyPointInput.trim()
    if (trimmedPoint && !formData.keyPoints?.includes(trimmedPoint)) {
      updateField("keyPoints", [...(formData.keyPoints || []), trimmedPoint])
      setKeyPointInput("")
    }
  }, [keyPointInput, formData.keyPoints, updateField])

  const removeKeyPoint = useCallback(
    (pointToRemove: string) => {
      updateField("keyPoints", formData.keyPoints?.filter((point) => point !== pointToRemove) || [])
    },
    [formData.keyPoints, updateField],
  )

  const addWarning = useCallback(() => {
    const trimmedWarning = warningInput.trim()
    if (trimmedWarning && !formData.warnings?.includes(trimmedWarning)) {
      updateField("warnings", [...(formData.warnings || []), trimmedWarning])
      setWarningInput("")
    }
  }, [warningInput, formData.warnings, updateField])

  const removeWarning = useCallback(
    (warningToRemove: string) => {
      updateField("warnings", formData.warnings?.filter((warning) => warning !== warningToRemove) || [])
    },
    [formData.warnings, updateField],
  )

  const handleKeyPress = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault()
      action()
    }
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    setTagInput("")
    setKeyPointInput("")
    setWarningInput("")
    closeProjectModal()
  }, [resetForm, closeProjectModal])

  if (!showProjectModal) return null

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-black border-2 border-cyan-500/50 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/25">
        <CardHeader className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                {isEditing ? <FileText className="w-5 h-5 text-black" /> : <Plus className="w-5 h-5 text-black" />}
              </div>
              <CardTitle className="text-cyan-400 font-mono">
                {isEditing ? "EDITAR EPISÓDIO" : "NOVO EPISÓDIO"}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-red-500/20"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    TÍTULO DO EPISÓDIO: <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Nome do episódio..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.title && touched.title ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.title && touched.title && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    DATA: <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateField("date", e.target.value)}
                      className={`bg-gray-900 border-cyan-500/30 text-white pl-10 ${
                        errors.date && touched.date ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.date && touched.date && <p className="text-red-400 text-xs mt-1 font-mono">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    CATEGORIA: <span className="text-red-400">*</span>
                  </label>
                  <CategorySelect
                    value={formData.category}
                    onValueChange={(value) => updateField("category", value)}
                    disabled={isSubmitting}
                    error={!!(errors.category && touched.category)}
                    categories={PROJECT_CATEGORIES}
                  />
                  {errors.category && touched.category && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    STATUS: <span className="text-red-400">*</span>
                  </label>
                  <StatusSelect
                    value={formData.status}
                    onValueChange={(value: any) => updateField("status", value)}
                    disabled={isSubmitting}
                    error={!!(errors.status && touched.status)}
                  />
                  {errors.status && touched.status && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.status}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    NÍVEL DE AMEAÇA: <span className="text-red-400">*</span>
                  </label>
                  <ThreatSelect
                    value={formData.threat}
                    onValueChange={(value: any) => updateField("threat", value)}
                    disabled={isSubmitting}
                    error={!!(errors.threat && touched.threat)}
                  />
                  {errors.threat && touched.threat && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.threat}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">DURAÇÃO:</label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <Input
                      value={formData.duration}
                      onChange={(e) => updateField("duration", e.target.value)}
                      placeholder="Ex: 45:30"
                      className={`bg-gray-900 border-cyan-500/30 text-white ${
                        errors.duration && touched.duration ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.duration && touched.duration && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.duration}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">URL DO ÁUDIO:</label>
                  <Input
                    value={formData.audioUrl || ""}
                    onChange={(e) => updateField("audioUrl", e.target.value || null)}
                    placeholder="URL do arquivo de áudio..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.audioUrl && touched.audioUrl ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.audioUrl && touched.audioUrl && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.audioUrl}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">TAGS:</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, addTag)}
                      placeholder="Adicionar tag..."
                      className="bg-gray-900 border-cyan-500/30 text-white flex-1"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      size="sm"
                      variant="outline"
                      disabled={isSubmitting || !tagInput.trim()}
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-cyan-500/50 text-cyan-400 cursor-pointer hover:bg-red-500/20"
                        onClick={() => !isSubmitting && removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                DESCRIÇÃO CURTA: <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Descrição curta do episódio..."
                className={`bg-gray-900 border-cyan-500/30 text-white min-h-[80px] ${
                  errors.description && touched.description ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.description && touched.description && (
                <p className="text-red-400 text-xs mt-1 font-mono">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">DESCRIÇÃO COMPLETA:</label>
              <Textarea
                value={formData.fullDescription}
                onChange={(e) => updateField("fullDescription", e.target.value)}
                placeholder="Descrição detalhada do episódio..."
                className={`bg-gray-900 border-cyan-500/30 text-white min-h-[120px] ${
                  errors.fullDescription && touched.fullDescription ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.fullDescription && touched.fullDescription && (
                <p className="text-red-400 text-xs mt-1 font-mono">{errors.fullDescription}</p>
              )}
            </div>

            {/* Key Points */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">PONTOS PRINCIPAIS:</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={keyPointInput}
                  onChange={(e) => setKeyPointInput(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addKeyPoint)}
                  placeholder="Adicionar ponto principal..."
                  className="bg-gray-900 border-cyan-500/30 text-white flex-1"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={addKeyPoint}
                  size="sm"
                  variant="outline"
                  disabled={isSubmitting || !keyPointInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {formData.keyPoints?.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                    <span className="text-cyan-400">▶</span>
                    <span className="text-gray-300 text-sm flex-1">{point}</span>
                    <Button
                      type="button"
                      onClick={() => removeKeyPoint(point)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 p-1 h-auto"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                AVISOS:
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={warningInput}
                  onChange={(e) => setWarningInput(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addWarning)}
                  placeholder="Adicionar aviso..."
                  className="bg-gray-900 border-cyan-500/30 text-white flex-1"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={addWarning}
                  size="sm"
                  variant="outline"
                  disabled={isSubmitting || !warningInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {formData.warnings?.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 p-2 rounded"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-sm flex-1">{warning}</span>
                    <Button
                      type="button"
                      onClick={() => removeWarning(warning)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 p-1 h-auto"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                disabled={isSubmitting || !isValid}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "SALVANDO..." : isEditing ? "ATUALIZAR EPISÓDIO" : "CRIAR EPISÓDIO"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-gray-600 text-gray-400 hover:text-white"
                disabled={isSubmitting}
              >
                CANCELAR
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
