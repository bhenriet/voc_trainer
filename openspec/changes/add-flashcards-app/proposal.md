# Proposition

## Pourquoi

Réviser du vocabulaire bilingue demande un outil simple, utilisable aussi bien sur PC que sur téléphone ou tablette, alimenté par une liste de mots que l'utilisateur gère lui-même dans un fichier CSV. Le projet est vide : ce changement crée la première version de l'application.

## Ce qui change

- Création d'une application web statique (sans serveur), responsive et installable (PWA), hébergée sur GitHub Pages (dépôt `voc_trainer`) et utilisable hors-ligne.
- Import d'un fichier CSV (séparateur `;` par défaut) contenant deux colonnes de langue obligatoires, dont les en-têtes nomment les langues (ex. `fr;en`), et des colonnes de progression optionnelles.
- L'import **remplace** l'intégralité du vocabulaire et de la progression présents dans le navigateur, après un avertissement chiffré et une confirmation.
- Export d'un CSV contenant le vocabulaire et la progression (colonnes `maitrise_<a>_<b>`, `maitrise_<b>_<a>`, `revu_<a>_<b>`, `revu_<b>_<a>`), servant de sauvegarde et de moyen de transfert entre appareils (par exemple via un drive cloud).
- Suivi de la maîtrise selon la méthode de Leitner : un état « Nouveau » puis 5 niveaux de maîtrise affichés avec des libellés (En apprentissage → Maîtrisé), séparément pour chaque sens d'étude.
- Progression enregistrée automatiquement dans le navigateur.
- Sessions de révision configurables : nombre de cartes et sens (A → B, B → A, mélangé).
- Réponse saisie au clavier, avec comparaison tolérante (casse, espaces, accents avec avertissement, réponses multiples séparées par `/`) et possibilité de corriger un faux négatif (« j'avais juste »).

Hors périmètre de cette version : colonnes de catégorie, fusion de progression entre appareils, synchronisation cloud directe, tolérance aux articles et aux fautes de frappe.

## Capacités

### Nouvelles capacités

- `vocabulary-csv`: format CSV d'échange, import (validation, remplacement avec avertissement) et export du vocabulaire avec sa progression.
- `mastery-tracking`: niveaux de maîtrise Leitner par mot et par sens, règles de montée/descente, intervalles de révision, persistance locale dans le navigateur.
- `study-session`: configuration d'une session (nombre de cartes, sens), sélection des cartes à réviser, saisie et vérification des réponses, bilan de session.
- `app-shell`: application web responsive, installable et utilisable hors-ligne.

### Capacités modifiées

Aucune (projet vierge).

## Impact

- Nouveau projet front-end : Vite, TypeScript, Svelte 5, PapaParse, Dexie (IndexedDB), vite-plugin-pwa, Vitest.
- Nouveau workflow GitHub Actions de build et de publication sur GitHub Pages.
- Prérequis de développement : Node.js 20.19 ou plus (Node 22 LTS recommandé) ; l'environnement actuel est en Node 18.19.
- Aucune donnée ne quitte l'appareil : pas de backend, pas de compte utilisateur.
