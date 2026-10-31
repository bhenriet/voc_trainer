## MODIFIED Requirements

### Requirement: Vérification de la réponse
Une réponse MUST être jugée juste si, après normalisation, elle est égale à l'une des réponses attendues, elle aussi normalisée. La normalisation ignore la casse, les espaces en début et fin, les espaces multiples et la ponctuation (voir « Tolérance à la ponctuation »). Une valeur de langue contenant `/` hors parenthèses définit plusieurs réponses attendues.

#### Scenario: Casse et espaces ignorés
- **WHEN** la réponse attendue est `house` et l'utilisateur saisit ` House `
- **THEN** la réponse est juste

#### Scenario: Espaces multiples ignorés
- **WHEN** la réponse attendue est `ice cream` et l'utilisateur saisit `ice    cream`
- **THEN** la réponse est juste

#### Scenario: Réponses multiples
- **WHEN** la réponse attendue est `maison / foyer` et l'utilisateur saisit `foyer`
- **THEN** la réponse est juste

#### Scenario: Réponse incorrecte
- **WHEN** la réponse attendue est `house` et l'utilisateur saisit `home`
- **THEN** la réponse est fausse

#### Scenario: Pas de tolérance aux fautes de frappe ni aux articles
- **WHEN** la réponse attendue est `the house` et l'utilisateur saisit `house`, ou la réponse attendue est `house` et l'utilisateur saisit `hosue`
- **THEN** la réponse est fausse

### Requirement: Tolérance aux accents
Une réponse qui ne diffère d'une réponse attendue que par les accents ou signes diacritiques, la normalisation de la vérification étant appliquée, MUST être jugée juste, et le système MUST alors signaler l'écart en affichant l'orthographe attendue.

#### Scenario: Accents manquants
- **WHEN** la réponse attendue est `été` et l'utilisateur saisit `ete`
- **THEN** la réponse est juste et le système affiche « attention aux accents : été »

#### Scenario: Accents erronés
- **WHEN** la réponse attendue est `élève` et l'utilisateur saisit `éléve`
- **THEN** la réponse est juste et le système affiche l'orthographe attendue `élève`

#### Scenario: Accents et ponctuation
- **WHEN** la réponse attendue est `Où est-il ?` et l'utilisateur saisit `ou est il`
- **THEN** la réponse est juste et le système affiche « attention aux accents : Où est-il ? »

## ADDED Requirements

### Requirement: Tolérance à la ponctuation
La vérification MUST ignorer la ponctuation, dans la réponse saisie comme dans la réponse attendue, ainsi que les espaces qui l'entourent. Les apostrophes (`'`, `’`, `ʼ`) sont de la ponctuation, le trait d'union équivaut à une espace, et toutes les espaces (insécables, fines, tabulations) équivalent à l'espace simple. Les chiffres et les symboles (`+ & € %`) MUST rester significatifs. Aucun avertissement n'est affiché.

#### Scenario: Ponctuation finale et interne
- **WHEN** la réponse attendue est `Hello, world!` et l'utilisateur saisit `hello world`
- **THEN** la réponse est juste, sans avertissement

#### Scenario: Espaces autour de la ponctuation
- **WHEN** la réponse attendue est `bonjour, monde` et l'utilisateur saisit `bonjour ,monde`
- **THEN** la réponse est juste

#### Scenario: Apostrophes
- **WHEN** la réponse attendue est `aujourd’hui` et l'utilisateur saisit `aujourd'hui` ou `aujourdhui`
- **THEN** la réponse est juste

#### Scenario: Trait d'union équivalent à une espace
- **WHEN** la réponse attendue est `peut-être` et l'utilisateur saisit `peut être`
- **THEN** la réponse est juste

#### Scenario: Mots collés
- **WHEN** la réponse attendue est `peut-être` et l'utilisateur saisit `peutêtre`
- **THEN** la réponse est fausse

#### Scenario: Espace insécable
- **WHEN** la réponse attendue est `New York` et l'utilisateur saisit `New York` avec une espace insécable
- **THEN** la réponse est juste

#### Scenario: Symboles et chiffres significatifs
- **WHEN** la réponse attendue est `rock & roll` et l'utilisateur saisit `rock roll`, ou la réponse attendue est `3 euros` et l'utilisateur saisit `euros`
- **THEN** la réponse est fausse

### Requirement: Termes facultatifs entre parenthèses
Un terme entre parenthèses dans une réponse attendue MUST être facultatif : la réponse est juste avec ou sans lui. Une réponse attendue comportant plusieurs groupes de parenthèses accepte toutes les combinaisons. Une réponse attendue qui se réduit à un terme entre parenthèses MUST le conserver. Une parenthèse non fermée est du texte ordinaire.

#### Scenario: Terme omis
- **WHEN** la réponse attendue est `to eat (food)` et l'utilisateur saisit `to eat`
- **THEN** la réponse est juste

#### Scenario: Terme saisi
- **WHEN** la réponse attendue est `to eat (food)` et l'utilisateur saisit `to eat food` ou `to eat (food)`
- **THEN** la réponse est juste

#### Scenario: Terme facultatif en début de réponse
- **WHEN** la réponse attendue est `(se) lever` et l'utilisateur saisit `lever` ou `se lever`
- **THEN** la réponse est juste

#### Scenario: Plusieurs groupes
- **WHEN** la réponse attendue est `(un) chat (noir)` et l'utilisateur saisit `chat`, `un chat` ou `chat noir`
- **THEN** la réponse est juste

#### Scenario: Réponse uniquement entre parenthèses
- **WHEN** la réponse attendue est `(familier)` et l'utilisateur saisit `familier`
- **THEN** la réponse est juste
- **AND** une saisie vide reste fausse

#### Scenario: Parenthèse non fermée
- **WHEN** la réponse attendue est `a (b` et l'utilisateur saisit `a`
- **THEN** la réponse est fausse

#### Scenario: Barre oblique entre parenthèses
- **WHEN** la réponse attendue est `maison (a/b) / foyer` et l'utilisateur saisit `foyer`
- **THEN** la réponse est juste
- **AND** la réponse attendue est affichée comme deux réponses acceptées : `maison (a/b)` et `foyer`
