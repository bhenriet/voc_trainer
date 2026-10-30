<script lang="ts">
  import { acceptedAnswers } from '../domain/answer'
  import { plural } from './format'
  import type { CardResult } from './types'

  let {
    results,
    total,
    onHome,
    onAgain,
  }: {
    results: CardResult[]
    total: number
    onHome: () => void
    onAgain: () => void
  } = $props()

  let correct = $derived(results.filter((r) => r.correct).length)
  let missed = $derived(results.filter((r) => !r.correct))
</script>

<h1>Bilan</h1>

<section class="card">
  {#if results.length < total}
    <p class="muted small">Session interrompue : {results.length} carte{results.length > 1 ? 's' : ''} sur {total}.</p>
  {/if}
  <p class="score">
    <span class="ok">{plural(correct, 'juste')}</span>
    ·
    <span class="ko">{plural(missed.length, 'fausse')}</span>
  </p>

  {#if missed.length > 0}
    <h2>À retravailler</h2>
    <table>
      <thead>
        <tr><th>Mot</th><th>Réponse attendue</th></tr>
      </thead>
      <tbody>
        {#each missed as r (r.wordId + r.direction)}
          <tr>
            <td>{r.prompt}</td>
            <td>
              {acceptedAnswers(r.expected).join(' / ')}
              {#if r.input.trim()}<div class="muted small">votre réponse : {r.input}</div>{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>Aucune erreur, bravo !</p>
  {/if}

  <div class="actions">
    <button class="primary" onclick={onAgain}>Nouvelle session</button>
    <button onclick={onHome}>Accueil</button>
  </div>
</section>

<style>
  .score {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .ok {
    color: var(--success);
  }

  .ko {
    color: var(--danger);
  }
</style>
