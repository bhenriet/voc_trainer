import type { Direction } from '../domain/model'

/** Résultat d'une carte répondue pendant une session. */
export interface CardResult {
  wordId: number
  direction: Direction
  prompt: string
  expected: string
  input: string
  correct: boolean
  /** L'utilisateur a corrigé un faux négatif (« j'avais juste »). */
  overridden: boolean
}
