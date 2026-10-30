# Design

## Contexte

Projet vierge (voir proposal.md). Contraintes qui orientent l'approche :

- Aucun serveur : l'application est un ensemble de fichiers statiques publiés sur GitHub Pages (HTTPS, sous-chemin `/<nom-du-dépôt>/`).
- Cibles : navigateurs PC et mobiles, dont Safari iOS, qui ne permet pas de réécrire un fichier local → le CSV est un format d'échange, la source de vérité au quotidien est le stockage du navigateur.
- L'environnement de développement actuel est en Node 18.19, trop ancien pour l'outillage retenu.

## Objectifs / Non-objectifs

**Objectifs :**
- Isoler la logique métier (CSV, Leitner, sélection, vérification des réponses) dans des modules TypeScript purs, sans dépendance à l'UI ni au stockage, entièrement testés par Vitest.
- Garder l'UI mince : quelques écrans, sans routeur ni gestionnaire d'état externe.
- Rendre l'ajout futur de colonnes de catégorie possible sans changer le modèle de stockage en profondeur.

**Non-objectifs :**
- Tests de bout en bout dans un navigateur (vérification manuelle sur PC et téléphone pour la v1).
- Internationalisation de l'interface : elle est en français.
- Plusieurs paquets de vocabulaire simultanés : un seul vocabulaire à la fois.

## Décisions

### 1. Stack : Vite + TypeScript + Svelte 5

L'application compte environ cinq écrans ; Svelte 5 offre la réactivité nécessaire avec peu de code et un bundle léger, ce qui compte sur mobile.
- *Alternatives* : JS natif (zéro dépendance, mais gestion d'écrans et d'état verbeuse) ; React/Preact (plus de cérémonie pour le même résultat). Aucun existant ne contraint le choix.

### 2. Architecture en couches

```
  src/
  +-- domain/          logique pure, testée (aucun import Svelte/Dexie)
  |   +-- csv.ts         parse(texte, séparateur) -> Résultat d'import
  |   |                  serialize(vocabulaire) -> texte CSV
  |   +-- mastery.ts     appliquer(progression, juste, aujourd'hui)
  |   |                  échéance(progression), estÀRevoir, retard
  |   +-- selection.ts   sélectionner(cartes, n, sens, aujourd'hui, aléa)
  |   +-- answer.ts      vérifier(saisie, attendu) -> juste | accents | faux
  |   +-- dates.ts       jour local "AAAA-MM-JJ", écart en jours
  +-- storage/
  |   +-- db.ts          Dexie : remplacerTout, enregistrerRéponse, lire
  +-- ui/              composants Svelte par écran
  |   +-- Accueil, Import, ConfigSession, Carte, Bilan
  +-- App.svelte       bascule entre écrans via un état local
```

Les fonctions du domaine reçoivent « aujourd'hui » et la source d'aléa en paramètre, ce qui rend les tests déterministes.
- *Alternative* : logique dans les composants — rejetée, intestable sans navigateur.

### 3. Modèle de données

```
  Vocabulaire (méta)   { langueA: "fr", langueB: "en",
                         importéLe, dernierExport, modifiéDepuisExport }
  Mot                  { id, a: "maison", b: "house",
                         ab: Progression | null, ba: Progression | null }
  Progression          { niveau: 1..5, revu: "AAAA-MM-JJ" }
  Carte (calculée)     { motId, sens: "ab" | "ba" }
```

`null` représente « Nouveau ». Les dates sont des jours calendaires locaux (chaînes `AAAA-MM-JJ`), jamais des horodatages : cela évite les décalages de fuseau et correspond exactement au format CSV.
- *Alternative* : une ligne par carte (mot × sens) — rejetée, l'import/export et la contrainte « pas deux fois le même mot » se raisonnent par mot.

### 4. Stockage : IndexedDB via Dexie

Deux tables : `meta` (une entrée) et `mots`. L'import remplace tout dans **une seule transaction** (`clear` + `bulkAdd`) : un import interrompu ne laisse jamais un état mixte. Chaque réponse validée est écrite immédiatement (`update` du mot + `meta.modifiéDepuisExport = true`).
Au démarrage, l'application appelle `navigator.storage.persist()` pour limiter le risque d'éviction par le navigateur.
- *Alternative* : `localStorage` — plus simple, mais synchrone, limité (~5 Mo) et plus exposé à l'éviction ; Dexie reste léger.

### 5. CSV : PapaParse

PapaParse gère les guillemets, les séparateurs dans les champs, le BOM et les fins de ligne Windows. Le domaine `csv.ts` l'enveloppe : il identifie les colonnes de langue (positions 0 et 1) et les colonnes de progression par leur nom, valide les valeurs et produit un résultat `{ vocabulaire, lignesIgnorées, valeursCorrigées, colonnesIgnorées }` ou une erreur bloquante.
L'export préfixe le BOM UTF-8 pour qu'Excel affiche correctement les accents, et utilise le séparateur `;`. Le téléchargement passe par un `Blob` + lien `download`, qui fonctionne sur tous les navigateurs ciblés (sur iOS, le fichier est proposé à l'enregistrement dans Fichiers).
- *Alternative* : parseur maison — rejeté, les cas limites du CSV sont nombreux.

### 6. Vérification des réponses

```
  normaliser(s)  = trim, espaces multiples -> 1, minuscules (locale-insensible)
  sansAccents(s) = normaliser(s).normalize("NFD") sans les marques \p{M}
  attendus       = valeur.split("/").map(trim)

  si normaliser(saisie) ∈ normaliser(attendus)       -> JUSTE
  sinon si sansAccents(saisie) ∈ sansAccents(attendus) -> JUSTE_ACCENTS (+ orthographe attendue)
  sinon                                               -> FAUX
```

La saisie est aussi normalisée en NFC avant comparaison, car les claviers mobiles peuvent produire des formes décomposées.

### 7. Sélection des cartes

1. Construire les cartes candidates selon le sens choisi (en mélangé : les deux sens).
2. Séparer `àRevoir` (triées par retard décroissant, égalités départagées aléatoirement) et `nouvelles` (ordre aléatoire).
3. Prendre dans `àRevoir` puis `nouvelles` jusqu'à N, en écartant en mélangé toute carte dont le mot est déjà retenu.
4. Mélanger l'ordre de présentation.

Les cartes ratées ne sont pas reposées dans la même session (une carte = une question) : au niveau 1, elles sont de nouveau dues dès la session suivante.

### 8. Configuration de session par défaut

Valeurs proposées à l'ouverture : 20 cartes, sens A→B. Les derniers choix sont mémorisés dans `localStorage` (confort par appareil, perte sans conséquence).

### 9. PWA : vite-plugin-pwa

Mode `generateSW` avec pré-cache de tous les fichiers du build ; `registerType: "autoUpdate"` pour que la nouvelle version soit prise en compte au chargement suivant. Manifeste avec `start_url` et `scope` relatifs au sous-chemin GitHub Pages, et icônes 192/512 px. Les données étant dans IndexedDB, une mise à jour du code ne les touche pas.

### 10. Déploiement : GitHub Actions → GitHub Pages

Workflow sur `push` vers `main` : `npm ci`, `npm test`, `npm run build`, puis publication du dossier `dist` via les actions officielles `upload-pages-artifact` et `deploy-pages`. Le dépôt s'appelle `voc_trainer` : Vite est configuré avec `base: "/voc_trainer/"` et l'application est servie sur `https://<compte>.github.io/voc_trainer/`. Le runner utilise Node 22, indépendamment du poste local.

### 11. Version de Node

Le projet déclare `"engines": { "node": ">=20.19" }` et un fichier `.nvmrc` à `22`. Le passage du poste à Node 22 est un prérequis manuel, fait par l'utilisateur.

## Risques / Compromis

- [Éviction des données par le navigateur, notamment Safari iOS après une longue inactivité] → demande de stockage persistant, rappel de sauvegarde avec date du dernier export (spec app-shell).
- [Écrasement accidentel d'une progression par import d'un fichier plus ancien] → avertissement chiffré avant remplacement ; la fusion est reportée à une version ultérieure, préparée par les colonnes `revu_*`.
- [Colonnes non reconnues perdues à l'export] → avertissement explicite à l'import ; acceptable tant que les catégories ne sont pas gérées.
- [Excel ré-enregistre parfois un CSV dans un autre encodage ou avec `,`] → choix du séparateur à l'import ; en-têtes sans accents pour rester reconnaissables. Un fichier ré-encodé en ANSI peut afficher des accents abîmés dans les mots : limite documentée dans l'accueil.
- [Faux négatifs de la vérification stricte (synonymes, articles)] → bouton « j'avais juste » et réponses multiples `/` dans le CSV.
- [Clavier virtuel masquant la carte sur mobile] → mise en page avec la carte en haut et le champ juste en dessous, `scrollIntoView` au focus.

## Plan de déploiement

1. Créer le dépôt GitHub et activer GitHub Pages en source « GitHub Actions ».
2. Pousser sur `main` : le workflow teste, construit et publie.
3. Retour arrière : re-pousser une version antérieure (revert) ; les données utilisateur ne sont pas affectées.

## Questions ouvertes

- Icône et couleurs de l'application.
