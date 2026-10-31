# Design

## Context

L'import repose sur `parse(text, delimiter)` ([csv.ts](src/domain/csv.ts)), fonction pure qui lit la première ligne comme titres, détecte les colonnes de progression par leur nom et renvoie un `ImportSummary` (langues, mots, lignes ignorées, valeurs corrigées, colonnes ignorées). L'écran [Import.svelte](src/ui/Import.svelte) lit un fichier, appelle `parse`, demande confirmation si des mots existent, puis `replaceAll` ([db.ts](src/storage/db.ts)) vide et réécrit tout en une transaction. Les langues vivent dans une seule ligne `meta`. Voir proposal.md pour la motivation et le périmètre.

## Goals / Non-Goals

**Goals:**
- Réutiliser `parse` pour fichier et texte collé : une seule logique de lecture, de validation et de récapitulatif.
- Ajouter des mots sans toucher aux mots existants ni aux langues du jeu.
- Rendre le cas d'usage explicite dès l'accueil (remplacer ou ajouter).

**Non-Goals:**
- Déduplication, nettoyage des lignes, mots à plusieurs traductions, fusion de progressions : changements ultérieurs.
- Aucune migration de schéma IndexedDB : un ajout ne nécessite pas de nouvelle version.

## Decisions

**1. Un mode d'import passé à l'écran, fixé par l'entrée d'accueil.** `Import` reçoit `mode: 'study' | 'append'` ; l'accueil expose deux boutons (« Étudier un jeu de cartes », « Ajouter des cartes de vocabulaire ») plutôt qu'un sélecteur dans l'écran. L'intention est posée avant la saisie et le mode destructeur n'est jamais celui par défaut. *Alternative* : une entrée unique avec choix du mode à l'écran, écartée car elle mélange mode et source sur un même écran.

**2. `parse` gagne une option `headerRow`, sans changer son contrat de pureté.** `parse(text, delimiter, { headerRow: true })` conserve le comportement actuel. Avec `headerRow: false` (ajout, case décochée), toutes les lignes sont des données et les langues retournées sont celles passées par l'appelant. L'appelant fournit aussi les langues du jeu existant pour l'ajout, de sorte que `ImportSummary.languages` soit toujours celles qui seront enregistrées. *Alternative* : un second parseur pour l'ajout, écartée car elle dupliquerait la validation.

**3. En ajout avec titres cochés, les titres soumis sont exposés à côté des langues du jeu.** `ImportSummary` porte `submittedLanguages` (nullable) pour que l'UI affiche la correspondance `nl ↔ Mot NL`, uniquement informative et jamais utilisée à l'enregistrement. Les validations existantes sur l'en-tête (au moins deux colonnes, langues non vides et distinctes) s'appliquent encore à la ligne de titres cochée.

**4. La progression est ignorée en ajout au niveau du résultat de lecture.** En mode `append`, `parse` ne lit pas `maitrise_*` / `revu_*` : tous les mots sortent avec `ab: null, ba: null`. Les colonnes de progression de la ligne de titres (repérées par le préfixe `maitrise_` / `revu_`, quelles que soient les langues soumises) sont listées dans `ignoredProgressColumns`, distinct de `ignoredColumns` : le message n'est pas « absentes de l'export » mais « progression non importée ». Sans ligne de titres, seules les deux premières colonnes sont lues.

**5. Détection du séparateur du texte collé.** `Delimiter` devient `';' | ',' | '\t'`. Une fonction pure `detectDelimiter(text, fallback)` renvoie `'\t'` si la première ligne contient une tabulation, sinon le séparateur choisi. Elle ne s'applique qu'à la source « collage » ; pour un fichier, le choix de l'utilisateur prime (la tabulation est proposée en plus de `;` et `,`). *Alternative* : détecter aussi pour les fichiers, écartée pour ne pas changer silencieusement la lecture d'un CSV existant dont un champ contiendrait une tabulation.

**6. Une transaction d'ajout dédiée.** `appendWords(db, words)` ajoute les mots (`bulkAdd`) en une transaction et ne touche pas à `meta.languages` ; elle marque `unsavedChanges: true` pour inviter à exporter. Sans vocabulaire existant, l'ajout appelle `replaceAll` avec les langues de la ligne de titres (la création d'un jeu est identique à un premier import).

**7. Une étape de prévisualisation commune.** Après lecture réussie, l'écran affiche toujours un récapitulatif avec un bouton de validation, quel que soit le mode : langues, nombre de mots, lignes ignorées, valeurs corrigées, colonnes ignorées, correspondance des langues le cas échéant. Le libellé et la couleur du bouton dépendent du mode (« Remplacer » en danger avec l'avertissement chiffré si un jeu existe, « Ajouter » ou « Importer » sinon). Le premier import ne se fait donc plus sans validation.

**8. Source : fichier ou collage dans l'écran d'import.** Un sélecteur à deux onglets (Fichier, Coller) alimente la même fonction `read()`. Le collage lit le contenu d'une `<textarea>` au clic sur un bouton « Lire », sans lecture à chaque frappe.

## Risks / Trade-offs

- [Colonnes inversées en ajout sans titres : les mots sont enregistrés dans le mauvais sens sans que rien ne le signale] → Choix assumé du produit ; la case « colonne de titres » avec correspondance affichée l'atténue. Le texte de l'écran indique que la colonne 1 est la langue A du jeu et la colonne 2 la langue B.
- [Doublons : un ajout répété duplique les mots] → Hors périmètre, documenté dans la proposition ; le récapitulatif affiche le nombre de mots ajoutés et le nouveau total pour que l'utilisateur le voie.
- [Une cellule collée contenant une tabulation ou un retour à la ligne est mal découpée] → Papaparse gère les champs entre guillemets, ce que Sheets et Excel produisent pour de tels contenus ; couvert par un test.
- [Accents et espaces insécables à la copie] → Aucun nettoyage dans cette version (le nettoyage des lignes est un changement ultérieur).

## Migration Plan

Aucune migration de données : schéma et formats d'export inchangés. Retour arrière possible par simple revert du code ; les mots ajoutés restent des mots ordinaires du jeu.
