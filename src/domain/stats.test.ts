import { describe, expect, it } from 'vitest'
import type { Progress, Word } from './model'
import { directionStats } from './stats'

const progress = (stability: number, reviewed: string, relearning = false): Progress => ({
  stability,
  difficulty: 5,
  reviewed,
  relearning,
})

const words: Word[] = [
  { id: 1, a: 'maison', b: 'house', ab: progress(7, '2026-10-20'), ba: null },
  { id: 2, a: 'chien', b: 'dog', ab: progress(7, '2026-10-28'), ba: progress(1, '2026-10-29', true) },
  { id: 3, a: 'chat', b: 'cat', ab: null, ba: progress(75, '2026-10-29') },
]

describe('directionStats', () => {
  it('compte les mots par niveau et ceux à revoir, pour chaque sens', () => {
    expect(directionStats(words, 'ab', '2026-10-29')).toEqual({
      fresh: 1,
      levels: { 1: 0, 2: 0, 3: 2, 4: 0, 5: 0 },
      due: 1,
    })
    expect(directionStats(words, 'ba', '2026-10-29')).toEqual({
      fresh: 1,
      levels: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 1 },
      due: 1,
    })
  })
})
