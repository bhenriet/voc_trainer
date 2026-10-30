export type Verdict =
  | { kind: 'correct' }
  /** Juste, mais les accents diffèrent : on montre l'orthographe attendue. */
  | { kind: 'accents'; spelling: string }
  | { kind: 'wrong' }

/** Réponses acceptées : une valeur « maison / foyer » en donne deux. */
export function acceptedAnswers(expected: string): string[] {
  return expected
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part !== '')
}

/** NFC, espaces de bord supprimés, espaces multiples réduits, minuscules. */
export function normalize(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function withoutAccents(value: string): string {
  return normalize(value).normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')
}

export function checkAnswer(input: string, expected: string): Verdict {
  const answers = acceptedAnswers(expected)
  const typed = normalize(input)
  if (typed === '') return { kind: 'wrong' }

  if (answers.some((answer) => normalize(answer) === typed)) return { kind: 'correct' }

  const typedBare = withoutAccents(input)
  const match = answers.find((answer) => withoutAccents(answer) === typedBare)
  if (match) return { kind: 'accents', spelling: match }

  return { kind: 'wrong' }
}

export function isCorrect(verdict: Verdict): boolean {
  return verdict.kind !== 'wrong'
}
