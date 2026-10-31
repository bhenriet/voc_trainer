import Dexie, { type EntityTable } from 'dexie'
import { fromLegacyLevel } from '../domain/mastery'
import type { Direction, Languages, Level, NewWord, Progress, Word } from '../domain/model'

const META_KEY = 'vocabulary'

export interface VocabularyMeta {
  key: typeof META_KEY
  languages: Languages
  /** Horodatages ISO, pour l'affichage. */
  importedAt: string
  lastExportAt: string | null
  /** Des révisions ont eu lieu depuis le dernier import ou export. */
  unsavedChanges: boolean
}

export interface Vocabulary {
  meta: VocabularyMeta
  words: Word[]
}

export type VocabularyDb = Dexie & {
  meta: EntityTable<VocabularyMeta, 'key'>
  words: EntityTable<Word, 'id'>
}

export function openDb(name = 'voc-trainer'): VocabularyDb {
  const db = new Dexie(name) as VocabularyDb
  db.version(1).stores({ meta: 'key', words: '++id' })
  // v2 : la progression passe du niveau Leitner à l'état FSRS (même schéma d'index).
  db.version(2)
    .stores({ meta: 'key', words: '++id' })
    .upgrade((tx) =>
      tx
        .table('words')
        .toCollection()
        .modify((word) => {
          word.ab = migrateProgress(word.ab)
          word.ba = migrateProgress(word.ba)
        }),
    )
  return db
}

interface LegacyProgress {
  level: Level
  reviewed: string
}

/** Convertit une progression `{ level, reviewed }` de l'ancienne version ; laisse intacte une progression déjà FSRS. */
export function migrateProgress(value: LegacyProgress | Progress | null | undefined): Progress | null {
  if (!value) return null
  if ('level' in value) return fromLegacyLevel(value.level, value.reviewed)
  return value
}

export async function loadVocabulary(db: VocabularyDb): Promise<Vocabulary | null> {
  return db.transaction('r', db.meta, db.words, async () => {
    const meta = await db.meta.get(META_KEY)
    if (!meta) return null
    return { meta, words: await db.words.toArray() }
  })
}

/** Remplace tout le vocabulaire et sa progression, en une seule transaction. */
export async function replaceAll(db: VocabularyDb, languages: Languages, words: NewWord[], now = new Date()) {
  await db.transaction('rw', db.meta, db.words, async () => {
    await db.words.clear()
    await db.words.bulkAdd(words as Word[])
    await db.meta.put({
      key: META_KEY,
      languages,
      importedAt: now.toISOString(),
      lastExportAt: null,
      unsavedChanges: false,
    })
  })
}

/** Enregistre la progression d'un mot dans un sens, dès la réponse validée. */
export async function saveProgress(db: VocabularyDb, wordId: number, direction: Direction, progress: Progress) {
  await db.transaction('rw', db.meta, db.words, async () => {
    await db.words.update(wordId, { [direction]: progress })
    await db.meta.update(META_KEY, { unsavedChanges: true })
  })
}

export async function markExported(db: VocabularyDb, now = new Date()) {
  await db.meta.update(META_KEY, { lastExportAt: now.toISOString(), unsavedChanges: false })
}

/** Demande au navigateur de ne pas évincer les données (sans effet si non supporté). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
