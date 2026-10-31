import { describe, expect, it } from 'vitest'
import type { Progress } from './model'
import {
  applyAnswer,
  clearRelearning,
  dueDay,
  fromLegacyLevel,
  isDue,
  levelOf,
  masteryLabel,
  retrievability,
} from './mastery'

const TODAY = '2026-10-29'

const progress = (stability: number, reviewed: string, relearning = false): Progress => ({
  stability,
  difficulty: 5,
  reviewed,
  relearning,
})

describe('applyAnswer', () => {
  it('réponse juste à un mot déjà révisé : la stabilité augmente, date du jour, pas à retravailler', () => {
    const before = progress(10, '2026-10-19')
    const after = applyAnswer(before, 'good', TODAY)
    expect(after.stability).toBeGreaterThan(before.stability)
    expect(after.reviewed).toBe(TODAY)
    expect(after.relearning).toBe(false)
  })

  it('réponse fausse à un mot déjà révisé : stabilité en baisse, difficulté en hausse, à retravailler', () => {
    const before = progress(10, '2026-10-19')
    const after = applyAnswer(before, 'again', TODAY)
    expect(after.stability).toBeLessThan(before.stability)
    expect(after.difficulty).toBeGreaterThan(before.difficulty)
    expect(after.reviewed).toBe(TODAY)
    expect(after.relearning).toBe(true)
  })

  it('réponse juste à un mot nouveau : état initial, date du jour', () => {
    const after = applyAnswer(null, 'good', TODAY)
    expect(after.stability).toBeGreaterThan(0)
    expect(after.difficulty).toBeGreaterThanOrEqual(1)
    expect(after.difficulty).toBeLessThanOrEqual(10)
    expect(after.reviewed).toBe(TODAY)
    expect(after.relearning).toBe(false)
  })

  it('réponse fausse à un mot nouveau : stabilité plus faible que pour une réponse juste, à retravailler', () => {
    const wrong = applyAnswer(null, 'again', TODAY)
    const right = applyAnswer(null, 'good', TODAY)
    expect(wrong.stability).toBeLessThan(right.stability)
    expect(wrong.relearning).toBe(true)
  })

  it('Hard et Easy encadrent Good', () => {
    const before = progress(10, '2026-10-19')
    const hard = applyAnswer(before, 'hard', TODAY).stability
    const good = applyAnswer(before, 'good', TODAY).stability
    const easy = applyAnswer(before, 'easy', TODAY).stability
    expect(hard).toBeLessThan(good)
    expect(good).toBeLessThan(easy)
  })

  it('réponse juste à un mot à retravailler : retire la marque', () => {
    const after = applyAnswer(progress(1, TODAY, true), 'good', TODAY)
    expect(after.relearning).toBe(false)
  })

  it('« j’avais juste » : repart de l’état antérieur, pas d’un cumul', () => {
    const before = progress(10, '2026-10-19')
    expect(applyAnswer(before, 'good', TODAY)).toEqual(applyAnswer(before, 'good', TODAY))
    const direct = applyAnswer(before, 'good', TODAY)
    applyAnswer(before, 'again', TODAY)
    expect(applyAnswer(before, 'good', TODAY)).toEqual(direct)
  })

  it('ne modifie pas la progression fournie', () => {
    const before = progress(10, '2026-10-19')
    applyAnswer(before, 'again', TODAY)
    expect(before).toEqual(progress(10, '2026-10-19'))
  })
})

describe('clearRelearning', () => {
  it('retire la marque sans toucher à stabilité, difficulté ni date', () => {
    const failed = progress(1.2, TODAY, true)
    expect(clearRelearning(failed)).toEqual({ ...failed, relearning: false })
  })
})

describe('échéance', () => {
  it('mot réussi aujourd’hui : pas à revoir aujourd’hui', () => {
    expect(isDue(applyAnswer(null, 'good', TODAY), TODAY)).toBe(false)
    expect(isDue(progress(0.3, TODAY), TODAY)).toBe(false)
  })

  it('mot raté aujourd’hui : à revoir aujourd’hui', () => {
    expect(isDue(applyAnswer(null, 'again', TODAY), TODAY)).toBe(true)
    expect(isDue(applyAnswer(progress(10, '2026-10-19'), 'again', TODAY), TODAY)).toBe(true)
  })

  it('mot raté un jour précédent et jamais réussi depuis : à revoir', () => {
    expect(isDue(progress(1, '2026-10-28', true), TODAY)).toBe(true)
  })

  it('intervalle = stabilité arrondie, au moins 1 jour', () => {
    expect(dueDay(progress(0.2, '2026-10-28'))).toBe('2026-10-29')
    expect(dueDay(progress(3.4, '2026-10-28'))).toBe('2026-10-31')
    expect(dueDay(progress(10, '2026-10-20'))).toBe('2026-10-30')
    expect(dueDay(progress(1, '2026-10-28', true))).toBe('2026-10-28')
  })

  it('stabilité 10 révisée le 20 : pas à revoir le 29, à revoir le 30', () => {
    expect(isDue(progress(10, '2026-10-20'), '2026-10-29')).toBe(false)
    expect(isDue(progress(10, '2026-10-20'), '2026-10-30')).toBe(true)
  })

  it('un mot nouveau n’est pas « à revoir »', () => {
    expect(isDue(null, TODAY)).toBe(false)
  })
})

describe('retrievability', () => {
  it('diminue avec le temps écoulé', () => {
    const p = progress(10, '2026-10-19')
    const late = retrievability(p, '2026-11-18')
    const soon = retrievability(p, '2026-10-24')
    expect(soon).toBeGreaterThan(late)
  })

  it('vaut 90 % quand le délai égale la stabilité', () => {
    expect(retrievability(progress(10, '2026-10-19'), '2026-10-29')).toBeCloseTo(0.9, 2)
  })

  it('un mot à retravailler est le plus urgent (0)', () => {
    expect(retrievability(progress(30, TODAY, true), TODAY)).toBe(0)
  })
})

describe('levelOf', () => {
  it('seuils de stabilité 2, 7, 21 et 60 jours', () => {
    expect(levelOf(0.2)).toBe(1)
    expect(levelOf(1.99)).toBe(1)
    expect(levelOf(2)).toBe(2)
    expect(levelOf(6.99)).toBe(2)
    expect(levelOf(7)).toBe(3)
    expect(levelOf(20.9)).toBe(3)
    expect(levelOf(21)).toBe(4)
    expect(levelOf(59.9)).toBe(4)
    expect(levelOf(60)).toBe(5)
    expect(levelOf(75)).toBe(5)
  })
})

describe('fromLegacyLevel', () => {
  it('conserve le niveau et la date de révision', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const converted = fromLegacyLevel(level, '2026-10-28')
      expect(levelOf(converted.stability)).toBe(level)
      expect(converted.reviewed).toBe('2026-10-28')
      expect(converted.relearning).toBe(false)
    }
  })
})

describe('masteryLabel', () => {
  it('donne le libellé de chaque état', () => {
    expect(masteryLabel(null)).toBe('Nouveau')
    expect(masteryLabel(progress(1, TODAY))).toBe('En apprentissage')
    expect(masteryLabel(progress(3, TODAY))).toBe('Familier')
    expect(masteryLabel(progress(10, TODAY))).toBe('Bien connu')
    expect(masteryLabel(progress(30, TODAY))).toBe('Très bien connu')
    expect(masteryLabel(progress(75, TODAY))).toBe('Maîtrisé')
  })

  it('ne parle jamais de « boîte »', () => {
    for (const stability of [1, 3, 10, 30, 75]) {
      expect(masteryLabel(progress(stability, TODAY)).toLowerCase()).not.toContain('boîte')
    }
  })
})

describe('ts-fsrs configuré (caractérisation)', () => {
  it('une deuxième révision le même jour reste finie et ne baisse pas la stabilité sur une réponse juste', () => {
    const first = applyAnswer(progress(10, TODAY), 'good', TODAY)
    expect(Number.isFinite(first.stability)).toBe(true)
    expect(first.stability).toBeGreaterThanOrEqual(10)
  })

  it('un mot nouveau réussi est à revoir au bout de quelques jours, pas le jour même', () => {
    const first = applyAnswer(null, 'good', TODAY)
    expect(dueDay(first)).not.toBe(TODAY)
  })
})
