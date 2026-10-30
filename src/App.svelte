<script lang="ts">
  import { onMount } from 'svelte'
  import { exportFileName, serialize, type ImportSummary } from './domain/csv'
  import { today } from './domain/dates'
  import type { Card } from './domain/model'
  import { loadVocabulary, markExported, openDb, replaceAll, type Vocabulary } from './storage/db'
  import Home from './ui/Home.svelte'
  import Import from './ui/Import.svelte'
  import Session from './ui/Session.svelte'
  import SessionConfig from './ui/SessionConfig.svelte'
  import Summary from './ui/Summary.svelte'
  import type { CardResult } from './ui/types'

  type Screen =
    | { name: 'home' }
    | { name: 'import' }
    | { name: 'config' }
    | { name: 'session'; cards: Card[]; requested: number }
    | { name: 'summary'; results: CardResult[]; total: number }

  const db = openDb()

  let vocabulary = $state<Vocabulary | null>(null)
  let loading = $state(true)
  let loadError = $state<string | null>(null)
  let screen = $state<Screen>({ name: 'home' })

  async function reload() {
    vocabulary = await loadVocabulary(db)
  }

  onMount(async () => {
    try {
      await reload()
    } catch (error) {
      loadError = `Impossible de lire les données enregistrées dans ce navigateur (${String(error)}).`
    } finally {
      loading = false
    }
  })

  function go(next: Screen) {
    screen = next
    window.scrollTo(0, 0)
  }

  async function importVocabulary(summary: ImportSummary) {
    await replaceAll(db, summary.languages, summary.words)
    await reload()
  }

  async function exportVocabulary() {
    if (!vocabulary) return
    const { languages } = vocabulary.meta
    const csv = serialize(languages, vocabulary.words)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = exportFileName(languages, today())
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    await markExported(db)
    await reload()
  }

  async function finishSession(results: CardResult[], total: number) {
    await reload()
    go(results.length === 0 ? { name: 'home' } : { name: 'summary', results, total })
  }
</script>

<main>
  {#if loading}
    <p class="muted">Chargement…</p>
  {:else if loadError}
    <div class="notice error">{loadError}</div>
  {:else if screen.name === 'import'}
    <Import
      existingCount={vocabulary?.words.length ?? 0}
      onImport={importVocabulary}
      onDone={() => go({ name: 'home' })}
    />
  {:else if screen.name === 'config' && vocabulary}
    <SessionConfig
      {vocabulary}
      onStart={(cards, requested) => go({ name: 'session', cards, requested })}
      onCancel={() => go({ name: 'home' })}
    />
  {:else if screen.name === 'session' && vocabulary}
    <Session
      {db}
      {vocabulary}
      cards={screen.cards}
      requested={screen.requested}
      onFinish={finishSession}
    />
  {:else if screen.name === 'summary'}
    <Summary
      results={screen.results}
      total={screen.total}
      onHome={() => go({ name: 'home' })}
      onAgain={() => go({ name: 'config' })}
    />
  {:else}
    <Home
      {vocabulary}
      onImport={() => go({ name: 'import' })}
      onStudy={() => go({ name: 'config' })}
      onExport={exportVocabulary}
    />
  {/if}
</main>
