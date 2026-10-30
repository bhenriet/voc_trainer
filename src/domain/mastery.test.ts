import { describe, expect, it } from 'vitest'
import { applyAnswer, dueDay, isDue, masteryLabel, overdueDays } from './mastery'

const TODAY = '2026-10-29'

describe('applyAnswer', () => {
  it('réponse juste : monte d’un niveau et date du jour', () => {
    expect(applyAnswer({ level: 2, reviewed: '2026-10-20' }, true, TODAY)).toEqual({ level: 3, reviewed: TODAY })
  })

  it('réponse juste au niveau maximal : reste à 5', () => {
    expect(applyAnswer({ level: 5, reviewed: '2026-10-01' }, true, TODAY)).toEqual({ level: 5, reviewed: TODAY })
  })

  it('réponse juste à un mot nouveau : passe au niveau 1', () => {
    expect(applyAnswer(null, true, TODAY)).toEqual({ level: 1, reviewed: TODAY })
  })

  it('réponse fausse : revient au niveau 1', () => {
    expect(applyAnswer({ level: 4, reviewed: '2026-10-20' }, false, TODAY)).toEqual({ level: 1, reviewed: TODAY })
    expect(applyAnswer(null, false, TODAY)).toEqual({ level: 1, reviewed: TODAY })
  })
})

describe('échéance', () => {
  it('niveau 1 révisé aujourd’hui : à revoir dès aujourd’hui', () => {
    expect(isDue({ level: 1, reviewed: TODAY }, TODAY)).toBe(true)
  })

  it('intervalles 0/1/3/7/14 jours', () => {
    expect(dueDay({ level: 1, reviewed: '2026-10-28' })).toBe('2026-10-28')
    expect(dueDay({ level: 2, reviewed: '2026-10-28' })).toBe('2026-10-29')
    expect(dueDay({ level: 3, reviewed: '2026-10-28' })).toBe('2026-10-31')
    expect(dueDay({ level: 4, reviewed: '2026-10-28' })).toBe('2026-11-04')
    expect(dueDay({ level: 5, reviewed: '2026-10-28' })).toBe('2026-11-11')
  })

  it('niveau 3 révisé le 28 : pas à revoir le 30', () => {
    expect(isDue({ level: 3, reviewed: '2026-10-28' }, '2026-10-30')).toBe(false)
  })

  it('niveau 3 révisé le 28 : à revoir le 31', () => {
    expect(isDue({ level: 3, reviewed: '2026-10-28' }, '2026-10-31')).toBe(true)
  })

  it('un mot nouveau n’est pas « à revoir »', () => {
    expect(isDue(null, TODAY)).toBe(false)
  })

  it('retard : plus le mot est échu depuis longtemps, plus le retard est grand', () => {
    const late = overdueDays({ level: 1, reviewed: '2026-10-24' }, TODAY)
    const recent = overdueDays({ level: 1, reviewed: '2026-10-28' }, TODAY)
    expect(late).toBe(5)
    expect(recent).toBe(1)
    expect(late).toBeGreaterThan(recent)
  })
})

describe('masteryLabel', () => {
  it('donne le libellé de chaque état', () => {
    expect(masteryLabel(null)).toBe('Nouveau')
    expect(masteryLabel({ level: 1, reviewed: TODAY })).toBe('En apprentissage')
    expect(masteryLabel({ level: 2, reviewed: TODAY })).toBe('Familier')
    expect(masteryLabel({ level: 3, reviewed: TODAY })).toBe('Bien connu')
    expect(masteryLabel({ level: 4, reviewed: TODAY })).toBe('Très bien connu')
    expect(masteryLabel({ level: 5, reviewed: TODAY })).toBe('Maîtrisé')
  })

  it('ne parle jamais de « boîte »', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      expect(masteryLabel({ level, reviewed: TODAY }).toLowerCase()).not.toContain('boîte')
    }
  })
})
