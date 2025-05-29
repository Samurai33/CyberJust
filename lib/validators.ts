import type { Episode, EpisodeRating } from "@/types/episode"
import { VALIDATION_RULES } from "./constants"

export function validateEpisode(episode: Partial<Episode>): string[] {
  const errors: string[] = []

  if (!episode.title || episode.title.length < VALIDATION_RULES.EPISODE_TITLE.MIN_LENGTH) {
    errors.push(`Título deve ter pelo menos ${VALIDATION_RULES.EPISODE_TITLE.MIN_LENGTH} caracteres`)
  }

  if (episode.title && episode.title.length > VALIDATION_RULES.EPISODE_TITLE.MAX_LENGTH) {
    errors.push(`Título deve ter no máximo ${VALIDATION_RULES.EPISODE_TITLE.MAX_LENGTH} caracteres`)
  }

  if (!episode.description || episode.description.length < VALIDATION_RULES.EPISODE_DESCRIPTION.MIN_LENGTH) {
    errors.push(`Descrição deve ter pelo menos ${VALIDATION_RULES.EPISODE_DESCRIPTION.MIN_LENGTH} caracteres`)
  }

  if (!episode.date || !isValidDate(episode.date)) {
    errors.push("Data inválida")
  }

  return errors
}

export function validateRating(rating: Partial<EpisodeRating>): string[] {
  const errors: string[] = []

  if (!rating.rating || rating.rating < VALIDATION_RULES.RATING.MIN || rating.rating > VALIDATION_RULES.RATING.MAX) {
    errors.push(`Avaliação deve estar entre ${VALIDATION_RULES.RATING.MIN} e ${VALIDATION_RULES.RATING.MAX}`)
  }

  if (!rating.episodeId) {
    errors.push("ID do episódio é obrigatório")
  }

  return errors
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
