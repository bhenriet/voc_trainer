# Tasks

## 1. Normalisation et ponctuation

- [x] 1.1 Étendre `normalize` dans `src/domain/answer.ts` (apostrophes supprimées, autre ponctuation et traits d'union remplacés par une espace, espaces typographiques réduits, repli quand la clé est vide). Vérification : tests unitaires dans `src/domain/answer.test.ts` pour les scénarios de « Tolérance à la ponctuation » (`Hello, world!`, `bonjour ,monde`, `aujourd’hui`, `peut-être`, `peutêtre` faux, espace insécable, `rock & roll` et `3 euros` significatifs) et pour une réponse composée uniquement de ponctuation.
- [x] 1.2 Vérifier que `withoutAccents` et le verdict `accents` s'appuient sur la nouvelle clé. Vérification : test unitaire `Où est-il ?` saisi `ou est il` donne `{ kind: 'accents', spelling: 'Où est-il ?' }` ; les tests existants sur les accents, `straße` faux et la forme NFD restent verts.

## 2. Termes facultatifs entre parenthèses

- [x] 2.1 Ajouter le repérage des groupes de parenthèses équilibrés et le découpage de `acceptedAnswers` sur `/` hors groupes. Vérification : tests unitaires `acceptedAnswers('maison (a/b) / foyer')` donne `['maison (a/b)', 'foyer']`, une parenthèse non fermée n'empêche pas le découpage, et les tests existants de `acceptedAnswers` restent verts.
- [x] 2.2 Générer les variantes avec ou sans chaque groupe dans `checkAnswer` (plafond à 5 groupes, `(familier)` conservé, parenthèse non fermée littérale). Vérification : tests unitaires des scénarios de « Termes facultatifs entre parenthèses » (`to eat`, `to eat food`, `to eat (food)`, `lever`, `se lever`, `chat`, `un chat`, `chat noir`, `familier`, `a` faux pour `a (b`) et un cas à plus de 5 groupes qui reste juste pour la saisie complète et la saisie sans aucun groupe.

## 3. Vérification de bout en bout et documentation

- [x] 3.1 Ajouter des cas à `e2e/session.e2e.ts` (bloc « saisie et vérification ») : ponctuation ignorée, trait d'union remplacé par une espace, terme entre parenthèses omis, et affichage de `maison (a/b) / foyer` en deux réponses acceptées après une réponse fausse. Vérification : `npm run e2e` passe sur les projets desktop et mobile.
- [x] 3.2 Mettre à jour `README.md` (section sur les réponses acceptées, autour de la ligne sur `/`) : ponctuation ignorée, traits d'union, termes entre parenthèses facultatifs. Vérification : relecture du texte et exemples cohérents avec les scénarios de la spec.
- [x] 3.3 Vérification globale : `npm run check`, `npm test` et `openspec validate relax-answer-matching --strict` passent sans erreur.
