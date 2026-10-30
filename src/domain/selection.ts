import type { Day } from './dates'
import { dueDay, isDue, overdueDays } from './mastery'
import { DIRECTIONS, type Card, type Direction, type Word } from './model'

/** Sens choisi pour une session. */
export type StudyMode = Direction | 'mixed'

/** Source d'aléa dans [0, 1), injectée pour des tests déterministes. */
export type Random = () => number

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function directionsOf(mode: StudyMode): readonly Direction[] {
  return mode === 'mixed' ? DIRECTIONS : [mode]
}

/**
 * Choisit au plus `count` cartes : d'abord celles à revoir (les plus en retard en premier),
 * puis des Nouvelles. Les cartes pas encore échues sont exclues. En mode mélangé,
 * un mot n'apparaît que dans un seul sens. L'ordre renvoyé est aléatoire.
 */
export function selectCards(words: readonly Word[], count: number, mode: StudyMode, day: Day, random: Random): Card[] {
  const due: { card: Card; overdue: number }[] = []
  const fresh: Card[] = []

  for (const word of words) {
    for (const direction of directionsOf(mode)) {
      const progress = word[direction]
      const card = { wordId: word.id, direction }
      if (progress === null) fresh.push(card)
      else if (isDue(progress, day)) due.push({ card, overdue: overdueDays(progress, day) })
    }
  }

  // Mélange avant le tri (stable) : les égalités de retard sont départagées au hasard.
  const ordered = [
    ...shuffle(due, random)
      .sort((x, y) => y.overdue - x.overdue)
      .map((d) => d.card),
    ...shuffle(fresh, random),
  ]

  const picked: Card[] = []
  const usedWords = new Set<number>()
  for (const card of ordered) {
    if (picked.length >= count) break
    if (usedWords.has(card.wordId)) continue
    picked.push(card)
    usedWords.add(card.wordId)
  }
  return shuffle(picked, random)
}

/** Prochaine date à laquelle une carte deviendra à revoir dans le mode choisi, ou null. */
export function nextDueDay(words: readonly Word[], mode: StudyMode): Day | null {
  let next: Day | null = null
  for (const word of words) {
    for (const direction of directionsOf(mode)) {
      const progress = word[direction]
      if (progress === null) continue
      const due = dueDay(progress)
      if (next === null || due < next) next = due
    }
  }
  return next
}
