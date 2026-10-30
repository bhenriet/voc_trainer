<script lang="ts">
  import { today } from '../domain/dates'
  import { LEVEL_LABELS, NEW_LABEL } from '../domain/mastery'
  import { DIRECTIONS, directionLabel, type Level } from '../domain/model'
  import { directionStats } from '../domain/stats'
  import type { Vocabulary } from '../storage/db'
  import { formatDateTime, plural } from './format'

  let {
    vocabulary,
    onImport,
    onStudy,
    onExport,
  }: {
    vocabulary: Vocabulary | null
    onImport: () => void
    onStudy: () => void
    onExport: () => Promise<void>
  } = $props()

  const levels: Level[] = [1, 2, 3, 4, 5]

  let stats = $derived(
    vocabulary ? DIRECTIONS.map((direction) => directionStats(vocabulary!.words, direction, today())) : [],
  )
  let exporting = $state(false)

  async function exportNow() {
    exporting = true
    try {
      await onExport()
    } finally {
      exporting = false
    }
  }
</script>

<h1>Voc Trainer</h1>

{#if !vocabulary}
  <section class="card">
    <h2>Bienvenue</h2>
    <p>Importez votre liste de vocabulaire au format CSV pour commencer à réviser.</p>
    <p>
      La première ligne nomme les deux langues, puis une ligne par mot, séparée par un point-virgule :
    </p>
    <pre>fr;en
maison;house
chien;dog</pre>
    <p class="muted small">
      Enregistrez le fichier en UTF-8 (dans Excel : « CSV UTF-8 ») pour conserver les accents. Plusieurs
      réponses possibles se séparent par « / », par exemple <code>maison / foyer</code>.
    </p>
    <div class="actions stack">
      <button class="primary" onclick={onImport}>Importer un fichier CSV</button>
    </div>
  </section>
{:else}
  {@const { languages } = vocabulary.meta}
  <section class="card">
    <h2>{languages.a} ↔ {languages.b}</h2>
    <p class="muted">{plural(vocabulary.words.length, 'mot')}</p>

    <table>
      <thead>
        <tr>
          <th>Maîtrise</th>
          {#each DIRECTIONS as direction (direction)}
            <th class="num">{directionLabel(languages, direction)}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{NEW_LABEL}</td>
          {#each stats as s, i (i)}<td class="num">{s.fresh}</td>{/each}
        </tr>
        {#each levels as level (level)}
          <tr>
            <td>{LEVEL_LABELS[level]}</td>
            {#each stats as s, i (i)}<td class="num">{s.levels[level]}</td>{/each}
          </tr>
        {/each}
        <tr>
          <th>À revoir aujourd’hui</th>
          {#each stats as s, i (i)}<th class="num">{s.due}</th>{/each}
        </tr>
      </tbody>
    </table>

    <div class="actions stack">
      <button class="primary" onclick={onStudy}>Réviser</button>
    </div>
  </section>

  <section class="card">
    <h2>Sauvegarde</h2>
    {#if vocabulary.meta.unsavedChanges}
      <div class="notice warning">
        Des progrès ne sont pas encore sauvegardés dans un fichier. Exportez pour les conserver ou les
        transférer sur un autre appareil.
      </div>
    {/if}
    <p class="small">
      {#if vocabulary.meta.lastExportAt}
        Dernier export : {formatDateTime(vocabulary.meta.lastExportAt)}
      {:else}
        Aucun export depuis l’import du {formatDateTime(vocabulary.meta.importedAt)}.
      {/if}
    </p>
    <div class="actions">
      <button onclick={exportNow} disabled={exporting}>Exporter en CSV</button>
      <button onclick={onImport}>Importer un autre fichier</button>
    </div>
  </section>
{/if}
