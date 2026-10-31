# Proposal

## Why

Le vocabulaire se prépare le plus souvent dans Excel ou Google Sheets. Aujourd'hui, il faut l'enregistrer en CSV puis choisir le fichier, et tout import remplace l'intégralité du jeu de cartes et de sa progression. Il est donc impossible d'ajouter une leçon à un jeu existant sans tout réimporter, ni de coller simplement des cellules copiées depuis un tableur.

## What Changes

- Deux cas d'usage distincts, avec deux entrées sur l'accueil :
  - **Étudier un jeu de cartes** : comportement actuel (remplacement complet du vocabulaire et de la progression, avec avertissement chiffré si un jeu existe).
  - **Ajouter des cartes de vocabulaire** : ajoute de nouveaux mots au jeu existant, au niveau Nouveau, sans progression. Sur un vocabulaire vide, cette entrée crée un nouveau jeu.
- Chaque cas d'usage accepte deux sources : un fichier ou un texte collé depuis un tableur.
- La tabulation (séparateur des cellules copiées depuis Excel / Google Sheets) devient un séparateur reconnu ; elle est détectée automatiquement pour un texte collé.
- Ligne de titres des langues : obligatoire pour « Étudier un jeu de cartes » et pour « Ajouter » sur un vocabulaire vide ; en mode Ajouter sur un vocabulaire existant, une case « ma liste contient une colonne de titres » (décochée par défaut) indique si la première ligne est un titre. Les langues du jeu existant ne sont jamais modifiées ; si la case est cochée, la correspondance entre les langues soumises et celles du jeu est affichée à titre informatif.
- En mode Ajouter, les colonnes de progression éventuelles sont ignorées et signalées dans le récapitulatif.
- Les langues importées sont toujours affichées avant validation : le premier import n'est donc plus « sans confirmation ».
- Aucune gestion des doublons : chaque ligne ajoutée crée un nouveau mot.

Hors périmètre (changements ultérieurs) : gestion des doublons, nettoyage des lignes importées, mots à plusieurs traductions sur plusieurs lignes, fusion de progressions.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `vocabulary-csv`: séparateur tabulation et détection automatique, import par collage, nouveau mode « ajout » sans progression, règles sur la ligne de titres, confirmation du premier import, récapitulatif adapté.
- `app-shell`: accueil avec deux entrées d'import distinctes (« Étudier un jeu de cartes » et « Ajouter des cartes de vocabulaire »), y compris lorsqu'aucun vocabulaire n'est enregistré.

## Impact

- `src/domain/csv.ts` : type `Delimiter` étendu à la tabulation, détection du séparateur, lecture avec ou sans ligne de titres selon le mode.
- `src/storage/db.ts` : nouvelle opération d'ajout de mots au jeu existant, en une transaction.
- `src/ui/Import.svelte`, `src/ui/Home.svelte`, `src/App.svelte` : zone de collage, choix du mode par entrée d'accueil, case « colonne de titres », écran d'information avant validation.
- Tests unitaires (`csv.test.ts`, `db.test.ts`) et e2e (`e2e/import.e2e.ts`, `e2e/app-shell.e2e.ts`), README et exemples.
- Aucune nouvelle dépendance ; les données restent confinées à l'appareil.
