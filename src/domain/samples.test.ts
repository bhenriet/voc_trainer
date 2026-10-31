import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from './csv'
import { fromLegacyLevel } from './mastery'

// Les fichiers de samples/ servent aux vérifications manuelles de l'import : on s'assure ici
// qu'ils produisent bien le cas qu'ils illustrent.
const sample = (name: string) => readFileSync(new URL(`../../samples/${name}`, import.meta.url), 'utf8')

describe('fichiers d’exemple', () => {
  it('fr-en-minimal.csv', () => {
    const result = parse(sample('fr-en-minimal.csv'))
    expect(result.ok && result.summary.words.length).toBe(10)
  })

  it('fr-en-progression.csv (ancien format de maîtrise, avec BOM)', () => {
    const result = parse(sample('fr-en-progression.csv'))
    expect(result.ok && result.summary.words[0].ab).toEqual(fromLegacyLevel(3, '2026-10-28'))
  })

  it('fr-en-fsrs.csv (format FSRS, dont un sens à retravailler)', () => {
    const result = parse(sample('fr-en-fsrs.csv'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary.correctedValues).toBe(0)
    expect(result.summary.words[0].ab).toMatchObject({ stability: 12.4, difficulty: 5.3, reviewed: '2026-10-28', relearning: false })
    expect(result.summary.words.some((w) => w.ab?.relearning || w.ba?.relearning)).toBe(true)
  })

  it('fr-en-virgule.csv', () => {
    expect(parse(sample('fr-en-virgule.csv'), ';').ok).toBe(false)
    expect(parse(sample('fr-en-virgule.csv'), ',').ok).toBe(true)
  })

  it('fr-en-erreurs.csv', () => {
    const result = parse(sample('fr-en-erreurs.csv'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary).toMatchObject({ skippedRows: 1, correctedValues: 2, ignoredColumns: ['categorie'] })
  })

  it('fichiers invalides', () => {
    expect(parse(sample('invalide-une-colonne.csv')).ok).toBe(false)
    expect(parse(sample('invalide-aucune-ligne.csv')).ok).toBe(false)
  })
})
