<script lang="ts">
  import {
    DEFAULT_DELIMITER,
    detectDelimiter,
    parse,
    type Delimiter,
    type ImportMode,
    type ImportSummary,
  } from '../domain/csv'
  import type { Languages } from '../domain/model'
  import { plural } from './format'

  let {
    mode,
    existingCount,
    existingLanguages,
    onImport,
    onDone,
  }: {
    mode: ImportMode
    /** Nombre de mots déjà enregistrés (0 si aucun). */
    existingCount: number
    /** Langues du jeu existant (`null` si aucun vocabulaire). */
    existingLanguages: Languages | null
    onImport: (summary: ImportSummary, mode: ImportMode) => Promise<void>
    onDone: () => void
  } = $props()

  type Source = 'file' | 'paste'

  let source = $state<Source>('file')
  let file = $state<File | null>(null)
  let pasted = $state('')
  let delimiter = $state<Delimiter>(DEFAULT_DELIMITER)
  let hasHeader = $state(false)
  let error = $state<string | null>(null)
  /** Liste lue, en attente de validation. */
  let pending = $state<ImportSummary | null>(null)
  /** Liste importée avec succès. */
  let imported = $state<ImportSummary | null>(null)
  /** Nombre de mots du jeu après l'import (`existingCount` est déjà à jour une fois l'enregistrement fait). */
  let totalAfter = $state(0)
  let busy = $state(false)

  let appending = $derived(mode === 'append')
  /** Ajout à un jeu existant : la case décide si la première ligne est un titre. */
  let askHeader = $derived(appending && existingCount > 0)
  /** Remplacement d'un jeu existant : avertissement chiffré avant d'écraser. */
  let replacing = $derived(!appending && existingCount > 0)
  let title = $derived(appending ? 'Ajouter des cartes de vocabulaire' : 'Étudier un jeu de cartes')

  async function read() {
    error = null
    pending = null
    imported = null
    const text = source === 'file' ? await file?.text() : pasted
    if (text === undefined) return
    const result = parse(text, source === 'paste' ? detectDelimiter(text, delimiter) : delimiter, {
      mode,
      existingLanguages,
      headerRow: !askHeader || hasHeader,
    })
    if (!result.ok) {
      error = result.error
      return
    }
    pending = result.summary
  }

  async function save(summary: ImportSummary) {
    busy = true
    try {
      totalAfter = (appending ? existingCount : 0) + summary.words.length
      // `pending` est un état réactif (proxy) qu'IndexedDB ne sait pas copier.
      await onImport($state.snapshot(summary), mode)
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

  function reread() {
    // Une liste déjà lue est relue avec les nouveaux réglages ; le texte collé attend le bouton « Lire ».
    if (source === 'file' && file) void read()
    else if (source === 'paste' && (pending || error)) void read()
  }

  function chooseSource() {
    error = null
    pending = null
  }
</script>

{#snippet details(summary: ImportSummary, done: boolean)}
  <ul>
    <li>
      {#if appending}
        {plural(summary.words.length, 'mot')}
        {done ? 'ajoutés' : 'à ajouter'} au jeu {summary.languages.a} ↔ {summary.languages.b}
        {#if done}(total : {plural(totalAfter, 'mot')}){/if}
      {:else}
        {plural(summary.words.length, 'mot')} ({summary.languages.a} ↔ {summary.languages.b})
      {/if}
    </li>
    {#if summary.skippedRows > 0}
      <li>{plural(summary.skippedRows, 'ligne ignorée', 'lignes ignorées')} (une langue vide)</li>
    {/if}
    {#if summary.correctedValues > 0}
      <li>
        {plural(summary.correctedValues, 'progression invalide remise', 'progressions invalides remises')} à « Nouveau »
      </li>
    {/if}
    {#if summary.submittedLanguages}
      <li>
        Correspondance des langues :
        {existingLanguages?.a} ↔ {summary.submittedLanguages.a}, {existingLanguages?.b} ↔
        {summary.submittedLanguages.b}
        <span class="muted small">(à titre informatif, les langues du jeu ne changent pas)</span>
      </li>
    {/if}
  </ul>
  {#if summary.ignoredProgressColumns.length > 0}
    <div class="notice warning small">
      Colonnes de progression ignorées : {summary.ignoredProgressColumns.join(', ')}. Les mots sont ajoutés au
      niveau « Nouveau ».
    </div>
  {/if}
  {#if summary.ignoredColumns.length > 0}
    <div class="notice warning small">
      Colonnes non reconnues, ignorées : {summary.ignoredColumns.join(', ')}. Elles ne figureront pas dans
      l’export.
    </div>
  {/if}
{/snippet}

<h1>{title}</h1>

{#if imported}
  <section class="card">
    <div class="notice success">{appending ? 'Ajout terminé.' : 'Import terminé.'}</div>
    {@render details(imported, true)}
    <div class="actions stack">
      <button class="primary" onclick={onDone}>Continuer</button>
    </div>
  </section>
{:else}
  <section class="card">
    <fieldset>
      <legend>Source</legend>
      <label style="font-weight: normal">
        <input type="radio" name="source" value="file" bind:group={source} onchange={chooseSource} />
        Fichier
      </label>
      <label style="font-weight: normal">
        <input type="radio" name="source" value="paste" bind:group={source} onchange={chooseSource} />
        Coller depuis un tableur
      </label>
    </fieldset>

    {#if source === 'file'}
      <label for="csv-file">Fichier CSV</label>
      <input id="csv-file" type="file" accept=".csv,.tsv,text/csv,text/plain" onchange={onFileChange} disabled={busy} />
    {:else}
      <label for="csv-paste">Liste collée</label>
      <textarea
        id="csv-paste"
        bind:value={pasted}
        placeholder="Copiez les cellules dans Excel ou Google Sheets, puis collez-les ici"
        disabled={busy}
      ></textarea>
      <div class="actions">
        <button onclick={read} disabled={busy || pasted.trim() === ''}>Lire</button>
      </div>
    {/if}

    {#if askHeader}
      <label style="font-weight: normal; margin-top: 1rem">
        <input type="checkbox" bind:checked={hasHeader} onchange={reread} />
        Ma liste contient une colonne de titres
      </label>
      <p class="muted small">
        {#if hasHeader}
          La première ligne est ignorée : les mots sont ajoutés au jeu {existingLanguages?.a} ↔ {existingLanguages?.b}.
        {:else}
          Sans titres, la première colonne est ajoutée en « {existingLanguages?.a} » et la deuxième en
          « {existingLanguages?.b} ».
        {/if}
      </p>
    {:else}
      <p class="muted small">
        La première ligne doit nommer les deux langues (ex. <code>fr</code> et <code>en</code>), puis une ligne
        par mot.
      </p>
    {/if}

    <fieldset style="margin-top: 1rem">
      <legend>Séparateur</legend>
      <label style="font-weight: normal">
        <input type="radio" name="delimiter" value=";" bind:group={delimiter} onchange={reread} />
        Point-virgule « ; »
      </label>
      <label style="font-weight: normal">
        <input type="radio" name="delimiter" value="," bind:group={delimiter} onchange={reread} />
        Virgule « , »
      </label>
      <label style="font-weight: normal">
        <input type="radio" name="delimiter" value={'\t'} bind:group={delimiter} onchange={reread} />
        Tabulation
      </label>
      {#if source === 'paste'}
        <p class="muted small">Les cellules copiées depuis un tableur sont reconnues automatiquement.</p>
      {/if}
    </fieldset>

    {#if replacing && !pending}
      <p class="muted small">
        L’import remplacera les {plural(existingCount, 'mot')} enregistrés et leur progression. Pensez à exporter
        d’abord si besoin.
      </p>
    {/if}

    {#if error}
      <div class="notice error">{error}</div>
    {/if}

    {#if pending}
      {#if replacing}
        <div class="notice warning">
          <strong>
            Remplacer les {plural(existingCount, 'mot')} enregistrés et leur progression par les
            {plural(pending.words.length, 'mot')} {source === 'file' ? 'du fichier' : 'de la liste collée'} ?
          </strong>
          Cette action est irréversible.
        </div>
      {:else}
        <div class="notice">
          <strong>
            {appending ? 'Ajouter ces mots ?' : 'Importer ce jeu de cartes ?'}
          </strong>
          Langues : {pending.languages.a} ↔ {pending.languages.b}.
        </div>
      {/if}
      {@render details(pending, false)}
      <div class="actions">
        <button class={replacing ? 'danger' : 'primary'} onclick={() => save(pending!)} disabled={busy}>
          {replacing ? 'Remplacer' : appending ? 'Ajouter' : 'Importer'}
        </button>
        <button onclick={onDone} disabled={busy}>Annuler</button>
      </div>
    {:else}
      <div class="actions">
        <button onclick={onDone} disabled={busy}>Retour</button>
      </div>
    {/if}
  </section>
{/if}
