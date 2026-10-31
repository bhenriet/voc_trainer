import { describe, expect, it } from 'vitest'
import type { Progress, Word } from './model'
import { nextDueDay, selectCards } from './selection'

const TODAY = '2026-10-29'

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let nextId = 1
function word(ab: Progress | null, ba: Progress | null = null): Word {
  const id = nextId++
  return { id, a: `a${id}`, b: `b${id}`, ab, ba }
}

const progress = (stability: number, reviewed: string, relearning = false): Progress => ({
  stability,
  difficulty: 5,
  reviewed,
  relearning,
})

/** Stabilité 1 jour révisée il y a `days` + 2 jours : échue, et d'autant moins mémorisée que `days` est grand. */
const overdue = (days: number): Progress => progress(1, addDaysBack(days + 2))
const notYetDue: Progress = progress(60, TODAY)

function addDaysBack(days: number): string {
  const d = new Date(Date.UTC(2026, 9, 29 - days))
  return d.toISOString().slice(0, 10)
}

describe('selectCards', () => {
  it('priorité aux cartes à revoir puis complément en Nouvelles', () => {
    const due = Array.from({ length: 5 }, (_, i) => word(overdue(i)))
    const fresh = Array.from({ length: 30 }, () => word(null))
    const cards = selectCards([...fresh, ...due], 10, 'ab', TODAY, seeded(1))
    expect(cards).toHaveLength(10)
    const ids = new Set(cards.map((c) => c.wordId))
    for (const w of due) expect(ids.has(w.id)).toBe(true)
    expect(cards.filter((c) => fresh.some((w) => w.id === c.wordId))).toHaveLength(5)
  })

  it('plus de cartes à revoir que demandé : les moins mémorisées', () => {
    const words = Array.from({ length: 50 }, (_, i) => word(overdue(i)))
    const cards = selectCards(words, 10, 'ab', TODAY, seeded(2))
    const retards = cards.map((c) => words.findIndex((w) => w.id === c.wordId)).sort((x, y) => y - x)
    expect(retards).toEqual([49, 48, 47, 46, 45, 44, 43, 42, 41, 40])
  })

  it('pas assez de cartes : renvoie ce qui est disponible', () => {
    const words = [word(overdue(1)), word(null), word(null), word(notYetDue)]
    expect(selectCards(words, 10, 'ab', TODAY, seeded(3))).toHaveLength(3)
  })

  it('n’inclut jamais une carte pas encore échue', () => {
    const words = [word(notYetDue), word(progress(3, '2026-10-28'))]
    expect(selectCards(words, 10, 'ab', TODAY, seeded(4))).toEqual([])
  })

  it('respecte le sens demandé', () => {
    const words = [word(null, null), word(null, null)]
    expect(selectCards(words, 10, 'ba', TODAY, seeded(5)).every((c) => c.direction === 'ba')).toBe(true)
  })

  it('l’ordre de présentation est aléatoire', () => {
    const words = Array.from({ length: 20 }, () => word(null))
    const first = selectCards(words, 20, 'ab', TODAY, seeded(6)).map((c) => c.wordId)
    const second = selectCards(words, 20, 'ab', TODAY, seeded(7)).map((c) => c.wordId)
    expect(first).not.toEqual(second)
  })
})

describe('cartes à retravailler', () => {
  it('passent avant les cartes échues, même révisées aujourd’hui', () => {
    const failed = word(progress(1, TODAY, true))
    const words = [...Array.from({ length: 20 }, (_, i) => word(overdue(i))), failed]
    const cards = selectCards(words, 3, 'ab', TODAY, seeded(10))
    expect(cards.some((c) => c.wordId === failed.id)).toBe(true)
  })
})

describe('selectCards en mode mélangé', () => {
  it('un mot dû dans les deux sens n’est posé qu’une fois', () => {
    const maison = word(overdue(2), overdue(2))
    for (let seed = 0; seed < 20; seed++) {
      const cards = selectCards([maison], 10, 'mixed', TODAY, seeded(seed))
      expect(cards).toHaveLength(1)
    }
  })

  it('aucun mot en double et les deux sens représentés', () => {
    const words = Array.from({ length: 40 }, () => word(null, null))
    const cards = selectCards(words, 30, 'mixed', TODAY, seeded(8))
    expect(cards).toHaveLength(30)
    expect(new Set(cards.map((c) => c.wordId)).size).toBe(30)
    expect(cards.some((c) => c.direction === 'ab')).toBe(true)
    expect(cards.some((c) => c.direction === 'ba')).toBe(true)
  })

  it('privilégie le sens à revoir sur le sens Nouveau', () => {
    const w = word(null, overdue(3))
    const cards = selectCards([w], 1, 'mixed', TODAY, seeded(9))
    expect(cards).toEqual([{ wordId: w.id, direction: 'ba' }])
  })
})

describe('nextDueDay', () => {
  it('donne la prochaine échéance dans le sens choisi', () => {
    const words = [word(progress(60, TODAY), progress(3, TODAY)), word(progress(21, TODAY))]
    expect(nextDueDay(words, 'ab')).toBe('2026-11-19')
    expect(nextDueDay(words, 'ba')).toBe('2026-11-01')
    expect(nextDueDay(words, 'mixed')).toBe('2026-11-01')
  })

  it('null si aucun mot n’a encore été révisé', () => {
    expect(nextDueDay([word(null)], 'ab')).toBeNull()
  })
})
