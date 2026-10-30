import { describe, expect, it } from 'vitest'
import { exportFileName, parse, serialize, type ImportSummary, type ParseResult } from './csv'

function ok(result: ParseResult): ImportSummary {
  if (!result.ok) throw new Error(`import refusé : ${result.error}`)
  return result.summary
}

function error(result: ParseResult): string {
  if (result.ok) throw new Error('import accepté alors qu’il devait être refusé')
  return result.error
}

describe('parse : format', () => {
  it('fichier minimal à deux colonnes', () => {
    const summary = ok(parse('fr;en\nmaison;house\nchien;dog\n'))
    expect(summary.languages).toEqual({ a: 'fr', b: 'en' })
    expect(summary.words).toEqual([
      { a: 'maison', b: 'house', ab: null, ba: null },
      { a: 'chien', b: 'dog', ab: null, ba: null },
    ])
  })

  it('fichier avec progression', () => {
    const summary = ok(
      parse('fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr\nmaison;house;3;1;2026-10-28;2026-10-20'),
    )
    expect(summary.words[0]).toEqual({
      a: 'maison',
      b: 'house',
      ab: { level: 3, reviewed: '2026-10-28' },
      ba: { level: 1, reviewed: '2026-10-20' },
    })
  })

  it('colonnes de progression repérées par leur nom, dans n’importe quel ordre', () => {
    const summary = ok(parse('fr;en;revu_en_fr;Maitrise_EN_FR\nmaison;house;2026-10-20;2'))
    expect(summary.words[0].ba).toEqual({ level: 2, reviewed: '2026-10-20' })
    expect(summary.words[0].ab).toBeNull()
  })

  it('fichier commençant par un BOM', () => {
    const summary = ok(parse('﻿fr;en\nmaison;house'))
    expect(summary.languages.a).toBe('fr')
  })

  it('champ entre guillemets contenant le séparateur', () => {
    const summary = ok(parse('fr;en\n"garder (un objet; un secret)";keep'))
    expect(summary.words[0].a).toBe('garder (un objet; un secret)')
  })

  it('fins de ligne Windows et espaces de bord', () => {
    const summary = ok(parse('fr ; en\r\n maison ; house \r\n'))
    expect(summary.languages).toEqual({ a: 'fr', b: 'en' })
    expect(summary.words[0]).toMatchObject({ a: 'maison', b: 'house' })
  })

  it('séparateur virgule', () => {
    const summary = ok(parse('fr,en\nchien,dog', ','))
    expect(summary.words[0]).toMatchObject({ a: 'chien', b: 'dog' })
  })
})

describe('parse : validation', () => {
  it('refuse un en-tête de moins de deux colonnes', () => {
    expect(error(parse('fr\nmaison'))).toMatch(/au moins deux colonnes/)
  })

  it('suggère de vérifier le séparateur', () => {
    expect(error(parse('fr,en\nchien,dog', ';'))).toMatch(/séparateur/)
  })

  it('refuse un fichier vide', () => {
    expect(error(parse(''))).toMatch(/au moins deux colonnes/)
  })

  it('refuse un fichier sans ligne de vocabulaire valide', () => {
    expect(error(parse('fr;en\n;house\nmaison;\n'))).toMatch(/aucune ligne/)
  })

  it('refuse deux langues de même nom', () => {
    expect(error(parse('fr;FR\na;b'))).toMatch(/même nom/)
  })

  it('ignore et compte les lignes incomplètes', () => {
    const summary = ok(parse('fr;en\nmaison;house\n;dog\nchat;\nlapin;rabbit'))
    expect(summary.words).toHaveLength(2)
    expect(summary.skippedRows).toBe(2)
  })

  it('remet à « Nouveau » et compte les valeurs de progression invalides', () => {
    const summary = ok(
      parse(
        [
          'fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr',
          'maison;house;6;2;2026-10-28;2026-10-20', // niveau hors limites (fr→en)
          'chien;dog;3;x;2026-10-28;2026-10-20', // niveau non numérique (en→fr)
          'chat;cat;3;;28/10/2026;', // date mal formée (fr→en)
          'lapin;rabbit;2;;;', // niveau sans date (fr→en)
        ].join('\n'),
      ),
    )
    expect(summary.correctedValues).toBe(4)
    expect(summary.words[0]).toMatchObject({ ab: null, ba: { level: 2, reviewed: '2026-10-20' } })
    expect(summary.words[1]).toMatchObject({ ab: { level: 3, reviewed: '2026-10-28' }, ba: null })
    expect(summary.words[2]).toMatchObject({ ab: null, ba: null })
    expect(summary.words[3]).toMatchObject({ ab: null, ba: null })
  })

  it('signale les colonnes non reconnues', () => {
    const summary = ok(parse('fr;en;categorie;maitrise_fr_en;revu_fr_en\nmaison;house;habitat;2;2026-10-28'))
    expect(summary.ignoredColumns).toEqual(['categorie'])
    expect(summary.words[0].ab).toEqual({ level: 2, reviewed: '2026-10-28' })
  })
})

describe('serialize', () => {
  const languages = { a: 'fr', b: 'en' }

  it('produit l’en-tête complet, le BOM et des cellules vides pour un sens Nouveau', () => {
    const csv = serialize(languages, [{ a: 'maison', b: 'house', ab: { level: 3, reviewed: '2026-10-28' }, ba: null }])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr',
      'maison;house;3;;2026-10-28;',
      '',
    ])
  })

  it('aller-retour serialize → parse sans perte', () => {
    const words = [
      { a: 'maison / foyer', b: 'house', ab: { level: 3 as const, reviewed: '2026-10-28' }, ba: { level: 1 as const, reviewed: '2026-10-20' } },
      { a: 'garder (un objet; un secret)', b: 'keep (an object; a "secret")', ab: null, ba: { level: 5 as const, reviewed: '2026-09-01' } },
      { a: 'été', b: 'summer', ab: null, ba: null },
    ]
    const summary = ok(parse(serialize(languages, words)))
    expect(summary.languages).toEqual(languages)
    expect(summary.words).toEqual(words)
    expect(summary.skippedRows).toBe(0)
    expect(summary.correctedValues).toBe(0)
    expect(summary.ignoredColumns).toEqual([])
  })
})

describe('exportFileName', () => {
  it('contient les langues et la date', () => {
    expect(exportFileName({ a: 'fr', b: 'en' }, '2026-10-29')).toBe('vocabulaire_fr_en_2026-10-29.csv')
  })

  it('neutralise les caractères interdits dans un nom de fichier', () => {
    expect(exportFileName({ a: 'fr/BE', b: 'nl' }, '2026-10-29')).toBe('vocabulaire_fr-BE_nl_2026-10-29.csv')
  })
})
