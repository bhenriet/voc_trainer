# Tâches

## 1. Mise en place du projet

- [x] 1.1 Vérifier que `node --version` affiche une version ≥ 20.19 (prérequis : l'utilisateur installe Node 22 LTS, par exemple via nvm) ; sinon s'arrêter et le signaler
- [x] 1.2 Initialiser le dépôt git et créer le projet Vite + Svelte 5 + TypeScript à la racine (sans écraser `openspec/` ni `.claude/`) ; vérifier que `npm run dev` sert la page par défaut
- [x] 1.3 Ajouter les dépendances PapaParse, Dexie, vite-plugin-pwa et Vitest, le champ `engines` (`>=20.19`), `.nvmrc` (`22`) et un `.gitignore` ; vérifier que `npm install` puis `npm test` (zéro test) réussissent
- [x] 1.4 Créer l'arborescence `src/domain`, `src/storage`, `src/ui` décrite dans design.md et vérifier que `npm run build` réussit

## 2. Domaine : dates et maîtrise

- [x] 2.1 Implémenter `domain/dates.ts` (jour local `AAAA-MM-JJ`, écart en jours, ajout de jours) et vérifier par des tests Vitest les passages de mois et d'année
- [x] 2.2 Implémenter `domain/mastery.ts` : évolution du niveau (juste : +1 plafonné à 5, Nouveau → 1 ; faux : 1), intervalles 0/1/3/7/14 jours, `estÀRevoir` et `retard` ; vérifier par des tests reprenant chaque scénario de la spec mastery-tracking
- [x] 2.3 Définir les libellés des niveaux (Nouveau, En apprentissage, Familier, Bien connu, Très bien connu, Maîtrisé) et vérifier par un test le libellé de chaque état

## 3. Domaine : CSV

- [x] 3.1 Implémenter `domain/csv.ts` `parse` : en-tête, langues A/B, colonnes de progression repérées par nom, séparateur paramétrable ; vérifier par des tests les scénarios « fichier minimal », « avec progression », « BOM » et « champ contenant le séparateur »
- [x] 3.2 Ajouter la validation à `parse` (moins de deux colonnes, aucune ligne valide, ligne incomplète, valeur de progression invalide, colonnes non reconnues) avec les compteurs du récapitulatif ; vérifier par un test par scénario de la spec vocabulary-csv
- [x] 3.3 Implémenter `serialize` (en-tête dérivé des langues, cellules vides pour un sens Nouveau, `;`, BOM) et le nom de fichier `vocabulaire_<a>_<b>_<date>.csv` ; vérifier par un test d'aller-retour `serialize` → `parse` sans perte

## 4. Domaine : sélection et vérification des réponses

- [x] 4.1 Implémenter `domain/selection.ts` (priorité aux cartes à revoir par retard décroissant, complément en Nouvelles, aucune carte non échue, pas de doublon de mot en mélangé, ordre aléatoire injecté) ; vérifier par des tests chaque scénario « Sélection des cartes » et « Sens mélangé » de la spec study-session
- [x] 4.2 Implémenter `domain/answer.ts` (normalisation NFC, casse, espaces, réponses multiples `/`, résultat juste / juste-accents / faux) ; vérifier par des tests chaque scénario « Vérification de la réponse » et « Tolérance aux accents »

## 5. Stockage

- [x] 5.1 Implémenter `storage/db.ts` avec Dexie (tables `meta` et `mots`, `remplacerTout` en une transaction, `enregistrerRéponse`, lecture, marquage export) et vérifier par des tests Vitest avec `fake-indexeddb` qu'un import remplace tout et qu'une réponse est persistée
- [x] 5.2 Appeler `navigator.storage.persist()` au démarrage et vérifier dans les outils de développement du navigateur que le stockage est marqué persistant (Chrome)

## 6. Interface : accueil, import et export

- [x] 6.1 Créer `App.svelte` et la navigation par état entre écrans ; vérifier que l'accueil s'affiche avec `npm run dev`
- [x] 6.2 Écran d'accueil sans vocabulaire (invitation à importer, exemple `fr;en` / `maison;house`, note sur l'encodage UTF-8) ; vérifier visuellement au premier lancement
- [x] 6.3 Écran d'import (choix du fichier, séparateur `;` par défaut ou `,`, récapitulatif, erreurs bloquantes, avertissement chiffré de remplacement avec confirmation/annulation) ; vérifier manuellement chaque scénario « Import » de la spec vocabulary-csv avec des fichiers d'exemple placés dans `samples/`
- [x] 6.4 Accueil avec vocabulaire : tableau de progression par sens et par niveau, nombre de mots à revoir, date du dernier export et rappel de sauvegarde ; vérifier qu'après une révision le rappel apparaît et disparaît après un export
- [x] 6.5 Bouton d'export (téléchargement du CSV, mise à jour de la date du dernier export) ; vérifier en réimportant le fichier téléchargé que vocabulaire et progression sont identiques

## 7. Interface : session de révision

- [x] 7.1 Écran de configuration (nombre de cartes ≥ 1, sens A→B / B→A / Mélangé avec les noms de langue, mémorisation des derniers choix dans `localStorage`, messages « pas assez de cartes » et « rien à réviser » avec la prochaine date) ; vérifier manuellement chaque scénario « Configuration » de la spec study-session
- [x] 7.2 Écran carte (mot posé, champ avec focus automatique, validation par Entrée ou bouton, indicateur « n / N ») ; vérifier qu'une réponse vide est comptée fausse
- [x] 7.3 Retour après réponse (juste, juste avec « attention aux accents », faux avec réponse attendue, bouton « j'avais juste », passage à la carte suivante par Entrée ou bouton) avec enregistrement immédiat de la progression ; vérifier qu'un rechargement en cours de session conserve les réponses validées
- [x] 7.4 Interruption de session et écran de bilan (justes, fausses, liste des cartes ratées avec réponse attendue) ; vérifier sur une session de 10 cartes que les compteurs sont exacts, y compris avec une correction « j'avais juste »

## 8. Responsive et PWA

- [x] 8.1 Mise en page responsive dès 360 px (zones tactiles, carte visible au-dessus du clavier virtuel) ; vérifier dans l'émulation mobile du navigateur à 360 px sans défilement horizontal
- [x] 8.2 Configurer vite-plugin-pwa (manifeste, icônes 192/512, pré-cache, `autoUpdate`, `base` du sous-chemin GitHub Pages) ; vérifier avec `npm run build && npm run preview` que l'application se recharge hors-ligne et que Lighthouse la déclare installable

## 9. Publication

- [x] 9.1 Ajouter le workflow GitHub Actions (Node 22, `npm ci`, `npm test`, `npm run build`, publication sur Pages) et vérifier qu'il passe sur une branche de test ou en local avec `npm ci && npm test && npm run build`
- [x] 9.2 Rédiger le README (format CSV, colonnes de progression, sauvegarde/transfert via export, commandes de développement, prérequis Node) et vérifier que les commandes documentées fonctionnent telles qu'écrites

## 10. Vérification d'ensemble

- [x] 10.1 Parcours complet sur PC : import d'un CSV d'exemple, session mélangée, export, réimport ; vérifier que la progression est conservée
- [x] 10.2 Parcours sur téléphone (application publiée) : installation sur l'écran d'accueil, import du CSV exporté depuis le PC via un drive, révision hors-ligne ; vérifier que la progression importée correspond à celle du PC
- [x] 10.3 Vérifier qu'aucune requête réseau ne transmet de vocabulaire (onglet Réseau pendant import et révision) et que `openspec validate add-flashcards-app --strict` réussit

## Suivi du workflow

- Créer le dépôt GitHub `voc_trainer`, le relier au dépôt local et activer Pages (source « GitHub Actions »).
- Archiver le changement avec `/opsx:archive` une fois la v1 validée.
