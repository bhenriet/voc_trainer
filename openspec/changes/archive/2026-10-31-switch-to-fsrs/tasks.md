# Tasks

## 1. Dépendance et cœur FSRS

- [x] 1.1 Ajouter `ts-fsrs` et vérifier que `npm install` puis `npm run build` réussissent
- [x] 1.2 Écrire un test de caractérisation de `ts-fsrs` configuré (sans étapes courtes, sans fuzz, rétention 0,9) : état initial d'un mot Nouveau pour Again et Good, intervalle minimal, révision le même jour ; ajuster la conception si le comportement diffère
- [x] 1.3 Remplacer `Progress` par `{ stability, difficulty, reviewed, relearning }` dans `model.ts` et ajouter le type `Grade` ; vérifier que `npm run check` signale tous les usages à migrer
- [x] 1.4 Réécrire `mastery.ts` : `applyAnswer(progress, grade, day)` (pose la marque `relearning` sur Again), `clearRelearning`, `dueDay` (= `reviewed` si `relearning`), `isDue`, `retrievability`, `levelOf` (seuils 2, 7, 21, 60), `fromLegacyLevel` ; vérifier avec `mastery.test.ts` couvrant les scénarios de `mastery-tracking` (sens indépendants, niveaux et limites, Nouveau juste/faux, échéance, marque à retravailler, réessai réussi/raté, correction d'un faux négatif)

## 2. Sélection, statistiques et interface

- [x] 2.1 Adapter `selection.ts` : tri par rétrievabilité croissante en remplacement de `overdueDays` ; vérifier avec `selection.test.ts` (priorité aux cartes à revoir, plus de cartes que demandé, mélange)
- [x] 2.2 Adapter `stats.ts` pour compter par `levelOf(stability)` ; vérifier avec `stats.test.ts`
- [x] 2.3 Adapter `Session.svelte` : note Again/Good, `previous` pour « j'avais juste », file de réessai (carte fausse reposée en fin de file jusqu'à réussite, première réponse seule dans le bilan, total inchangé, libellé « Réessai ») ; adapter `Home.svelte` ; vérifier avec `npm run check`
- [x] 2.4 Étendre `e2e/session.e2e.ts` : une carte ratée est reposée, la session ne finit qu'après sa réussite, le bilan compte la première réponse ; une session interrompue laisse la carte ratée à revoir dans une nouvelle session du jour

## 3. CSV et migration des données

- [x] 3.1 Adapter `csv.ts` : lecture de `S:<s>|D:<d>[|R:1]` et de l'ancien entier 1 à 5, validation stricte (valeurs corrigées comptées), écriture `S:…|D:…[|R:1]` ; vérifier avec `csv.test.ts` (nouveau format, suffixe `|R:1`, ancien format, valeurs invalides, aller-retour)
- [x] 3.2 Mettre à jour les fichiers de `samples/` (progression au nouveau format, conserver un exemple à l'ancien format) ; vérifier avec `samples.test.ts`
- [x] 3.3 Ajouter `db.version(2).upgrade` dans `db.ts` pour convertir `{ level, reviewed }` en `{ stability, difficulty, reviewed, relearning: false }` ; vérifier avec `db.test.ts` (base v1 remplie puis rouverte)

## 4. Documentation et intégration

- [x] 4.1 Mettre à jour `README.md` (format de `maitrise_*`, niveaux dérivés de la stabilité, fonctionnement FSRS, recommandation d'export avant mise à jour) ; vérifier que les exemples du README correspondent à un export réel
- [x] 4.2 Exécuter l'ensemble : tests unitaires, `npm run check`, build, tests e2e (import, export, session) ; vérifier qu'un CSV exporté puis réimporté conserve la progression et que la taille du bundle reste raisonnable
