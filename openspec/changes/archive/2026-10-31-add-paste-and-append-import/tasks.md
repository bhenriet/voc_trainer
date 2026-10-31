# Tasks

## 1. Lecture : tabulation, détection et mode ajout (domaine)

- [x] 1.1 Étendre `Delimiter` à la tabulation et ajouter `detectDelimiter(text, fallback)` dans `src/domain/csv.ts` ; vérifier par des tests unitaires dans `csv.test.ts` (tabulation détectée sur la 1re ligne, repli sur le séparateur choisi sinon)
- [x] 1.2 Ajouter à `parse` l'option de mode (étude ou ajout), la ligne de titres facultative et les langues du jeu existant ; en ajout, ignorer la progression, signaler les colonnes de progression ignorées et exposer les titres soumis ; vérifier par des tests unitaires (ajout sans titres, ajout avec titres, progression ignorée, aucune ligne valide, ligne de titres invalide)
- [x] 1.3 Couvrir le texte de l'exemple de la demande (en-tête `Mot NL` / `Mot FR`, cellules séparées par des tabulations, point d'exclamation et accents) et un champ entre guillemets contenant une tabulation ; vérifier que ces tests unitaires passent

## 2. Stockage : ajout de mots

- [x] 2.1 Ajouter `appendWords(db, words)` dans `src/storage/db.ts` (une transaction, langues inchangées, `unsavedChanges` à `true`) ; vérifier par des tests dans `db.test.ts` (mots existants et progression intacts, nouveaux mots au niveau Nouveau, aucune déduplication)

## 3. Interface d'import

- [x] 3.1 Dans `src/ui/Import.svelte`, recevoir le mode d'import, ajouter le choix Fichier / Coller avec zone de texte, la tabulation dans les séparateurs et la détection automatique pour le collage ; vérifier dans l'app qu'un texte copié depuis un tableur est lu sans choisir de séparateur
- [x] 3.2 Ajouter la case « ma liste contient une colonne de titres » (décochée par défaut, visible uniquement en ajout sur un vocabulaire existant) et l'affichage de la correspondance des langues ; vérifier avec un test e2e (case cochée : correspondance `nl ↔ Mot NL` affichée, langues du jeu inchangées)
- [x] 3.3 Remplacer l'enregistrement direct du premier import par une étape de validation affichant langues et nombre de mots dans tous les modes, avec l'avertissement chiffré conservé pour le remplacement ; adapter le récapitulatif final (« N mots ajoutés ») ; vérifier avec des tests e2e (premier import validé, remplacement confirmé et annulé, ajout validé)

## 4. Accueil et câblage

- [x] 4.1 Dans `src/ui/Home.svelte` et `src/App.svelte`, remplacer les boutons d'import par « Étudier un jeu de cartes » et « Ajouter des cartes de vocabulaire » (avec ou sans vocabulaire), brancher `appendWords` pour le mode ajout ; vérifier avec `e2e/app-shell.e2e.ts` mis à jour (deux entrées visibles dans les deux états de l'accueil, ajout sans confirmation de remplacement)
- [x] 4.2 Mettre à jour `e2e/import.e2e.ts` et les helpers pour les nouveaux libellés et la validation du premier import, y compris les scénarios de collage ; vérifier que `npx playwright test` passe en entier

## 5. Documentation et vérification finale

- [x] 5.1 Mettre à jour le [README.md](README.md) (collage depuis Excel / Google Sheets, tabulation, deux cas d'usage, remplacement vs ajout sans progression, absence de gestion des doublons) ; vérifier que les exemples décrits fonctionnent tels quels
- [x] 5.2 Vérification d'intégration : lancer les tests unitaires, la vérification de types et les tests e2e, puis coller manuellement l'exemple de la demande en mode « Ajouter » sur un jeu vide, puis sur un jeu existant ; vérifier que tout passe et que le jeu contient 12 mots de plus

## Workflow follow-up

- Archiver le change une fois la revue terminée, puis vérifier les specs de référence à jour.
