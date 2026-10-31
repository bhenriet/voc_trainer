# Proposal

## Why

Aujourd'hui une réponse n'est juste que si elle est identique à la réponse importée, à la casse, aux espaces et aux accents près. Un point final, une virgule suivie ou non d'une espace, un trait d'union remplacé par une espace ou une apostrophe typographique font échouer une réponse pourtant correcte. De plus, un terme entre parenthèses (`(se) lever`, `to eat (food)`) est un complément facultatif que l'utilisateur ne devrait pas avoir à saisir.

## What Changes

- La vérification d'une réponse ignore la ponctuation, des deux côtés (réponse saisie et réponse attendue) : `. , ; : ! ? " « » …` et les parenthèses elles-mêmes. Les espaces autour de la ponctuation n'ont donc aucun effet.
- Les apostrophes (`'`, `’`, `ʼ`) sont traitées comme de la ponctuation : `aujourd'hui`, `aujourd’hui` et `aujourdhui` sont équivalents.
- Le trait d'union équivaut à une espace : `peut-être` et `peut être` sont équivalents, `peutêtre` reste faux.
- Toutes les espaces (insécables, fines, tabulations) sont équivalentes à l'espace simple, puis réduites.
- Les chiffres et les symboles (`+ & € %`) ne sont pas de la ponctuation : ils restent significatifs.
- Un terme entre parenthèses dans une réponse attendue est facultatif : la réponse est juste avec ou sans lui. Plusieurs groupes de parenthèses donnent plusieurs variantes acceptées.
  - Si la réponse attendue se réduit à un terme entre parenthèses (`(familier)`), il n'est pas retiré.
  - Une parenthèse non fermée est du texte ordinaire.
  - Un `/` à l'intérieur de parenthèses ne sépare pas deux réponses (`maison (a/b) / foyer` donne deux réponses).
- Aucun avertissement n'est affiché pour ces tolérances (contrairement aux accents) ; la réponse attendue reste affichée telle qu'importée.

Inchangé : la tolérance aux accents avec son avertissement, l'absence de tolérance aux articles et aux fautes de frappe, le traitement de `œ`/`oe` et `ß`/`ss` (toujours faux), le texte du mot posé en question (parenthèses incluses).

Hors périmètre : crochets `[ ]`, tolérance aux ligatures, modification de la progression ou de l'import.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `study-session`: requirements « Vérification de la réponse » (ponctuation, apostrophes, traits d'union, espaces, termes facultatifs entre parenthèses, découpage sur `/` hors parenthèses) et « Tolérance aux accents » (comparaison faite après les nouvelles normalisations).

## Impact

- `src/domain/answer.ts` : normalisation étendue, expansion des variantes sans/avec parenthèses, découpage de `acceptedAnswers` insensible aux `/` entre parenthèses.
- `src/domain/answer.test.ts` et tests e2e de session : nouveaux cas.
- `src/ui/Session.svelte` et `src/ui/Summary.svelte` utilisent `acceptedAnswers` pour l'affichage : le changement de découpage s'y répercute sans modification de code.
- Aucune dépendance, aucun changement de stockage ni de format CSV.
