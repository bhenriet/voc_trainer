import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card as FsrsCard } from 'ts-fsrs'
import { addDays, daysBetween, type Day } from './dates'
import type { Grade, Level, Progress } from './model'

/** Probabilité de rappel visée au moment de la révision. */
export const RETENTION = 0.9

/** Difficulté attribuée à un ancien niveau Leitner converti (milieu de l'échelle). */
const LEGACY_DIFFICULTY = 5

/** Stabilité (jours) attribuée à un ancien niveau 1 à 5 : le bas de la tranche de ce niveau. */
const LEGACY_STABILITY: Record<Level, number> = { 1: 1, 2: 3, 3: 7, 4: 21, 5: 60 }

/** Seuils de stabilité (jours) au-dessus desquels on passe au niveau 2, 3, 4 puis 5. */
const LEVEL_THRESHOLDS = [2, 7, 21, 60] as const

export const NEW_LABEL = 'Nouveau'

export const LEVEL_LABELS: Record<Level, string> = {
  1: 'En apprentissage',
  2: 'Familier',
  3: 'Bien connu',
  4: 'Très bien connu',
  5: 'Maîtrisé',
}

// Sans étapes d'apprentissage courtes (on raisonne en jours) et sans fuzz (résultats déterministes).
const scheduler = fsrs(generatorParameters({ enable_short_term: false, enable_fuzz: false, request_retention: RETENTION }))

const RATINGS = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy } as const

/** Instant représentant un jour calendaire (midi UTC : les écarts de jours restent exacts quel que soit le fuseau). */
const at = (day: Day) => new Date(`${day}T12:00:00Z`)

function toFsrsCard(progress: Progress, day: Day): FsrsCard {
  return {
    ...createEmptyCard(at(progress.reviewed)),
    stability: progress.stability,
    difficulty: progress.difficulty,
    state: State.Review,
    last_review: at(progress.reviewed),
    elapsed_days: Math.max(0, daysBetween(progress.reviewed, day)),
  }
}

/** Niveau de maîtrise affiché, déduit de la stabilité. */
export function levelOf(stability: number): Level {
  return (1 + LEVEL_THRESHOLDS.filter((threshold) => stability >= threshold).length) as Level
}

export function masteryLabel(progress: Progress | null): string {
  return progress ? LEVEL_LABELS[levelOf(progress.stability)] : NEW_LABEL
}

/** Nouvelle progression après une réponse. Pure : repart toujours de l'état précédent fourni. */
export function applyAnswer(progress: Progress | null, grade: Grade, day: Day): Progress {
  const card = progress ? toFsrsCard(progress, day) : createEmptyCard(at(day))
  const next = scheduler.next(card, at(day), RATINGS[grade]).card
  return { stability: next.stability, difficulty: next.difficulty, reviewed: day, relearning: grade === 'again' }
}

/** Retire la marque « à retravailler » (réessai réussi le jour même), sans toucher à l'état FSRS. */
export function clearRelearning(progress: Progress): Progress {
  return { ...progress, relearning: false }
}

/** Progression équivalente à un ancien niveau Leitner (import d'anciens CSV, migration de la base). */
export function fromLegacyLevel(level: Level, reviewed: Day): Progress {
  return { stability: LEGACY_STABILITY[level], difficulty: LEGACY_DIFFICULTY, reviewed, relearning: false }
}

/** Jour à partir duquel le mot est à revoir : le jour même s'il est à retravailler, sinon après un intervalle FSRS d'au moins 1 jour. */
export function dueDay(progress: Progress): Day {
  if (progress.relearning) return progress.reviewed
  return addDays(progress.reviewed, Math.max(1, Math.round(progress.stability)))
}

/** Vrai si un mot déjà révisé est à revoir ce jour-là. Un mot Nouveau n'est pas « à revoir ». */
export function isDue(progress: Progress | null, day: Day): boolean {
  return progress !== null && daysBetween(dueDay(progress), day) >= 0
}

/** Probabilité estimée de se rappeler le mot ce jour-là (0 pour un mot à retravailler : le plus urgent). */
export function retrievability(progress: Progress, day: Day): number {
  if (progress.relearning) return 0
  return scheduler.get_retrievability(toFsrsCard(progress, day), at(day), false)
}
