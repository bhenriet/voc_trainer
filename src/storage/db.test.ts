import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { loadVocabulary, markExported, openDb, replaceAll, saveProgress, type VocabularyDb } from './db'

const languages = { a: 'fr', b: 'en' }
let db: VocabularyDb
let counter = 0

function freshDb() {
  db = openDb(`test-${counter++}`)
  return db
}

afterEach(async () => {
  await db?.delete()
})

describe('stockage', () => {
  it('aucun vocabulaire au départ', async () => {
    expect(await loadVocabulary(freshDb())).toBeNull()
  })

  it('un import remplace tout le vocabulaire et la progression', async () => {
    freshDb()
    await replaceAll(db, languages, [
      { a: 'maison', b: 'house', ab: { level: 3, reviewed: '2026-10-28' }, ba: null },
      { a: 'chien', b: 'dog', ab: null, ba: null },
    ])
    await replaceAll(db, { a: 'es', b: 'de' }, [{ a: 'casa', b: 'Haus', ab: null, ba: null }])

    const vocabulary = await loadVocabulary(db)
    expect(vocabulary?.meta.languages).toEqual({ a: 'es', b: 'de' })
    expect(vocabulary?.words).toHaveLength(1)
    expect(vocabulary?.words[0]).toMatchObject({ a: 'casa', b: 'Haus', ab: null, ba: null })
  })

  it('une réponse est persistée et marque des changements non exportés', async () => {
    freshDb()
    await replaceAll(db, languages, [{ a: 'maison', b: 'house', ab: null, ba: null }])
    const [word] = (await loadVocabulary(db))!.words

    await saveProgress(db, word.id, 'ab', { level: 1, reviewed: '2026-10-29' })

    // Nouvelle connexion : simule un rechargement de la page.
    const reopened = openDb(db.name)
    const vocabulary = await loadVocabulary(reopened)
    reopened.close()
    expect(vocabulary?.words[0].ab).toEqual({ level: 1, reviewed: '2026-10-29' })
    expect(vocabulary?.words[0].ba).toBeNull()
    expect(vocabulary?.meta.unsavedChanges).toBe(true)
  })

  it('l’export enregistre sa date et efface le rappel', async () => {
    freshDb()
    await replaceAll(db, languages, [{ a: 'maison', b: 'house', ab: null, ba: null }])
    const [word] = (await loadVocabulary(db))!.words
    await saveProgress(db, word.id, 'ba', { level: 1, reviewed: '2026-10-29' })

    await markExported(db, new Date('2026-10-29T18:00:00Z'))

    const { meta } = (await loadVocabulary(db))!
    expect(meta.lastExportAt).toBe('2026-10-29T18:00:00.000Z')
    expect(meta.unsavedChanges).toBe(false)
  })

  it('un import repart sans changement non exporté', async () => {
    freshDb()
    await replaceAll(db, languages, [{ a: 'maison', b: 'house', ab: null, ba: null }])
    const [word] = (await loadVocabulary(db))!.words
    await saveProgress(db, word.id, 'ab', { level: 1, reviewed: '2026-10-29' })
    await replaceAll(db, languages, [{ a: 'chat', b: 'cat', ab: null, ba: null }])
    expect((await loadVocabulary(db))!.meta.unsavedChanges).toBe(false)
  })
})
