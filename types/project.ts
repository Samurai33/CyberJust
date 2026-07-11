import { z } from "zod"
import type { EpisodeStatus, ThreatLevel } from "@/types"

export interface Project {
  id: string | number
  title: string
  date: string
  description: string
  fullDescription?: string
  status: EpisodeStatus
  threat: ThreatLevel
  audioUrl?: string | null
  duration?: string
  category?: string
  tags: string[]
  keyPoints?: string[]
  warnings?: string[]
  createdAt: string
  updatedAt: string
  transcript?: TranscriptSegment[]
  experts?: ProjectExpert[]
  timeline?: TimelineEvent[]
  resources?: ProjectResource[]
}

export interface TranscriptSegment {
  id: string
  timestamp: string
  speaker: string
  text: string
  type?: "narration" | "interview" | "expert" | "victim"
}

export interface ProjectExpert {
  id: string
  name: string
  role: string
  organization: string
  bio: string
  avatar?: string
  contact?: {
    email?: string
    phone?: string
    linkedin?: string
  }
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  completed: boolean
}

export interface ProjectResource {
  id: string
  title: string
  url: string
  type: "article" | "report" | "law" | "guide" | "video" | "document"
  description: string
  source: string
}

export interface ProjectFormData {
  title: string
  date: string
  description: string
  fullDescription?: string
  status: EpisodeStatus
  threat: ThreatLevel
  audioUrl?: string | null
  duration?: string
  category?: string
  tags: string[]
  keyPoints?: string[]
  warnings?: string[]
}

// --- Validation schemas (react-hook-form + zod) -----------------------------
// Mirrors the rules that previously lived in the hand-rolled
// hooks/useFormValidation.ts config objects in ProjectModal/ExpertModal.

const optionalUrlSchema = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) return true
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }, "URL inválida")

const dateNotFutureSchema = z
  .string()
  .min(1, "Data é obrigatória")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Data inválida")
  .refine((value) => new Date(value) <= new Date(), "Data não pode ser futura")

const durationSchema = z
  .string()
  .optional()
  .refine((value) => !value || /^([0-9]{1,2}):([0-5][0-9])$/.test(value), "Formato deve ser MM:SS ou HH:MM")

export const projectSchema = z.object({
  title: z.string().min(1, "Este campo é obrigatório").min(3, "Mínimo de 3 caracteres").max(200, "Máximo de 200 caracteres"),
  date: dateNotFutureSchema,
  description: z
    .string()
    .min(1, "Este campo é obrigatório")
    .min(10, "Mínimo de 10 caracteres")
    .max(500, "Máximo de 500 caracteres"),
  fullDescription: z.string().max(2000, "Máximo de 2000 caracteres").optional(),
  status: z.enum(["ATIVO", "ARQUIVADO", "RESOLVIDO", "AGENDADO"], {
    errorMap: () => ({ message: "Este campo é obrigatório" }),
  }),
  threat: z.enum(["CRÍTICO", "ALTO", "MÉDIO", "BAIXO"], {
    errorMap: () => ({ message: "Este campo é obrigatório" }),
  }),
  audioUrl: optionalUrlSchema,
  duration: durationSchema,
  category: z.string().min(1, "Este campo é obrigatório"),
  tags: z.array(z.string()),
  keyPoints: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>

export const expertSchema = z.object({
  name: z.string().min(1, "Este campo é obrigatório").min(2, "Mínimo de 2 caracteres").max(100, "Máximo de 100 caracteres"),
  role: z.string().min(1, "Este campo é obrigatório").min(2, "Mínimo de 2 caracteres").max(100, "Máximo de 100 caracteres"),
  organization: z.string().max(100, "Máximo de 100 caracteres").optional(),
  bio: z
    .string()
    .min(1, "Este campo é obrigatório")
    .min(10, "Mínimo de 10 caracteres")
    .max(1000, "Máximo de 1000 caracteres"),
  avatar: optionalUrlSchema,
  contact: z.object({
    email: z
      .string()
      .optional()
      .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Email inválido"),
    phone: z
      .string()
      .optional()
      .refine((value) => !value || /^[+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-()]/g, "")), "Telefone inválido"),
    linkedin: z
      .string()
      .optional()
      .refine(
        (value) => !value || /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(value),
        "URL do LinkedIn inválida",
      ),
  }),
})

export type ExpertFormValues = z.infer<typeof expertSchema>
