import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, isValidDay, today } from './dates'

describe('today', () => {
  it('utilise la date locale de l’appareil', () => {
    expect(today(new Date(2026, 9, 29, 23, 59))).toBe('2026-10-29')
    expect(today(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
  })
})

describe('isValidDay', () => {
  it('accepte une date existante', () => {
    expect(isValidDay('2026-10-28')).toBe(true)
    expect(isValidDay('2028-02-29')).toBe(true)
  })

  it('refuse un format ou une date inexistante', () => {
    expect(isValidDay('28/10/2026')).toBe(false)
    expect(isValidDay('2026-2-3')).toBe(false)
    expect(isValidDay('2026-02-30')).toBe(false)
    expect(isValidDay('2027-02-29')).toBe(false)
    expect(isValidDay('')).toBe(false)
  })
})

describe('addDays', () => {
  it('passe au mois suivant', () => {
    expect(addDays('2026-10-28', 7)).toBe('2026-11-04')
  })

  it('passe à l’année suivante', () => {
    expect(addDays('2026-12-25', 14)).toBe('2027-01-08')
  })

  it('gère les années bissextiles', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01')
  })

  it('ignore les changements d’heure', () => {
    expect(addDays('2026-10-24', 3)).toBe('2026-10-27')
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
  })

  it('accepte un nombre négatif', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('daysBetween', () => {
  it('compte les jours à travers mois et années', () => {
    expect(daysBetween('2026-10-28', '2026-10-31')).toBe(3)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
    expect(daysBetween('2026-10-31', '2026-10-28')).toBe(-3)
    expect(daysBetween('2026-10-28', '2026-10-28')).toBe(0)
  })
})
