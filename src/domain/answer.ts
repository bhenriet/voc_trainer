export type Verdict =
  | { kind: 'correct' }
  /** Juste, mais les accents diffèrent : on montre l'orthographe attendue. */
  | { kind: 'accents'; spelling: string }
  | { kind: 'wrong' }

/** Plus de groupes facultatifs que cela : seules les variantes « tous présents » et « tous absents » sont testées. */
const MAX_OPTIONAL_GROUPS = 5

type Range = [start: number, end: number]

/** Groupes de parenthèses équilibrés de premier niveau ; une parenthèse jamais fermée est du texte. */
function topLevelGroups(value: string): Range[] {
  const open: number[] = []
  const pairs: Range[] = []
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') open.push(i)
    else if (value[i] === ')' && open.length > 0) pairs.push([open.pop()!, i])
  }
  pairs.sort((a, b) => a[0] - b[0])
  const groups: Range[] = []
  for (const pair of pairs) {
    const last = groups[groups.length - 1]
    if (!last || pair[0] > last[1]) groups.push(pair)
  }
  return groups
}

/** Réponses acceptées : une valeur « maison / foyer » en donne deux ; un « / » entre parenthèses ne sépare pas. */
export function acceptedAnswers(expected: string): string[] {
  const groups = topLevelGroups(expected)
  const parts: string[] = []
  let from = 0
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] === '/' && !groups.some(([start, end]) => i > start && i < end)) {
      parts.push(expected.slice(from, i))
      from = i + 1
    }
  }
  parts.push(expected.slice(from))
  return parts.map((part) => part.trim()).filter((part) => part !== '')
}

/** Une réponse attendue avec ou sans chacun de ses termes entre parenthèses. */
function variants(answer: string): string[] {
  const groups = topLevelGroups(answer)
  if (groups.length === 0) return [answer]
  const masks =
    groups.length > MAX_OPTIONAL_GROUPS
      ? [0, (1 << groups.length) - 1]
      : Array.from({ length: 1 << groups.length }, (_, mask) => mask)
  const result = masks.map((omitted) => {
    let text = ''
    let from = 0
    groups.forEach(([start, end], i) => {
      text += answer.slice(from, start)
      if (!(omitted & (1 << i))) text += answer.slice(start, end + 1)
      from = end + 1
    })
    return text + answer.slice(from)
  })
  // Un terme seul entre parenthèses n'est pas retiré : la variante vide est écartée.
  return result.filter((text) => text.trim() !== '')
}

/** NFC, espaces de bord supprimés, espaces multiples réduits, minuscules. */
function basic(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
}

/** Symboles que l'on garde malgré leur classe Unicode : ils portent du sens (`rock & roll`, `50 %`). */
const MEANINGFUL = '&%#@*'

/**
 * Clé de comparaison : apostrophes supprimées, autre ponctuation (traits d'union compris) remplacée par
 * une espace, espaces réduits, minuscules. Une valeur faite de ponctuation seule garde sa forme de base.
 */
export function normalize(value: string): string {
  const key = basic(value.replace(/['’ʼ‘]/g, '').replace(/\p{P}/gu, (c) => (MEANINGFUL.includes(c) ? c : ' ')))
  return key !== '' ? key : basic(value)
}

function bare(key: string): string {
  return key.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')
}

export function withoutAccents(value: string): string {
  return bare(normalize(value))
}

export function checkAnswer(input: string, expected: string): Verdict {
  if (input.trim() === '') return { kind: 'wrong' }
  const answers = acceptedAnswers(expected)
  const typed = normalize(input)

  if (answers.some((answer) => variants(answer).some((v) => normalize(v) === typed))) return { kind: 'correct' }

  const typedBare = bare(typed)
  const match = answers.find((answer) => variants(answer).some((v) => withoutAccents(v) === typedBare))
  if (match) return { kind: 'accents', spelling: match }

  return { kind: 'wrong' }
}

export function isCorrect(verdict: Verdict): boolean {
  return verdict.kind !== 'wrong'
}
