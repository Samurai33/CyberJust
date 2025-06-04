"use client"

import { useState, useCallback, useMemo } from "react"

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

export function useFormValidation<T extends Record<string, any>>(initialData: T, rules: ValidationRules = {}) {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Memoize the validation function to prevent recreation on every render
  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const rule = rules[name]
      if (!rule) return null

      if (rule.required && (!value || (typeof value === "string" && value.trim() === ""))) {
        return "Este campo é obrigatório"
      }

      if (typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          return `Mínimo de ${rule.minLength} caracteres`
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return `Máximo de ${rule.maxLength} caracteres`
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          return "Formato inválido"
        }
      }

      if (rule.custom) {
        return rule.custom(value)
      }

      return null
    },
    [rules],
  )

  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.keys(rules).forEach((field) => {
      const fieldValue = field.includes(".") ? field.split(".").reduce((obj, key) => obj?.[key], data) : data[field]

      const error = validateField(field, fieldValue)
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [data, rules, validateField])

  const updateField = useCallback(
    (name: string, value: any) => {
      setData((prev) => {
        if (name.includes(".")) {
          const keys = name.split(".")
          const newData = { ...prev }
          let current = newData

          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] }
            current = current[keys[i]]
          }

          current[keys[keys.length - 1]] = value
          return newData
        } else {
          return { ...prev, [name]: value }
        }
      })

      setTouched((prev) => ({ ...prev, [name]: true }))

      // Validate field on change
      const error = validateField(name, value)
      setErrors((prev) => ({
        ...prev,
        [name]: error || "",
      }))
    },
    [validateField],
  )

  const resetForm = useCallback(
    (newData?: Partial<T>) => {
      const resetData = newData ? { ...initialData, ...newData } : initialData
      setData(resetData)
      setErrors({})
      setTouched({})
    },
    [initialData],
  )

  const setFormData = useCallback((newData: T) => {
    setData(newData)
    setErrors({})
    setTouched({})
  }, [])

  // Memoize the validation state to prevent unnecessary recalculations
  const isValid = useMemo(() => {
    return Object.values(errors).every((error) => !error)
  }, [errors])

  return {
    data,
    errors,
    touched,
    updateField,
    validateAll,
    resetForm,
    setFormData,
    isValid,
  }
}
