<script lang="ts">
  import { DEFAULT_DELIMITER, parse, type Delimiter, type ImportSummary } from '../domain/csv'
  import { plural } from './format'

  let {
    existingCount,
    onImport,
    onDone,
  }: {
    /** Nombre de mots déjà enregistrés (0 si aucun). */
    existingCount: number
    onImport: (summary: ImportSummary) => Promise<void>
    onDone: () => void
  } = $props()

  let file = $state<File | null>(null)
  let delimiter = $state<Delimiter>(DEFAULT_DELIMITER)
  let error = $state<string | null>(null)
  /** Fichier lu, en attente de confirmation du remplacement. */
  let pending = $state<ImportSummary | null>(null)
  /** Fichier importé avec succès. */
  let imported = $state<ImportSummary | null>(null)
  let busy = $state(false)

  async function read() {
    error = null
    pending = null
    imported = null
    if (!file) return
    const result = parse(await file.text(), delimiter)
    if (!result.ok) {
      error = result.error
      return
    }
    if (existingCount > 0) pending = result.summary
    else await save(result.summary)
  }

  async function save(summary: ImportSummary) {
    busy = true
    try {
      // `pending` est un état réactif (proxy) qu'IndexedDB ne sait pas copier.
      await onImport($state.snapshot(summary))
      pending = null
      imported = summary
    } catch (e) {
      error = `L’enregistrement a échoué, les données existantes sont inchangées (${String(e)}).`
    } finally {
      busy = false
    }
  }

  function onFileChange(event: Event) {
    file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null
    void read()
  }
</script>

{#snippet details(summary: ImportSummary)}
  <ul>
    <li>
      {plural(summary.words.length, 'mot')} ({summary.languages.a} ↔ {summary.languages.b})
    </li>
    {#if summary.skippedRows > 0}
      <li>{plural(summary.skippedRows, 'ligne ignorée', 'lignes ignorées')} (une langue vide)</li>
    {/if}
    {#if summary.correctedValues > 0}
      <li>
        {plural(summary.correctedValues, 'progression invalide remise', 'progressions invalides remises')} à « Nouveau »
      </li>
    {/if}
  </ul>
  {#if summary.ignoredColumns.length > 0}
    <div class="notice warning small">
      Colonnes non reconnues, ignorées : {summary.ignoredColumns.join(', ')}. Elles ne figureront pas dans
      l’export.
    </div>
  {/if}
{/snippet}

<h1>Importer un fichier</h1>

{#if imported}
  <section class="card">
    <div class="notice success">Import terminé.</div>
    {@render details(imported)}
    <div class="actions stack">
      <button class="primary" onclick={onDone}>Continuer</button>
    </div>
  </section>
{:else}
  <section class="card">
    <label for="csv-file">Fichier CSV</label>
    <input id="csv-file" type="file" accept=".csv,text/csv,text/plain" onchange={onFileChange} disabled={busy} />

    <fieldset style="margin-top: 1rem">
      <legend>Séparateur</legend>
      <label style="font-weight: normal">
        <input type="radio" name="delimiter" value=";" bind:group={delimiter} onchange={read} />
        Point-virgule « ; »
      </label>
      <label style="font-weight: normal">
        <input type="radio" name="delimiter" value="," bind:group={delimiter} onchange={read} />
        Virgule « , »
      </label>
    </fieldset>

    {#if existingCount > 0 && !pending}
      <p class="muted small">
        L’import remplacera les {plural(existingCount, 'mot')} enregistrés et leur progression. Pensez à exporter
        d’abord si besoin.
      </p>
    {/if}

    {#if error}
      <div class="notice error">{error}</div>
    {/if}

    {#if pending}
      <div class="notice warning">
        <strong>
          Remplacer les {plural(existingCount, 'mot')} enregistrés et leur progression par les
          {plural(pending.words.length, 'mot')} du fichier ?
        </strong>
        Cette action est irréversible.
      </div>
      {@render details(pending)}
      <div class="actions">
        <button class="danger" onclick={() => save(pending!)} disabled={busy}>Remplacer</button>
        <button onclick={onDone} disabled={busy}>Annuler</button>
      </div>
    {:else}
      <div class="actions">
        <button onclick={onDone} disabled={busy}>Retour</button>
      </div>
    {/if}
  </section>
{/if}
