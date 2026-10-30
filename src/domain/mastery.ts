import { addDays, daysBetween, type Day } from './dates'
import type { Level, Progress } from './model'

export const MAX_LEVEL: Level = 5

/** Jours d'attente avant de revoir un mot, selon son niveau. */
export const INTERVAL_DAYS: Record<Level, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 }

export const NEW_LABEL = 'Nouveau'

export const LEVEL_LABELS: Record<Level, string> = {
  1: 'En apprentissage',
  2: 'Familier',
  3: 'Bien connu',
  4: 'Très bien connu',
  5: 'Maîtrisé',
}

export function masteryLabel(progress: Progress | null): string {
  return progress ? LEVEL_LABELS[progress.level] : NEW_LABEL
}

/** Nouvelle progression après une réponse : +1 si juste (plafonné), retour à 1 si faux. */
export function applyAnswer(progress: Progress | null, correct: boolean, day: Day): Progress {
  if (!correct) return { level: 1, reviewed: day }
  const level = progress ? (Math.min(progress.level + 1, MAX_LEVEL) as Level) : 1
  return { level, reviewed: day }
}

/** Jour à partir duquel le mot est à revoir. */
export function dueDay(progress: Progress): Day {
  return addDays(progress.reviewed, INTERVAL_DAYS[progress.level])
}

/** Vrai si un mot déjà révisé est à revoir ce jour-là. Un mot Nouveau n'est pas « à revoir ». */
export function isDue(progress: Progress | null, day: Day): boolean {
  return progress !== null && daysBetween(dueDay(progress), day) >= 0
}

/** Retard en jours par rapport à l'échéance (0 le jour même, négatif si pas encore dû). */
export function overdueDays(progress: Progress, day: Day): number {
  return daysBetween(dueDay(progress), day)
}
