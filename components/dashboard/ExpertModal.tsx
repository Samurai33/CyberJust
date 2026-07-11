"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Save, Users, Mail, Phone, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/contexts/DashboardContext"
import { expertSchema, type ExpertFormValues, type ProjectExpert } from "@/types/project"

const emptyExpertValues: ExpertFormValues = {
  name: "",
  role: "",
  organization: "",
  bio: "",
  avatar: "",
  contact: {
    email: "",
    phone: "",
    linkedin: "",
  },
}

function expertToFormValues(expert: ProjectExpert): ExpertFormValues {
  return {
    name: expert.name || "",
    role: expert.role || "",
    organization: expert.organization || "",
    bio: expert.bio || "",
    avatar: expert.avatar || "",
    contact: {
      email: expert.contact?.email || "",
      phone: expert.contact?.phone || "",
      linkedin: expert.contact?.linkedin || "",
    },
  }
}

export function ExpertModal() {
  const { showExpertModal, selectedExpert, isEditingExpert, createExpert, updateExpert, closeExpertModal } =
    useDashboard()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpertFormValues>({
    resolver: zodResolver(expertSchema),
    defaultValues: emptyExpertValues,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset the form whenever the modal opens or the selected expert changes,
  // instead of syncing local state via an effect on every render.
  useEffect(() => {
    if (!showExpertModal) return

    reset(selectedExpert && isEditingExpert ? expertToFormValues(selectedExpert) : emptyExpertValues)
  }, [showExpertModal, selectedExpert, isEditingExpert, reset])

  const onSubmit = useCallback(
    async (values: ExpertFormValues) => {
      setIsSubmitting(true)

      try {
        const payload: Omit<ProjectExpert, "id"> = {
          ...values,
          organization: values.organization ?? "",
        }

        if (isEditingExpert && selectedExpert) {
          await updateExpert(selectedExpert.id, payload)
        } else {
          await createExpert(payload)
        }
      } catch (error) {
        console.error("Erro ao salvar agente:", error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [isEditingExpert, selectedExpert, updateExpert, createExpert],
  )

  const handleClose = useCallback(() => {
    reset(emptyExpertValues)
    closeExpertModal()
  }, [reset, closeExpertModal])

  if (!showExpertModal) return null

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-black border-2 border-cyan-500/50 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/25">
        <CardHeader className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Users className="w-5 h-5 text-black" />
              </div>
              <CardTitle className="text-cyan-400 font-mono">
                {isEditingExpert ? "EDITAR AGENTE" : "NOVO AGENTE"}
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
                    NOME: <span className="text-red-400">*</span>
                  </label>
                  <Input
                    {...register("name")}
                    placeholder="Nome do agente..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${errors.name ? "border-red-500" : ""}`}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1 font-mono">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    CARGO: <span className="text-red-400">*</span>
                  </label>
                  <Input
                    {...register("role")}
                    placeholder="Cargo do agente..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${errors.role ? "border-red-500" : ""}`}
                    disabled={isSubmitting}
                  />
                  {errors.role && <p className="text-red-400 text-xs mt-1 font-mono">{errors.role.message}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">ORGANIZAÇÃO:</label>
                  <Input
                    {...register("organization")}
                    placeholder="Organização do agente..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.organization ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.organization && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.organization.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">AVATAR URL:</label>
                  <Input
                    {...register("avatar")}
                    placeholder="URL da imagem do agente..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.avatar ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.avatar && <p className="text-red-400 text-xs mt-1 font-mono">{errors.avatar.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">EMAIL:</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="email"
                      {...register("contact.email")}
                      placeholder="Email do agente..."
                      className={`bg-gray-900 border-cyan-500/30 text-white pl-10 ${
                        errors.contact?.email ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.contact?.email && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.contact.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">TELEFONE:</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      {...register("contact.phone")}
                      placeholder="Telefone do agente..."
                      className={`bg-gray-900 border-cyan-500/30 text-white pl-10 ${
                        errors.contact?.phone ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.contact?.phone && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.contact.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">LINKEDIN:</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      {...register("contact.linkedin")}
                      placeholder="LinkedIn do agente..."
                      className={`bg-gray-900 border-cyan-500/30 text-white pl-10 ${
                        errors.contact?.linkedin ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.contact?.linkedin && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.contact.linkedin.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                BIOGRAFIA: <span className="text-red-400">*</span>
              </label>
              <Textarea
                {...register("bio")}
                placeholder="Biografia do agente..."
                className={`bg-gray-900 border-cyan-500/30 text-white min-h-[120px] ${
                  errors.bio ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.bio && <p className="text-red-400 text-xs mt-1 font-mono">{errors.bio.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "SALVANDO..." : isEditingExpert ? "ATUALIZAR AGENTE" : "CRIAR AGENTE"}
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
