import type { Day } from './dates'

/** Sens d'étude : de la langue A vers la langue B, ou l'inverse. */
export type Direction = 'ab' | 'ba'

export const DIRECTIONS: readonly Direction[] = ['ab', 'ba']

export type Level = 1 | 2 | 3 | 4 | 5

/** Note donnée à une réponse (échelle FSRS). Une réponse fausse vaut `again`, une juste `good`. */
export type Grade = 'again' | 'hard' | 'good' | 'easy'

/** Progression d'un mot dans un sens (état FSRS). `null` = jamais révisé (« Nouveau »). */
export interface Progress {
  /** Stabilité en jours : délai au bout duquel la probabilité de rappel tombe à 90 %. */
  stability: number
  /** Difficulté de 1 (facile) à 10 (difficile). */
  difficulty: number
  reviewed: Day
  /** Dernière réponse fausse, pas encore réussie : à revoir le jour même. */
  relearning: boolean
}

export interface Word {
  id: number
  a: string
  b: string
  ab: Progress | null
  ba: Progress | null
}

/** Mot avant enregistrement (pas encore d'identifiant). */
export type NewWord = Omit<Word, 'id'>

export interface Languages {
  a: string
  b: string
}

/** Une question de révision : un mot posé dans un sens. */
export interface Card {
  wordId: number
  direction: Direction
}

/** Texte posé et réponse attendue d'une carte. */
export function prompt(word: Word, direction: Direction): string {
  return direction === 'ab' ? word.a : word.b
}

export function expected(word: Word, direction: Direction): string {
  return direction === 'ab' ? word.b : word.a
}

/** Libellé d'un sens, ex. « fr → en ». */
export function directionLabel(languages: Languages, direction: Direction): string {
  return direction === 'ab' ? `${languages.a} → ${languages.b}` : `${languages.b} → ${languages.a}`
}
