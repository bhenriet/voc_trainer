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

describe('checkAnswer : ponctuation', () => {
  const correct = { kind: 'correct' }

  it('ignore la ponctuation finale et interne', () => {
    expect(checkAnswer('hello world', 'Hello, world!')).toEqual(correct)
    expect(checkAnswer('Hello, world!', 'hello world')).toEqual(correct)
  })

  it('ignore les espaces autour de la ponctuation', () => {
    expect(checkAnswer('bonjour ,monde', 'bonjour, monde')).toEqual(correct)
    expect(checkAnswer('bonjour,monde', 'bonjour, monde')).toEqual(correct)
  })

  it('apostrophes : variantes équivalentes et facultatives', () => {
    expect(checkAnswer("aujourd'hui", 'aujourd’hui')).toEqual(correct)
    expect(checkAnswer('aujourdhui', 'aujourd’hui')).toEqual(correct)
    expect(checkAnswer('aujourd ʼhui', 'aujourd’hui')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('l homme', "l'homme")).toEqual({ kind: 'wrong' })
  })

  it('le trait d’union équivaut à une espace, pas à rien', () => {
    expect(checkAnswer('peut être', 'peut-être')).toEqual(correct)
    expect(checkAnswer('peutêtre', 'peut-être')).toEqual({ kind: 'wrong' })
  })

  it('espaces insécables et fines équivalentes à l’espace', () => {
    expect(checkAnswer('New York', 'New York')).toEqual(correct)
    expect(checkAnswer('New\u202fYork', 'New York')).toEqual(correct)
  })

  it('symboles et chiffres restent significatifs', () => {
    expect(checkAnswer('rock roll', 'rock & roll')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('euros', '3 euros')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('rock & roll', 'rock & roll')).toEqual(correct)
  })

  it('ponctuation et accents se combinent', () => {
    expect(checkAnswer('ou est il', 'Où est-il ?')).toEqual({ kind: 'accents', spelling: 'Où est-il ?' })
  })

  it('une réponse faite de ponctuation seule reste comparable', () => {
    expect(checkAnswer('?', '?')).toEqual(correct)
    expect(checkAnswer('!', '?')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('?', 'house')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('', '?')).toEqual({ kind: 'wrong' })
  })
})

describe('checkAnswer : termes entre parenthèses', () => {
  const correct = { kind: 'correct' }

  it('terme omis, saisi, ou saisi avec ses parenthèses', () => {
    for (const typed of ['to eat', 'to eat food', 'to eat (food)']) {
      expect(checkAnswer(typed, 'to eat (food)')).toEqual(correct)
    }
  })

  it('terme facultatif en début de réponse', () => {
    expect(checkAnswer('lever', '(se) lever')).toEqual(correct)
    expect(checkAnswer('se lever', '(se) lever')).toEqual(correct)
  })

  it('plusieurs groupes : toutes les combinaisons', () => {
    for (const typed of ['chat', 'un chat', 'chat noir', 'un chat noir']) {
      expect(checkAnswer(typed, '(un) chat (noir)')).toEqual(correct)
    }
    expect(checkAnswer('noir', '(un) chat (noir)')).toEqual({ kind: 'wrong' })
  })

  it('un terme seul entre parenthèses est conservé', () => {
    expect(checkAnswer('familier', '(familier)')).toEqual(correct)
    expect(checkAnswer('', '(familier)')).toEqual({ kind: 'wrong' })
  })

  it('parenthèse non fermée : texte ordinaire', () => {
    expect(checkAnswer('a', 'a (b')).toEqual({ kind: 'wrong' })
    expect(checkAnswer('a b', 'a (b')).toEqual(correct)
  })

  it('l’autre réponse d’une valeur multiple reste acceptée', () => {
    expect(checkAnswer('foyer', 'maison (a/b) / foyer')).toEqual(correct)
    expect(checkAnswer('maison', 'maison (a/b) / foyer')).toEqual(correct)
  })

  it('accents sur un terme facultatif omis', () => {
    expect(checkAnswer('ete', '(l’) été')).toEqual({ kind: 'accents', spelling: '(l’) été' })
  })

  it('plus de 5 groupes : saisie complète ou sans aucun groupe', () => {
    const expected = 'a (1) b (2) c (3) d (4) e (5) f (6)'
    expect(checkAnswer('a b c d e f', expected)).toEqual(correct)
    expect(checkAnswer('a 1 b 2 c 3 d 4 e 5 f 6', expected)).toEqual(correct)
  })
})

describe('acceptedAnswers', () => {
  it('découpe sur « / » et retire les espaces de bord', () => {
    expect(acceptedAnswers(' maison /foyer ')).toEqual(['maison', 'foyer'])
  })

  it('ignore les morceaux vides', () => {
    expect(acceptedAnswers('maison //')).toEqual(['maison'])
  })

  it('un « / » entre parenthèses ne sépare pas deux réponses', () => {
    expect(acceptedAnswers('maison (a/b) / foyer')).toEqual(['maison (a/b)', 'foyer'])
  })

  it('une parenthèse non fermée n’empêche pas le découpage', () => {
    expect(acceptedAnswers('a (b / c')).toEqual(['a (b', 'c'])
  })
})
