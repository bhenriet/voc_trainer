<script lang="ts">
  import { tick } from 'svelte'
  import { acceptedAnswers, checkAnswer, isCorrect, type Verdict } from '../domain/answer'
  import { today } from '../domain/dates'
  import { applyAnswer, clearRelearning } from '../domain/mastery'
  import { directionLabel, expected, prompt, type Card, type Grade, type Progress } from '../domain/model'
  import { saveProgress, type Vocabulary, type VocabularyDb } from '../storage/db'
  import type { CardResult } from './types'

  let {
    db,
    vocabulary,
    cards,
    requested,
    onFinish,
  }: {
    db: VocabularyDb
    vocabulary: Vocabulary
    cards: Card[]
    requested: number
    onFinish: (results: CardResult[], total: number) => void
  } = $props()

  let index = $state(0)
  let input = $state('')
  let verdict = $state<Verdict | null>(null)
  /** Première réponse à chaque carte : c'est elle qui alimente le bilan. */
  let results = $state<CardResult[]>([])
  /** Cartes ratées, reposées après les cartes de la session jusqu'à être réussies. */
  let retries = $state<Card[]>([])
  /** Réponse à la carte affichée (celle de `results` pour une première réponse, locale pour un réessai). */
  let current = $state<CardResult | null>(null)
  /** Dernière progression enregistrée pendant la session, par carte, pour le réessai. */
  const saved = new Map<string, Progress | null>()
  let saveError = $state<string | null>(null)
  let busy = $state(false)
  /** Progression avant la réponse, pour recalculer en cas de « j'avais juste ». */
  let previous: Progress | null = null

  let inputEl = $state<HTMLInputElement>()

  let sequence = $derived([...cards, ...retries])
  let card = $derived(sequence[index])
  let isRetry = $derived(index >= cards.length)
  let word = $derived(vocabulary.words.find((w) => w.id === card.wordId)!)

  // Le focus reste dans le champ (le clavier virtuel ne se ferme pas) : Entrée valide,
  // puis Entrée passe à la carte suivante.
  $effect(() => {
    void index
    inputEl?.focus()
  })

  const keyOf = (c: Card) => `${c.wordId}:${c.direction}`

  async function save(progress: Progress) {
    await saveProgress(db, word.id, card.direction, progress)
    saved.set(keyOf(card), progress)
  }

  async function record(grade: Grade) {
    await save(applyAnswer(previous, grade, today()))
  }

  /** Réessai réussi : retire la marque « à retravailler » sans nouvelle révision FSRS. */
  async function recordRetrySuccess() {
    await save(clearRelearning(saved.get(keyOf(card))!))
  }

  /** Retire la carte qui vient d'être remise en file (réponse corrigée en « j'avais juste »). */
  function dropRetry() {
    const i = retries.findLastIndex((c) => keyOf(c) === keyOf(card))
    if (i >= 0) retries.splice(i, 1)
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if (busy) return
    if (verdict !== null) {
      next()
      return
    }
    busy = true
    saveError = null
    try {
      const result = checkAnswer(input, expected(word, card.direction))
      const correct = isCorrect(result)
      if (isRetry) {
        if (correct) await recordRetrySuccess()
      } else {
        previous = word[card.direction]
        await record(correct ? 'good' : 'again')
      }
      const answer: CardResult = {
        wordId: word.id,
        direction: card.direction,
        prompt: prompt(word, card.direction),
        expected: expected(word, card.direction),
        input,
        correct,
        overridden: false,
      }
      if (isRetry) {
        current = answer
      } else {
        results.push(answer)
        current = results[results.length - 1]
      }
      if (!correct) retries.push(card)
      verdict = result
    } catch (e) {
      saveError = `La réponse n’a pas pu être enregistrée (${String(e)}). Réessayez.`
    } finally {
      busy = false
    }
  }

  async function override() {
    if (!current || current.correct || busy) return
    busy = true
    try {
      if (isRetry) await recordRetrySuccess()
      else await record('good')
      dropRetry()
      current.correct = true
      current.overridden = true
    } catch (e) {
      saveError = `La correction n’a pas pu être enregistrée (${String(e)}).`
    } finally {
      busy = false
    }
    await tick()
    inputEl?.focus()
  }

  function next() {
    if (index + 1 >= sequence.length) {
      onFinish($state.snapshot(results), cards.length)
      return
    }
    index++
    input = ''
    verdict = null
    current = null
  }

  function onAnswerKeydown(event: KeyboardEvent) {
    // Champ en lecture seule après la réponse : on gère Entrée nous-mêmes plutôt que de
    // compter sur la soumission implicite, dont le comportement varie selon les navigateurs.
    if (event.key === 'Enter' && verdict !== null) {
      event.preventDefault()
      if (!busy) next()
    }
  }

  function scrollIntoViewOnFocus(event: FocusEvent) {
    // Laisse le clavier virtuel s'ouvrir avant de recentrer la carte.
    const target = event.currentTarget as HTMLElement
    setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
  }
</script>

<div class="session-header">
  <span class="muted">{directionLabel(vocabulary.meta.languages, card.direction)}</span>
  <span class="progress">{isRetry ? 'Réessai' : `${index + 1} / ${cards.length}`}</span>
  <button type="button" class="small" onclick={() => onFinish($state.snapshot(results), cards.length)}>
    Arrêter
  </button>
</div>

{#if index === 0 && verdict === null && cards.length < requested}
  <div class="notice warning small">
    Seulement {cards.length} carte{cards.length > 1 ? 's' : ''} à réviser aujourd’hui sur les {requested} demandées.
  </div>
{/if}

<section class="card flashcard">
  <p class="prompt" lang={card.direction === 'ab' ? vocabulary.meta.languages.a : vocabulary.meta.languages.b}>
    {prompt(word, card.direction)}
  </p>

  <form onsubmit={submit}>
    <label for="answer" class="muted small">
      Traduction en {card.direction === 'ab' ? vocabulary.meta.languages.b : vocabulary.meta.languages.a}
    </label>
    <input
      id="answer"
      type="text"
      bind:this={inputEl}
      bind:value={input}
      onfocus={scrollIntoViewOnFocus}
      onkeydown={onAnswerKeydown}
      readonly={verdict !== null}
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="done"
    />
    {#if verdict === null}
      <div class="actions stack">
        <button class="primary" type="submit" disabled={busy}>Valider</button>
      </div>
    {/if}
  </form>

  {#if saveError}
    <div class="notice error small" style="margin-top: 0.75rem">{saveError}</div>
  {/if}

  {#if verdict !== null && current}
    {#if current.overridden}
      <div class="notice success feedback">Corrigé : compté comme juste.</div>
    {:else if verdict.kind === 'correct'}
      <div class="notice success feedback">Juste !</div>
    {:else if verdict.kind === 'accents'}
      <div class="notice success feedback">
        Juste, mais attention aux accents : <strong>{verdict.spelling}</strong>
      </div>
    {:else}
      <div class="notice error feedback">Faux.</div>
    {/if}

    <p>
      Réponse{acceptedAnswers(current.expected).length > 1 ? 's acceptées' : ' attendue'} :
      <strong>{acceptedAnswers(current.expected).join(' / ')}</strong>
    </p>

    <div class="actions">
      <button class="primary" type="button" onclick={next} disabled={busy}>
        {index + 1 >= sequence.length ? 'Voir le bilan' : 'Suivant'}
      </button>
      {#if !current.correct}
        <button type="button" onclick={override} disabled={busy}>J’avais juste</button>
      {/if}
    </div>
  {/if}
</section>

<style>
  .session-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .session-header button {
    min-height: 36px;
    padding: 0.25rem 0.75rem;
  }

  .progress {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .prompt {
    font-size: 1.75rem;
    font-weight: 600;
    text-align: center;
    overflow-wrap: anywhere;
    margin: 0.5rem 0 1rem;
  }

  .feedback {
    margin-top: 0.75rem;
  }
</style>
