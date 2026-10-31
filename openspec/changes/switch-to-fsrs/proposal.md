# Proposal

## Why

La méthode de Leitner actuelle impose les mêmes intervalles fixes (0, 1, 3, 7, 14 jours) à tous les mots : un mot facile et un mot difficile reviennent au même rythme, et un seul échec ramène tout à zéro. FSRS modélise la mémoire de chaque carte (stabilité et difficulté) et planifie la prochaine révision pour viser une rétention cible, ce qui réduit le nombre de révisions inutiles tout en limitant l'oubli.

## What Changes

- Remplacement de l'algorithme de planification Leitner par FSRS (bibliothèque `ts-fsrs`, sans étapes d'apprentissage courtes, sans fuzz), derrière `mastery.ts`.
- La progression d'un mot dans un sens devient `{ stability, difficulty, reviewed, relearning }` au lieu de `{ level, reviewed }`.
- La réponse reste binaire : fausse = Again, juste = Good. La fonction de mise à jour accepte déjà une note (Again, Hard, Good, Easy) pour permettre plus tard une précision optionnelle Hard/Easy, sans changement d'interface dans ce change.
- Les paramètres de l'algorithme (poids FSRS par défaut, rétention cible 0,9) sont des constantes dans le code.
- Les 5 niveaux de maîtrise affichés sont conservés, mais dérivés de la stabilité par seuils (en jours : < 2, < 7, < 21, < 60, ≥ 60).
- L'échéance d'une carte se calcule à partir de la stabilité et de la rétention cible ; elle n'est pas stockée. Un mot réussi est à revoir au plus tôt le lendemain de sa révision.
- Une carte ratée est marquée « à retravailler » et reste à revoir le jour même (révision de la veille d'un contrôle) : elle est reposée plus tard dans la session jusqu'à être réussie, et, si la session est interrompue, proposée dans la prochaine session du jour. Les réessais de la session ne comptent pas comme révisions FSRS supplémentaires ni dans le bilan.
- La sélection des cartes à revoir classe désormais par rétrievabilité croissante (la carte la plus susceptible d'être oubliée d'abord) au lieu du retard en jours.
- **BREAKING** (format CSV) : les colonnes `maitrise_<a>_<b>` et `maitrise_<b>_<a>` contiennent `S:<stabilité>|D:<difficulté>` (ex. `S:12.4|D:5.3`, suivi de `|R:1` pour un sens à retravailler) à l'export. L'ancien format (entier de 1 à 5) reste lu à l'import et converti en stabilité/difficulté.
- Migration de la base locale (IndexedDB) : les progressions `{ level, reviewed }` déjà enregistrées sont converties au premier lancement.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `mastery-tracking` : modèle de progression (stabilité/difficulté), évolution après une réponse, niveaux dérivés de la stabilité, calcul de l'échéance, ordre de retard.
- `vocabulary-csv` : format des colonnes `maitrise_*`, lecture rétrocompatible de l'ancien format, validation, aller-retour export/import.
- `study-session` : sélection des cartes à revoir classées par rétrievabilité plutôt que par retard en jours ; réessai des cartes ratées dans la session ; bilan sur la première réponse.

## Impact

- Code : `src/domain/mastery.ts`, `model.ts`, `selection.ts`, `stats.ts`, `csv.ts`, `src/storage/db.ts` (migration Dexie v2), `src/ui/Session.svelte` (file de réessai, indication de réessai) et `Home.svelte` (adaptation mineure), tests unitaires et e2e associés, fichiers `samples/`, `README.md`.
- Dépendance ajoutée : `ts-fsrs`.
- Données existantes : migrées automatiquement en base locale ; les anciens CSV restent importables.
- Hors périmètre : choix Hard/Easy dans l'interface, optimisation personnalisée des poids (elle exigerait un historique des révisions), rétention cible réglable dans l'application, étapes d'apprentissage FSRS dans la journée (le réessai de session les remplace).
