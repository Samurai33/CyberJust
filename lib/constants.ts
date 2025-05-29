// Consolidação de constantes usadas em múltiplos lugares
export const AUDIO_FORMATS = ["mp3", "wav", "ogg"] as const

export const EPISODE_CATEGORIES = [
  "Proteção Infantil",
  "Crimes Digitais",
  "Segurança Corporativa",
  "Privacidade",
  "Investigação Digital",
  "Educação Digital",
] as const

export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: " ",
  SKIP_FORWARD: "ArrowRight",
  SKIP_BACKWARD: "ArrowLeft",
  VOLUME_UP: "ArrowUp",
  VOLUME_DOWN: "ArrowDown",
  MUTE: "m",
  FULLSCREEN: "f",
} as const

export const STORAGE_KEYS = {
  EPISODE_PROGRESS: "cyberjustica_episode_progress",
  EPISODE_NOTES: "cyberjustica_episode_notes",
  EPISODE_RATINGS: "cyberjustica_episode_ratings",
  AUDIO_SETTINGS: "cyberjustica_audio_settings",
  USER_PREFERENCES: "cyberjustica_user_preferences",
} as const

export const API_ENDPOINTS = {
  EPISODES: "/api/episodes",
  EPISODE_DETAIL: (id: string) => `/api/episodes/${id}`,
  EPISODE_PROGRESS: "/api/episodes/progress",
  EPISODE_RATINGS: "/api/episodes/ratings",
} as const

export const VALIDATION_RULES = {
  EPISODE_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
  EPISODE_DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 500,
  },
  RATING: {
    MIN: 1,
    MAX: 5,
  },
} as const
