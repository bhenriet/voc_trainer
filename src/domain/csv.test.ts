import { describe, expect, it } from 'vitest'
import { detectDelimiter, exportFileName, parse, serialize, type ImportSummary, type ParseResult } from './csv'
import { fromLegacyLevel, levelOf } from './mastery'
import type { Progress } from './model'

const progress = (stability: number, difficulty: number, reviewed: string, relearning = false): Progress => ({
  stability,
  difficulty,
  reviewed,
  relearning,
})

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
      parse(
        'fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr\nmaison;house;S:12.4|D:5.3;S:1.5|D:6.1;2026-10-28;2026-10-20',
      ),
    )
    expect(summary.words[0]).toEqual({
      a: 'maison',
      b: 'house',
      ab: progress(12.4, 5.3, '2026-10-28'),
      ba: progress(1.5, 6.1, '2026-10-20'),
    })
  })

  it('sens à retravailler (suffixe |R:1)', () => {
    const summary = ok(parse('fr;en;maitrise_fr_en;revu_fr_en\nmaison;house;S:0.8|D:6.1|R:1;2026-10-28'))
    expect(summary.words[0].ab).toEqual(progress(0.8, 6.1, '2026-10-28', true))
  })

  it('ancien format : entier de 1 à 5 converti, niveau et date conservés', () => {
    const summary = ok(
      parse('fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr\nmaison;house;3;1;2026-10-28;2026-10-20'),
    )
    expect(summary.words[0].ab).toEqual(fromLegacyLevel(3, '2026-10-28'))
    expect(summary.words[0].ba).toEqual(fromLegacyLevel(1, '2026-10-20'))
    expect(levelOf(summary.words[0].ab!.stability)).toBe(3)
    expect(summary.correctedValues).toBe(0)
  })

  it('colonnes de progression repérées par leur nom, dans n’importe quel ordre', () => {
    const summary = ok(parse('fr;en;revu_en_fr;Maitrise_EN_FR\nmaison;house;2026-10-20;2'))
    expect(summary.words[0].ba).toEqual(fromLegacyLevel(2, '2026-10-20'))
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
          'ours;bear;S:0|D:5;S:3|D:11;2026-10-28;2026-10-28', // stabilité nulle, difficulté hors limites
          'loup;wolf;S:abc|D:5;S:2|D:5|R:2;2026-10-28;2026-10-28', // valeurs mal formées
        ].join('\n'),
      ),
    )
    expect(summary.correctedValues).toBe(8)
    expect(summary.words[0]).toMatchObject({ ab: null, ba: fromLegacyLevel(2, '2026-10-20') })
    expect(summary.words[1]).toMatchObject({ ab: fromLegacyLevel(3, '2026-10-28'), ba: null })
    expect(summary.words[4]).toMatchObject({ ab: null, ba: null })
    expect(summary.words[5]).toMatchObject({ ab: null, ba: null })
    expect(summary.words[2]).toMatchObject({ ab: null, ba: null })
    expect(summary.words[3]).toMatchObject({ ab: null, ba: null })
  })

  it('signale les colonnes non reconnues', () => {
    const summary = ok(parse('fr;en;categorie;maitrise_fr_en;revu_fr_en\nmaison;house;habitat;2;2026-10-28'))
    expect(summary.ignoredColumns).toEqual(['categorie'])
    expect(summary.words[0].ab).toEqual(fromLegacyLevel(2, '2026-10-28'))
  })
})

describe('serialize', () => {
  const languages = { a: 'fr', b: 'en' }

  it('produit l’en-tête complet, le BOM et des cellules vides pour un sens Nouveau', () => {
    const csv = serialize(languages, [{ a: 'maison', b: 'house', ab: progress(12.4, 5.3, '2026-10-28'), ba: null }])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr',
      'maison;house;S:12.4|D:5.3;;2026-10-28;',
      '',
    ])
  })

  it('écrit 4 chiffres significatifs et le suffixe |R:1 des sens à retravailler', () => {
    const csv = serialize(languages, [
      { a: 'maison', b: 'house', ab: progress(12.3456789, 5.123456, '2026-10-28'), ba: progress(0.8, 6.1, '2026-10-28', true) },
    ])
    expect(csv.split('\r\n')[1]).toBe('maison;house;S:12.35|D:5.123;S:0.8|D:6.1|R:1;2026-10-28;2026-10-28')
  })

  it('aller-retour serialize → parse sans perte', () => {
    const words = [
      { a: 'maison / foyer', b: 'house', ab: progress(12.4, 5.3, '2026-10-28'), ba: progress(0.8, 6.1, '2026-10-20', true) },
      { a: 'garder (un objet; un secret)', b: 'keep (an object; a "secret")', ab: null, ba: progress(75, 2.5, '2026-09-01') },
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

const PASTED = [
  'Mot NL\tMot FR',
  'Goeiedag!\tBonjour !',
  'Hallo!\tSalut !',
  'Hei!\tSalut !',
  'Hoe gaat het met je?\tComment vas-tu ?',
  'Ça va?\tÇa va ?',
  'Wat is er mis?\tQu\'est-ce qui ne va pas ?',
  'Beste Anja,\tChère Anja,',
].join('\n')

const existing = { a: 'nl', b: 'fr' }

describe('detectDelimiter', () => {
  it('reconnaît la tabulation sur la première ligne', () => {
    expect(detectDelimiter(PASTED)).toBe('\t')
    expect(detectDelimiter(PASTED, ',')).toBe('\t')
  })

  it('se replie sur le séparateur choisi sans tabulation', () => {
    expect(detectDelimiter('fr;en\nmaison;house')).toBe(';')
    expect(detectDelimiter('fr,en\nchien,dog', ',')).toBe(',')
  })

  it('ne regarde que la première ligne', () => {
    expect(detectDelimiter('fr;en\nmaison\thouse')).toBe(';')
  })
})

describe('parse : tabulation (texte collé)', () => {
  it('lit les cellules copiées depuis un tableur, accents et ponctuation compris', () => {
    const summary = ok(parse(PASTED, detectDelimiter(PASTED)))
    expect(summary.languages).toEqual({ a: 'Mot NL', b: 'Mot FR' })
    expect(summary.words).toHaveLength(7)
    expect(summary.words[0]).toEqual({ a: 'Goeiedag!', b: 'Bonjour !', ab: null, ba: null })
    expect(summary.words[4]).toMatchObject({ a: 'Ça va?', b: 'Ça va ?' })
    expect(summary.words[5]).toMatchObject({ b: "Qu'est-ce qui ne va pas ?" })
  })

  it('lit un champ entre guillemets contenant une tabulation', () => {
    const summary = ok(parse('nl\tfr\n"a\tb"\tc', '\t'))
    expect(summary.words[0]).toMatchObject({ a: 'a\tb', b: 'c' })
  })
})

describe('parse : ajout', () => {
  it('sans titres, la première ligne est un mot et les langues sont celles du jeu', () => {
    const summary = ok(parse('Goeiedag!\tBonjour !\nHallo!\tSalut !', '\t', { mode: 'append', existingLanguages: existing, headerRow: false }))
    expect(summary.languages).toEqual(existing)
    expect(summary.submittedLanguages).toBeNull()
    expect(summary.words).toEqual([
      { a: 'Goeiedag!', b: 'Bonjour !', ab: null, ba: null },
      { a: 'Hallo!', b: 'Salut !', ab: null, ba: null },
    ])
  })

  it('avec titres, ils sont informatifs et les langues du jeu sont conservées', () => {
    const summary = ok(parse(PASTED, '\t', { mode: 'append', existingLanguages: existing, headerRow: true }))
    expect(summary.languages).toEqual(existing)
    expect(summary.submittedLanguages).toEqual({ a: 'Mot NL', b: 'Mot FR' })
    expect(summary.words).toHaveLength(7)
    expect(summary.words[0]).toMatchObject({ a: 'Goeiedag!' })
  })

  it('ignore la progression et la signale', () => {
    const summary = ok(
      parse('fr;en;maitrise_fr_en;revu_fr_en;note\nmaison;house;S:12.4|D:5.3;2026-10-28;x', ';', {
        mode: 'append',
        existingLanguages: { a: 'fr', b: 'en' },
        headerRow: true,
      }),
    )
    expect(summary.words[0]).toEqual({ a: 'maison', b: 'house', ab: null, ba: null })
    expect(summary.ignoredProgressColumns).toEqual(['maitrise_fr_en', 'revu_fr_en'])
    expect(summary.ignoredColumns).toEqual(['note'])
    expect(summary.correctedValues).toBe(0)
  })

  it('sans vocabulaire existant, les titres nomment les langues du nouveau jeu', () => {
    const summary = ok(parse(PASTED, '\t', { mode: 'append', existingLanguages: null }))
    expect(summary.languages).toEqual({ a: 'Mot NL', b: 'Mot FR' })
    expect(summary.submittedLanguages).toBeNull()
    expect(summary.words).toHaveLength(7)
  })

  it('compte les lignes incomplètes ignorées', () => {
    const summary = ok(parse('a\tb\nc\t\n\td', '\t', { mode: 'append', existingLanguages: existing, headerRow: false }))
    expect(summary.words).toHaveLength(1)
    expect(summary.skippedRows).toBe(2)
  })

  it('refuse une liste sans ligne valide', () => {
    expect(error(parse('', '\t', { mode: 'append', existingLanguages: existing, headerRow: false }))).toMatch(/aucune ligne/)
    expect(error(parse('nl\tfr\n', '\t', { mode: 'append', existingLanguages: existing, headerRow: true }))).toMatch(/aucune ligne/)
  })

  it('refuse une ligne de titres invalide', () => {
    expect(error(parse('nl\nmot', '\t', { mode: 'append', existingLanguages: existing, headerRow: true }))).toMatch(/deux colonnes/)
    expect(error(parse('nl\tnl\na\tb', '\t', { mode: 'append', existingLanguages: existing, headerRow: true }))).toMatch(/même nom/)
  })
})

describe('exemple de la demande : 12 cellules collées', () => {
  const full = [
    'Mot NL\tMot FR',
    'Goeiedag!\tBonjour !',
    'Hallo!\tSalut !',
    'Hei!\tSalut !',
    'Dag Anja!\tBonjour Anja !',
    'Hoe gaat het met je?\tComment vas-tu ?',
    'Alles goed ?\tTout va bien ?',
    'Ça va?\tÇa va ?',
    'Wat is er mis?\tQu\'est-ce qui ne va pas ?',
    'Hoe voel je je vandaag?\tComment te sens-tu aujourd\'hui ?',
    'Gaat het al beter?\tÇa va déjà mieux ?',
    'Alles oké?\tTout va bien ?',
    'Beste Anja,\tChère Anja,',
  ].join('\n')

  it('crée un jeu de 12 mots, doublons de traduction conservés', () => {
    const summary = ok(parse(full, detectDelimiter(full), { mode: 'append' }))
    expect(summary.words).toHaveLength(12)
    expect(summary.words.filter((w) => w.b === 'Salut !')).toHaveLength(2)
    expect(summary.skippedRows).toBe(0)
  })

  it('ajoute 12 mots à un jeu nl/fr, titres cochés ou non', () => {
    const withHeader = ok(parse(full, '\t', { mode: 'append', existingLanguages: existing, headerRow: true }))
    const without = ok(parse(full, '\t', { mode: 'append', existingLanguages: existing, headerRow: false }))
    expect(withHeader.words).toHaveLength(12)
    expect(without.words).toHaveLength(13)
  })
})
