import type { Day } from './dates'
import { isDue } from './mastery'
import type { Direction, Level, Word } from './model'

export interface DirectionStats {
  fresh: number
  levels: Record<Level, number>
  /** Mots déjà révisés à revoir ce jour-là (les Nouveaux ne comptent pas). */
  due: number
}

/** Répartition des mots par niveau de maîtrise pour un sens. */
export function directionStats(words: readonly Word[], direction: Direction, day: Day): DirectionStats {
  const stats: DirectionStats = { fresh: 0, levels: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, due: 0 }
  for (const word of words) {
    const progress = word[direction]
    if (progress === null) {
      stats.fresh++
      continue
    }
    stats.levels[progress.level]++
    if (isDue(progress, day)) stats.due++
  }
  return stats
}
