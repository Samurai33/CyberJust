"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { X, Save, Users, Mail, Phone, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/contexts/DashboardContext"
import { useFormValidation } from "@/hooks/useFormValidation"

// Memoize validation rules to prevent recreation
const expertValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  role: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  bio: {
    required: true,
    minLength: 10,
    maxLength: 1000,
  },
  organization: {
    maxLength: 100,
  },
  avatar: {
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
  "contact.email": {
    custom: (value: string) => {
      if (!value) return null
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value)) {
        return "Email inválido"
      }
      return null
    },
  },
  "contact.phone": {
    custom: (value: string) => {
      if (!value) return null
      const phonePattern = /^[+]?[1-9][\d]{0,15}$/
      if (!phonePattern.test(value.replace(/[\s\-()]/g, ""))) {
        return "Telefone inválido"
      }
      return null
    },
  },
  "contact.linkedin": {
    custom: (value: string) => {
      if (!value) return null
      const linkedinPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/
      if (!linkedinPattern.test(value)) {
        return "URL do LinkedIn inválida"
      }
      return null
    },
  },
}

export function ExpertModal() {
  const { showExpertModal, selectedExpert, isEditingExpert, createExpert, updateExpert, closeExpertModal } =
    useDashboard()

  // Memoize initial form data to prevent recreation
  const initialFormData = useMemo(
    () => ({
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
  } = useFormValidation(initialFormData, expertValidationRules)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Memoize expert data to prevent unnecessary effect triggers
  const expertData = useMemo(() => {
    if (!selectedExpert || !isEditingExpert) return null

    return {
      name: selectedExpert.name || "",
      role: selectedExpert.role || "",
      organization: selectedExpert.organization || "",
      bio: selectedExpert.bio || "",
      avatar: selectedExpert.avatar || "",
      contact: {
        email: selectedExpert.contact?.email || "",
        phone: selectedExpert.contact?.phone || "",
        linkedin: selectedExpert.contact?.linkedin || "",
      },
    }
  }, [selectedExpert, isEditingExpert])

  useEffect(() => {
    if (!showExpertModal) return

    if (expertData) {
      setFormData(expertData)
    } else {
      resetForm()
    }
  }, [showExpertModal, expertData, resetForm, setFormData])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateAll()) {
        return
      }

      setIsSubmitting(true)

      try {
        if (isEditingExpert && selectedExpert) {
          await updateExpert(selectedExpert.id, formData)
        } else {
          await createExpert(formData)
        }
      } catch (error) {
        console.error("Erro ao salvar agente:", error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [validateAll, isEditingExpert, selectedExpert, updateExpert, createExpert, formData],
  )

  const handleClose = useCallback(() => {
    resetForm()
    closeExpertModal()
  }, [resetForm, closeExpertModal])

  const updateContactField = useCallback(
    (field: string, value: string) => {
      updateField(`contact.${field}`, value)
    },
    [updateField],
  )

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    NOME: <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Nome do agente..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.name && touched.name ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.name && touched.name && <p className="text-red-400 text-xs mt-1 font-mono">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">
                    CARGO: <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={formData.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    placeholder="Cargo do agente..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.role && touched.role ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.role && touched.role && <p className="text-red-400 text-xs mt-1 font-mono">{errors.role}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">ORGANIZAÇÃO:</label>
                  <Input
                    value={formData.organization}
                    onChange={(e) => updateField("organization", e.target.value)}
                    placeholder="Organização do agente..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.organization && touched.organization ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.organization && touched.organization && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.organization}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">AVATAR URL:</label>
                  <Input
                    value={formData.avatar}
                    onChange={(e) => updateField("avatar", e.target.value)}
                    placeholder="URL da imagem do agente..."
                    className={`bg-gray-900 border-cyan-500/30 text-white ${
                      errors.avatar && touched.avatar ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.avatar && touched.avatar && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors.avatar}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">EMAIL:</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="email"
                      value={formData.contact?.email || ""}
                      onChange={(e) => updateContactField("email", e.target.value)}
                      placeholder="Email do agente..."
                      className={`bg-gray-900 border-cyan-500/30 text-white pl-10 ${
                        errors["contact.email"] && touched["contact.email"] ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors["contact.email"] && touched["contact.email"] && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors["contact.email"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">TELEFONE:</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={formData.contact?.phone || ""}
                      onChange={(e) => updateContactField("phone", e.target.value)}
                      placeholder="Telefone do agente..."
                      className={`bg-gray-900 border-cyan-500/30 text-white pl-10 ${
                        errors["contact.phone"] && touched["contact.phone"] ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors["contact.phone"] && touched["contact.phone"] && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors["contact.phone"]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-mono">LINKEDIN:</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={formData.contact?.linkedin || ""}
                      onChange={(e) => updateContactField("linkedin", e.target.value)}
                      placeholder="LinkedIn do agente..."
                      className={`bg-gray-900 border-cyan-500/30 text-white pl-10 ${
                        errors["contact.linkedin"] && touched["contact.linkedin"] ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors["contact.linkedin"] && touched["contact.linkedin"] && (
                    <p className="text-red-400 text-xs mt-1 font-mono">{errors["contact.linkedin"]}</p>
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
                value={formData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Biografia do agente..."
                className={`bg-gray-900 border-cyan-500/30 text-white min-h-[120px] ${
                  errors.bio && touched.bio ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.bio && touched.bio && <p className="text-red-400 text-xs mt-1 font-mono">{errors.bio}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                disabled={isSubmitting || !isValid}
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
