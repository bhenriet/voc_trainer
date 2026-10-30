import { describe, expect, it } from 'vitest'
import { acceptedAnswers, checkAnswer } from './answer'

describe('checkAnswer', () => {
  it('ignore la casse et les espaces', () => {
    expect(checkAnswer(' House ', 'house')).toEqual({ kind: 'correct' })
    expect(checkAnswer('ice   cream', 'Ice cream')).toEqual({ kind: 'correct' })
  })

  it('accepte chacune des réponses multiples', () => {
    expect(checkAnswer('foyer', 'maison / foyer')).toEqual({ kind: 'correct' })
    expect(checkAnswer('maison', 'maison / foyer')).toEqual({ kind: 'correct' })
  })

  it('refuse une réponse incorrecte', () => {
    expect(checkAnswer('home', 'house')).toEqual({ kind: 'wrong' })
  })

  it('aucune tolérance aux articles ni aux fautes de frappe', () => {
    expect(checkAnswer('house', 'the house')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('hosue', 'house')).toEqual({ kind: 'wrong' })
  })

  it('une réponse vide est fausse', () => {
    expect(checkAnswer('', 'house')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('   ', 'house')).toEqual({ kind: 'wrong' })
  })

  it('accents manquants : juste avec l’orthographe attendue', () => {
    expect(checkAnswer('ete', 'été')).toEqual({ kind: 'accents', spelling: 'été' })
  })

  it('accents erronés : juste avec l’orthographe attendue', () => {
    expect(checkAnswer('éléve', 'élève')).toEqual({ kind: 'accents', spelling: 'élève' })
  })

  it('accents parmi des réponses multiples : montre la réponse concernée', () => {
    expect(checkAnswer('ecole', 'école / établissement')).toEqual({ kind: 'accents', spelling: 'école' })
  })

  it('forme décomposée (clavier mobile) jugée identique', () => {
    const decomposed = 'été' // « été » en NFD
    expect(checkAnswer(decomposed, 'été')).toEqual({ kind: 'correct' })
  })

  it('autres signes diacritiques', () => {
    expect(checkAnswer('strasse', 'straße')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('uber', 'über')).toEqual({ kind: 'accents', spelling: 'über' })
    expect(checkAnswer('nino', 'niño')).toEqual({ kind: 'accents', spelling: 'niño' })
  })
})

describe('acceptedAnswers', () => {
  it('découpe sur « / » et retire les espaces de bord', () => {
    expect(acceptedAnswers(' maison /foyer ')).toEqual(['maison', 'foyer'])
  })

  it('ignore les morceaux vides', () => {
    expect(acceptedAnswers('maison //')).toEqual(['maison'])
  })
})
