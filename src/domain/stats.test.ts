import { describe, expect, it } from 'vitest'
import type { Word } from './model'
import { directionStats } from './stats'

const words: Word[] = [
  { id: 1, a: 'maison', b: 'house', ab: { level: 3, reviewed: '2026-10-20' }, ba: null },
  { id: 2, a: 'chien', b: 'dog', ab: { level: 3, reviewed: '2026-10-28' }, ba: { level: 1, reviewed: '2026-10-29' } },
  { id: 3, a: 'chat', b: 'cat', ab: null, ba: { level: 5, reviewed: '2026-10-29' } },
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
