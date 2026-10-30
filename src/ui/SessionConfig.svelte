<script lang="ts">
  import { today } from '../domain/dates'
  import { directionLabel, type Card } from '../domain/model'
  import { nextDueDay, selectCards, type StudyMode } from '../domain/selection'
  import type { Vocabulary } from '../storage/db'
  import { formatDay, plural } from './format'

  let {
    vocabulary,
    onStart,
    onCancel,
  }: {
    vocabulary: Vocabulary
    onStart: (cards: Card[], requested: number) => void
    onCancel: () => void
  } = $props()

  const STORAGE_KEY = 'voc-trainer:session'
  const MODES: StudyMode[] = ['ab', 'ba', 'mixed']

  /** Derniers choix de l'appareil : simple confort, sans conséquence si perdus. */
  function loadPreferences(): { count: number; mode: StudyMode } {
    const defaults = { count: 20, mode: 'ab' as StudyMode }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      return {
        count: Number.isInteger(saved?.count) && saved.count >= 1 ? saved.count : defaults.count,
        mode: MODES.includes(saved?.mode) ? saved.mode : defaults.mode,
      }
    } catch {
      return defaults
    }
  }

  const preferences = loadPreferences()
  let count = $state<number | null>(preferences.count)
  let mode = $state<StudyMode>(preferences.mode)

  let validCount = $derived(typeof count === 'number' && Number.isInteger(count) && count >= 1)
  let available = $derived(selectCards(vocabulary.words, Infinity, mode, today(), Math.random).length)
  let nextDue = $derived(available === 0 ? nextDueDay(vocabulary.words, mode) : null)

  function modeLabel(m: StudyMode) {
    return m === 'mixed' ? 'Mélangé' : directionLabel(vocabulary.meta.languages, m)
  }

  function start(event: SubmitEvent) {
    event.preventDefault()
    if (!validCount || available === 0) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, mode }))
    } catch {
      // Stockage indisponible (navigation privée…) : on continue sans mémoriser.
    }
    onStart(selectCards(vocabulary.words, count!, mode, today(), Math.random), count!)
  }
</script>

<h1>Nouvelle session</h1>

<form class="card" onsubmit={start}>
  <fieldset>
    <legend>Sens</legend>
    {#each MODES as m (m)}
      <label style="font-weight: normal">
        <input type="radio" name="mode" value={m} bind:group={mode} />
        {modeLabel(m)}
      </label>
    {/each}
  </fieldset>

  <label for="count">Nombre de cartes</label>
  <input id="count" type="number" inputmode="numeric" min="1" step="1" bind:value={count} />
  {#if !validCount}
    <p class="notice error small" style="margin-top: 0.5rem">Indiquez un nombre entier d’au moins 1.</p>
  {/if}

  {#if available === 0}
    <div class="notice warning" style="margin-top: 1rem">
      Rien à réviser dans ce sens aujourd’hui.
      {#if nextDue}Prochaine révision : {formatDay(nextDue)}.{/if}
    </div>
  {:else}
    <p class="muted small" style="margin-top: 0.5rem">
      {plural(available, 'carte disponible', 'cartes disponibles')} aujourd’hui.
    </p>
  {/if}

  <div class="actions">
    <button class="primary" type="submit" disabled={!validCount || available === 0}>Commencer</button>
    <button type="button" onclick={onCancel}>Retour</button>
  </div>
</form>
