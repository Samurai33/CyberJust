"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Save, Plus, Tag, FileText, Clock, AlertTriangle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "@/contexts/DashboardContext"
import { PROJECT_CATEGORIES } from "@/lib/projectUtils"
import { projectSchema, type ProjectFormData, type ProjectFormValues, type Project } from "@/types/project"
import type { EpisodeStatus, ThreatLevel } from "@/types"
import { StatusSelect, ThreatSelect, CategorySelect } from "./DashboardSelect"

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
function ChipListField({
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
        <Button type="button" onClick={onAdd} size="sm" variant="outline" disabled={disabled || !inputValue.trim()}>
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
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 p-1 h-auto"
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

const emptyProjectValues: ProjectFormValues = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  fullDescription: "",
  status: "ATIVO",
  threat: "MÉDIO",
  audioUrl: "",
  duration: "",
  category: "",
  tags: [],
  keyPoints: [],
  warnings: [],
}

function projectToFormValues(project: Project): ProjectFormValues {
  return {
    title: project.title || "",
    date: project.date || new Date().toISOString().split("T")[0],
    description: project.description || "",
    fullDescription: project.fullDescription || "",
    status: project.status || "ATIVO",
    threat: project.threat || "MÉDIO",
    audioUrl: project.audioUrl || "",
    duration: project.duration || "",
    category: project.category || "",
    tags: project.tags || [],
    keyPoints: project.keyPoints || [],
    warnings: project.warnings || [],
  }
}

export function ProjectModal() {
  const { showProjectModal, selectedProject, isEditing, createProject, updateProject, closeProjectModal } =
    useDashboard()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: emptyProjectValues,
  })

  const [tagInput, setTagInput] = useState("")
  const [keyPointInput, setKeyPointInput] = useState("")
  const [warningInput, setWarningInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tags = watch("tags") ?? []
  const keyPoints = watch("keyPoints") ?? []
  const warnings = watch("warnings") ?? []

  // Reset the form whenever the modal opens or the selected project changes,
  // instead of syncing local state via an effect on every render.
  useEffect(() => {
    if (!showProjectModal) return

    reset(selectedProject && isEditing ? projectToFormValues(selectedProject) : emptyProjectValues)

    setTagInput("")
    setKeyPointInput("")
    setWarningInput("")
  }, [showProjectModal, selectedProject, isEditing, reset])

  const onSubmit = useCallback(
    async (values: ProjectFormValues) => {
      setIsSubmitting(true)

      try {
        const payload: ProjectFormData = {
          ...values,
          audioUrl: values.audioUrl ? values.audioUrl : null,
        }

        if (isEditing && selectedProject) {
          await updateProject(selectedProject.id, payload)
        } else {
          await createProject(payload)
        }
      } catch (error) {
        console.error("Erro ao salvar episódio:", error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [isEditing, selectedProject, updateProject, createProject],
  )

  const addToList = useCallback(
    (field: "tags" | "keyPoints" | "warnings", value: string, clearInput: () => void) => {
      const trimmed = value.trim()
      const current = getValues(field) ?? []
      if (trimmed && !current.includes(trimmed)) {
        setValue(field, [...current, trimmed], { shouldDirty: true, shouldValidate: true })
        clearInput()
      }
    },
    [getValues, setValue],
  )

  const removeFromList = useCallback(
    (field: "tags" | "keyPoints" | "warnings", value: string) => {
      const current = getValues(field) ?? []
      setValue(
        field,
        current.filter((item) => item !== value),
        { shouldDirty: true, shouldValidate: true },
      )
    },
    [getValues, setValue],
  )

  const handleClose = useCallback(() => {
    reset(emptyProjectValues)
    setTagInput("")
    setKeyPointInput("")
    setWarningInput("")
    closeProjectModal()
  }, [reset, closeProjectModal])

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    TÍTULO DO EPISÓDIO: <span className="text-red-400">*</span>
                  </label>
                  <Input
                    {...register("title")}
                    placeholder="Nome do episódio..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${errors.title ? "border-red-500" : ""}`}
                    disabled={isSubmitting}
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1 font-mono">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    DATA: <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="date"
                      {...register("date")}
                      className={`bg-gray-900 border-cyan-500/30 text-white pl-10 ${
                        errors.date ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.date && <p className="text-red-400 text-xs mt-1 font-mono">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    CATEGORIA: <span className="text-red-400">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <CategorySelect
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                        error={!!errors.category}
                        categories={PROJECT_CATEGORIES}
                      />
                    )}
                  />
                  {errors.category && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    STATUS: <span className="text-red-400">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <StatusSelect
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as EpisodeStatus)}
                        disabled={isSubmitting}
                        error={!!errors.status}
                      />
                    )}
                  />
                  {errors.status && <p className="text-red-400 text-xs mt-1 font-mono">{errors.status.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    NÍVEL DE AMEAÇA: <span className="text-red-400">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="threat"
                    render={({ field }) => (
                      <ThreatSelect
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ThreatLevel)}
                        disabled={isSubmitting}
                        error={!!errors.threat}
                      />
                    )}
                  />
                  {errors.threat && <p className="text-red-400 text-xs mt-1 font-mono">{errors.threat.message}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">DURAÇÃO:</label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <Input
                      {...register("duration")}
                      placeholder="Ex: 45:30"
                      className={`bg-gray-900 border-cyan-500/30 text-white ${
                        errors.duration ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.duration && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.duration.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">URL DO ÁUDIO:</label>
                  <Input
                    {...register("audioUrl")}
                    placeholder="URL do arquivo de áudio..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.audioUrl ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.audioUrl && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.audioUrl.message}</p>
                  )}
                </div>

                <ChipListField
                  label="TAGS:"
                  items={tags}
                  inputValue={tagInput}
                  onInputChange={setTagInput}
                  onAdd={() => addToList("tags", tagInput, () => setTagInput(""))}
                  onRemove={(tag) => removeFromList("tags", tag)}
                  placeholder="Adicionar tag..."
                  disabled={isSubmitting}
                  addIcon={<Tag className="w-4 h-4" />}
                  variant="badge"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                DESCRIÇÃO CURTA: <span className="text-red-400">*</span>
              </label>
              <Textarea
                {...register("description")}
                placeholder="Descrição curta do episódio..."
                className={`bg-gray-900 border-cyan-500/30 text-white min-h-[80px] ${
                  errors.description ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1 font-mono">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">DESCRIÇÃO COMPLETA:</label>
              <Textarea
                {...register("fullDescription")}
                placeholder="Descrição detalhada do episódio..."
                className={`bg-gray-900 border-cyan-500/30 text-white min-h-[120px] ${
                  errors.fullDescription ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.fullDescription && (
                <p className="text-red-400 text-xs mt-1 font-mono">{errors.fullDescription.message}</p>
              )}
            </div>

            {/* Key Points */}
            <ChipListField
              label="PONTOS PRINCIPAIS:"
              items={keyPoints}
              inputValue={keyPointInput}
              onInputChange={setKeyPointInput}
              onAdd={() => addToList("keyPoints", keyPointInput, () => setKeyPointInput(""))}
              onRemove={(point) => removeFromList("keyPoints", point)}
              placeholder="Adicionar ponto principal..."
              disabled={isSubmitting}
              variant="list"
            />

            {/* Warnings */}
            <ChipListField
              label={
                <>
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  AVISOS:
                </>
              }
              items={warnings}
              inputValue={warningInput}
              onInputChange={setWarningInput}
              onAdd={() => addToList("warnings", warningInput, () => setWarningInput(""))}
              onRemove={(warning) => removeFromList("warnings", warning)}
              placeholder="Adicionar aviso..."
              disabled={isSubmitting}
              variant="warning-list"
            />

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                disabled={isSubmitting}
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
