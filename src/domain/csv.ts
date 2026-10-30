import Papa from 'papaparse'
import { isValidDay, type Day } from './dates'
import type { Direction, Languages, Level, NewWord, Progress, Word } from './model'

export type Delimiter = ';' | ','

export const DEFAULT_DELIMITER: Delimiter = ';'
export const EXPORT_DELIMITER: Delimiter = ';'

const BOM = '﻿'

export interface ImportSummary {
  languages: Languages
  words: NewWord[]
  /** Lignes ignorées car une colonne de langue est vide. */
  skippedRows: number
  /** Couples (mot, sens) dont la progression invalide a été remise à « Nouveau ». */
  correctedValues: number
  /** En-têtes des colonnes non reconnues, absentes de l'export. */
  ignoredColumns: string[]
}

export type ParseResult = { ok: true; summary: ImportSummary } | { ok: false; error: string }

/** Noms des colonnes de progression pour un couple de langues. */
export function progressColumns(languages: Languages) {
  const { a, b } = languages
  return {
    level: { ab: `maitrise_${a}_${b}`, ba: `maitrise_${b}_${a}` },
    reviewed: { ab: `revu_${a}_${b}`, ba: `revu_${b}_${a}` },
  } satisfies Record<string, Record<Direction, string>>
}

const normalizeHeader = (value: string) => value.trim().toLowerCase()

function readProgress(level: string, reviewed: string): { progress: Progress | null; corrected: boolean } {
  if (level === '' && reviewed === '') return { progress: null, corrected: false }
  const isLevel = /^[1-5]$/.test(level)
  if (!isLevel || !isValidDay(reviewed)) return { progress: null, corrected: true }
  return { progress: { level: Number(level) as Level, reviewed: reviewed as Day }, corrected: false }
}

/** Lit un CSV de vocabulaire. N'a aucun effet de bord : l'appelant décide d'enregistrer. */
export function parse(text: string, delimiter: Delimiter = DEFAULT_DELIMITER): ParseResult {
  const content = text.startsWith(BOM) ? text.slice(BOM.length) : text
  const rows = Papa.parse<string[]>(content, { delimiter, skipEmptyLines: 'greedy' }).data

  const header = (rows[0] ?? []).map((cell) => cell.trim())
  if (header.length < 2) {
    return {
      ok: false,
      error: `Le fichier doit avoir au moins deux colonnes de langue (en-tête lu : « ${header.join('') || 'vide'} »). Vérifiez le séparateur choisi (« ${delimiter} »).`,
    }
  }

  const languages: Languages = { a: header[0], b: header[1] }
  if (languages.a === '' || languages.b === '') {
    return { ok: false, error: 'Les deux premières colonnes doivent avoir un en-tête qui nomme la langue (ex. « fr;en »).' }
  }
  if (normalizeHeader(languages.a) === normalizeHeader(languages.b)) {
    return { ok: false, error: `Les deux colonnes de langue portent le même nom (« ${languages.a} »).` }
  }

  // Position de chaque colonne de progression, repérée par son nom.
  const names = progressColumns(languages)
  const indexOf = (name: string) => header.findIndex((h) => normalizeHeader(h) === normalizeHeader(name))
  const columns = {
    level: { ab: indexOf(names.level.ab), ba: indexOf(names.level.ba) },
    reviewed: { ab: indexOf(names.reviewed.ab), ba: indexOf(names.reviewed.ba) },
  }
  const known = new Set([0, 1, ...Object.values(columns.level), ...Object.values(columns.reviewed)])
  const ignoredColumns = header.filter((h, i) => !known.has(i) && h !== '')

  const cell = (row: string[], index: number) => (index >= 0 ? (row[index] ?? '').trim() : '')

  const words: NewWord[] = []
  let skippedRows = 0
  let correctedValues = 0

  for (const row of rows.slice(1)) {
    const a = cell(row, 0)
    const b = cell(row, 1)
    if (a === '' || b === '') {
      skippedRows++
      continue
    }
    const word: NewWord = { a, b, ab: null, ba: null }
    for (const direction of ['ab', 'ba'] as const) {
      const { progress, corrected } = readProgress(
        cell(row, columns.level[direction]),
        cell(row, columns.reviewed[direction]),
      )
      word[direction] = progress
      if (corrected) correctedValues++
    }
    words.push(word)
  }

  if (words.length === 0) {
    return { ok: false, error: 'Le fichier ne contient aucune ligne de vocabulaire dont les deux langues sont renseignées.' }
  }

  return { ok: true, summary: { languages, words, skippedRows, correctedValues, ignoredColumns } }
}

/** Produit le CSV d'export (séparateur « ; », UTF-8 avec BOM pour Excel). */
export function serialize(languages: Languages, words: readonly (Word | NewWord)[]): string {
  const names = progressColumns(languages)
  const header = [languages.a, languages.b, names.level.ab, names.level.ba, names.reviewed.ab, names.reviewed.ba]
  const rows = words.map((w) => [
    w.a,
    w.b,
    w.ab ? String(w.ab.level) : '',
    w.ba ? String(w.ba.level) : '',
    w.ab?.reviewed ?? '',
    w.ba?.reviewed ?? '',
  ])
  return BOM + Papa.unparse([header, ...rows], { delimiter: EXPORT_DELIMITER, newline: '\r\n' }) + '\r\n'
}

/** Nom de fichier proposé à l'export, ex. vocabulaire_fr_en_2026-10-29.csv. */
export function exportFileName(languages: Languages, day: Day): string {
  const safe = (name: string) => name.replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-+|-+$/g, '') || 'langue'
  return `vocabulaire_${safe(languages.a)}_${safe(languages.b)}_${day}.csv`
}
