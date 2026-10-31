# Voc Trainer

Application web de flashcards pour réviser du vocabulaire bilingue, alimentée par un fichier CSV. Elle fonctionne dans le navigateur (PC, téléphone, tablette), s'installe sur l'écran d'accueil et marche hors-ligne. Aucune donnée ne quitte l'appareil.

Version publiée : https://bhenriet.github.io/voc_trainer/

## Format du fichier CSV

- Encodage UTF-8 (dans Excel : « CSV UTF-8 »), séparateur `;` par défaut (`,` au choix à l'import).
- La première ligne est un en-tête. Les deux premières colonnes sont les langues ; leur en-tête nomme la langue.
- Plusieurs réponses acceptées se séparent par `/` : `maison / foyer`.

```
fr;en
maison;house
élève;pupil / student
```

### Colonnes de progression (optionnelles)

Elles sont ajoutées par l'export et relues à l'import. Leur nom dérive des deux langues de l'en-tête ; leur position est libre.

| Colonne | Contenu |
|---|---|
| `maitrise_fr_en`, `maitrise_en_fr` | état de mémorisation dans ce sens, au format `S:<stabilité>\|D:<difficulté>` (ex. `S:12.4\|D:5.3`), suivi de `\|R:1` si le mot est à retravailler ; vide si jamais révisé |
| `revu_fr_en`, `revu_en_fr` | date de dernière révision `AAAA-MM-JJ` |

Ces valeurs ne sont pas faites pour être modifiées à la main. Un ancien fichier dont `maitrise_*` contient un entier de 1 à 5 reste importable : le niveau est converti.

### Planification des révisions (FSRS)

Les révisions sont planifiées avec l'algorithme [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) (bibliothèque `ts-fsrs`), avec une rétention cible de 90 %. Pour chaque mot et chaque sens, l'application suit une **stabilité** (en jours : le délai au bout duquel on a 90 % de chances de se souvenir du mot) et une **difficulté**. Une réponse juste est notée *Good*, une réponse fausse *Again*. Un mot réussi revient après un intervalle égal à sa stabilité (au moins 1 jour).

Une carte ratée est marquée « à retravailler » : elle reste à revoir **le jour même**, utile la veille d'un contrôle. Pendant la session, elle est reposée en fin de session (« Réessai ») jusqu'à être réussie ; si vous arrêtez avant, elle est proposée dans la prochaine session du jour. Seule la première réponse à une carte compte pour FSRS et pour le bilan.

Niveaux affichés, déduits de la stabilité : Nouveau (jamais révisé), 1 En apprentissage (moins de 2 jours), 2 Familier (moins de 7), 3 Bien connu (moins de 21), 4 Très bien connu (moins de 60), 5 Maîtrisé (60 jours ou plus).

Les autres colonnes sont ignorées et ne figurent pas dans l'export.

## Sauvegarde et transfert entre appareils

La progression est enregistrée automatiquement dans le navigateur. Le CSV sert de sauvegarde et de moyen de transfert :

1. **Exporter** sur l'appareil où vous avez révisé (le fichier contient vocabulaire et progression).
2. Déposer le fichier dans un drive (Google Drive, OneDrive…).
3. **Importer** ce fichier sur l'autre appareil.

L'import **remplace** tout le vocabulaire et toute la progression de l'appareil, après confirmation. Règle simple : on importe en arrivant, on exporte en partant.

Des fichiers d'exemple sont disponibles dans [`samples/`](samples/).

## Développement

Prérequis : Node.js 20.19 ou plus (`.nvmrc` : 22).

```bash
nvm use            # si vous utilisez nvm
npm install
npm run dev        # serveur de développement : http://localhost:5173/voc_trainer/
npm test           # tests unitaires (Vitest)
npm run check      # vérification des types (svelte-check + tsc)
npm run build      # build de production dans dist/
npm run preview    # sert dist/ : http://localhost:4173/voc_trainer/
```

Un seul fichier de test : `npx vitest run src/domain/csv.test.ts`.

### Tests de bout en bout (Playwright)

Les tests de `e2e/` pilotent le build de production dans Chromium, en bureau et en mobile 360 px (service worker et hors-ligne compris). Première installation :

```bash
npx playwright install chromium
sudo npx playwright install-deps chromium   # bibliothèques système (Linux/WSL)
```

```bash
npm run test:e2e                                  # build + vite preview sur le port 4174, puis tests
npx playwright test e2e/import.e2e.ts             # un seul fichier
npx playwright test --project=mobile-360          # un seul profil
npx playwright show-report                        # rapport HTML du dernier passage
```

### Organisation

- `src/domain/` : logique pure et testée (CSV, maîtrise Leitner, sélection des cartes, vérification des réponses, dates).
- `src/storage/` : persistance IndexedDB (Dexie).
- `src/ui/` : écrans Svelte 5 ; `src/App.svelte` bascule de l'un à l'autre.
- `openspec/` : spécifications et changements (OpenSpec).

### Publication

Chaque push sur `main` lance `.github/workflows/deploy.yml` (vérification des types, tests, build, publication sur GitHub Pages). Dans les réglages du dépôt, Pages doit avoir pour source « GitHub Actions ».
