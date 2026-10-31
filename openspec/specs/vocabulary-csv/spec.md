# vocabulary-csv Specification

## Purpose

Définit le format CSV d'échange du vocabulaire et de sa progression, ainsi que l'import et l'export qui servent de sauvegarde et de transfert entre appareils.

## Requirements

### Requirement: Format CSV du vocabulaire
Le système MUST lire un CSV encodé en UTF-8 avec une ligne d'en-tête. Les deux premières colonnes sont les langues A et B, nommées par leur en-tête (ex. `fr`, `en`). Les colonnes de progression `maitrise_<a>_<b>`, `maitrise_<b>_<a>`, `revu_<a>_<b>`, `revu_<b>_<a>` sont optionnelles et repérées par leur nom, quelle que soit leur position. Une cellule `maitrise_*` vaut `S:<stabilité>|D:<difficulté>[|R:1]` (`R:1` : à retravailler) ; un entier de 1 à 5 (ancien format) est accepté.

#### Scenario: Fichier minimal à deux colonnes
- **WHEN** l'utilisateur importe un fichier dont l'en-tête est `fr;en` suivi de lignes `maison;house`
- **THEN** le système crée un mot par ligne, avec la langue A nommée `fr` et la langue B nommée `en`
- **AND** chaque mot est au niveau Nouveau dans les deux sens

#### Scenario: Fichier avec progression
- **WHEN** l'utilisateur importe un fichier dont l'en-tête est `fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr` et une ligne `maison;house;S:12.4|D:5.3;S:1.5|D:6.1;2026-10-28;2026-10-20`
- **THEN** le mot `maison`/`house` a une stabilité de 12,4 et une difficulté de 5,3 dans le sens fr→en, révisé le 2026-10-28
- **AND** une stabilité de 1,5 et une difficulté de 6,1 dans le sens en→fr, révisé le 2026-10-20

#### Scenario: Sens à retravailler
- **WHEN** l'utilisateur importe une cellule `maitrise_fr_en` valant `S:0.8|D:6.1|R:1` avec une date `revu_fr_en` valide
- **THEN** le mot est « à retravailler » dans le sens fr→en et est à revoir dès sa date de révision

#### Scenario: Ancien format de maîtrise
- **WHEN** l'utilisateur importe un fichier dont une cellule `maitrise_fr_en` vaut `3` avec une date `revu_fr_en` valide
- **THEN** le mot est converti en stabilité et difficulté et reste au niveau 3 dans le sens fr→en, avec la même date de révision

#### Scenario: Fichier avec marque d'ordre des octets
- **WHEN** le fichier commence par un BOM UTF-8
- **THEN** le BOM est ignoré et le premier en-tête est lu correctement

#### Scenario: Champ contenant le séparateur
- **WHEN** un champ entre guillemets contient le séparateur, par exemple `"garder (un objet; un secret)";keep`
- **THEN** le champ est lu comme une seule valeur `garder (un objet; un secret)`

### Requirement: Choix du séparateur à l'import
Le système MUST proposer le point-virgule `;` comme séparateur par défaut pour un fichier et permettre de choisir la virgule `,` ou la tabulation avant l'import. Pour un texte collé, le système MUST détecter automatiquement la tabulation lorsque la première ligne en contient, et sinon utiliser le séparateur choisi.

#### Scenario: Séparateur par défaut
- **WHEN** l'utilisateur importe un fichier sans changer le séparateur
- **THEN** le fichier est lu avec le séparateur `;`

#### Scenario: Séparateur virgule
- **WHEN** l'utilisateur choisit `,` puis importe un fichier `fr,en` / `chien,dog`
- **THEN** le mot `chien`/`dog` est importé

#### Scenario: Séparateur tabulation choisi
- **WHEN** l'utilisateur choisit la tabulation puis importe un fichier dont les colonnes sont séparées par des tabulations
- **THEN** les mots sont importés

#### Scenario: Détection de la tabulation à la copie
- **WHEN** l'utilisateur colle des cellules copiées depuis un tableur, dont la première ligne contient une tabulation
- **THEN** le texte est lu avec la tabulation, sans que l'utilisateur ait à choisir un séparateur

### Requirement: Validation du fichier importé
Le système MUST refuser un fichier inutilisable sans modifier les données existantes, et MUST signaler les lignes ignorées.

#### Scenario: Moins de deux colonnes
- **WHEN** l'en-tête du fichier contient moins de deux colonnes
- **THEN** l'import est refusé avec un message indiquant qu'il faut au moins deux colonnes de langue
- **AND** le vocabulaire et la progression existants sont inchangés

#### Scenario: Aucune ligne de vocabulaire valide
- **WHEN** le fichier ne contient aucune ligne dont les deux colonnes de langue sont renseignées
- **THEN** l'import est refusé avec un message explicite
- **AND** le vocabulaire et la progression existants sont inchangés

#### Scenario: Ligne incomplète
- **WHEN** une ligne a une colonne de langue vide
- **THEN** la ligne est ignorée
- **AND** le récapitulatif d'import indique le nombre de lignes ignorées

#### Scenario: Valeur de progression invalide
- **WHEN** une valeur `maitrise_*` n'est ni `S:<nombre>|D:<nombre>` (éventuellement suivi de `|R:1`) avec une stabilité strictement positive et une difficulté entre 1 et 10, ni un entier de 1 à 5, ou une valeur `revu_*` n'est pas une date `AAAA-MM-JJ`
- **THEN** la progression de ce mot dans ce sens est considérée comme absente (niveau Nouveau)
- **AND** le récapitulatif d'import indique le nombre de valeurs corrigées

#### Scenario: Colonnes non reconnues
- **WHEN** le fichier contient des colonnes autres que les colonnes de langue et de progression
- **THEN** ces colonnes sont ignorées
- **AND** l'utilisateur est averti qu'elles ne figureront pas dans l'export

### Requirement: Import par remplacement avec avertissement
Le cas d'usage « Étudier un jeu de cartes » MUST remplacer l'intégralité du vocabulaire et de la progression enregistrés dans le navigateur, après avoir affiché les langues et le nombre de mots lus. Si des données existent déjà, le système MUST afficher un avertissement chiffré et attendre une confirmation explicite avant de remplacer.

#### Scenario: Premier import
- **WHEN** aucun vocabulaire n'est enregistré et l'utilisateur choisit d'étudier un jeu de cartes avec une liste valide
- **THEN** le système affiche les langues et le nombre de mots lus, puis enregistre le vocabulaire après validation
- **AND** un récapitulatif indique le nombre de mots importés

#### Scenario: Import sur des données existantes confirmé
- **WHEN** 230 mots sont enregistrés et l'utilisateur importe un fichier valide de 250 mots pour étudier un jeu de cartes
- **THEN** le système affiche un avertissement indiquant que les 230 mots et leur progression seront remplacés par les 250 mots du fichier
- **AND** après confirmation, seuls les 250 mots du fichier et leur progression sont enregistrés

#### Scenario: Import sur des données existantes annulé
- **WHEN** l'utilisateur annule l'avertissement de remplacement
- **THEN** le vocabulaire et la progression existants sont inchangés

### Requirement: Export du vocabulaire et de la progression
Le système MUST permettre de télécharger un CSV contenant tous les mots et leur progression dans les deux sens, au format défini ci-dessus (colonnes `maitrise_*` au format `S:<stabilité>|D:<difficulté>`, avec `|R:1` pour un sens à retravailler), avec le séparateur `;`, encodé en UTF-8 avec BOM. Un fichier exporté MUST pouvoir être réimporté sans perte de vocabulaire ni de progression.

#### Scenario: Contenu de l'export
- **WHEN** l'utilisateur exporte un vocabulaire `fr`/`en`
- **THEN** le fichier a pour en-tête `fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr`
- **AND** contient une ligne par mot ; les cellules `maitrise_*` et `revu_*` sont vides pour un sens jamais révisé
- **AND** les cellules `maitrise_*` des sens révisés ont la forme `S:<stabilité>|D:<difficulté>`, suivie de `|R:1` pour un sens à retravailler

#### Scenario: Aller-retour export / import
- **WHEN** l'utilisateur exporte puis réimporte le fichier sur un autre appareil
- **THEN** l'autre appareil possède le même vocabulaire, les mêmes stabilités et difficultés (aux arrondis d'export près), les mêmes marques « à retravailler » et les mêmes dates de révision

#### Scenario: Nom du fichier exporté
- **WHEN** l'utilisateur exporte le 2026-10-29
- **THEN** le nom de fichier proposé contient les deux langues et la date, par exemple `vocabulaire_fr_en_2026-10-29.csv`

#### Scenario: Export sans vocabulaire
- **WHEN** aucun vocabulaire n'est enregistré
- **THEN** l'export n'est pas proposé

### Requirement: Import par collage
Le système MUST permettre d'importer le vocabulaire en collant dans une zone de texte des cellules copiées depuis un tableur (Excel, Google Sheets), en alternative à la sélection d'un fichier. Le texte collé suit les mêmes règles de lecture, de validation et de récapitulatif qu'un fichier, quel que soit le cas d'usage.

#### Scenario: Collage depuis un tableur
- **WHEN** l'utilisateur colle les cellules copiées `Mot NL`, `Mot FR` puis `Goeiedag!`, `Bonjour !` (séparées par des tabulations, une ligne par mot)
- **THEN** le système lit les lignes comme du vocabulaire, avec les langues nommées `Mot NL` et `Mot FR`

#### Scenario: Texte collé sans ligne exploitable
- **WHEN** l'utilisateur valide une zone de texte vide ou ne contenant aucune ligne dont les deux colonnes sont renseignées
- **THEN** l'import est refusé avec un message explicite
- **AND** le vocabulaire et la progression existants sont inchangés

### Requirement: Ligne de titres des langues
Lorsque l'import crée ou remplace le jeu de cartes, la première ligne MUST être une ligne de titres nommant les deux langues. Lors d'un ajout à un vocabulaire existant, la première ligne n'est un titre que si l'utilisateur coche la case « ma liste contient une colonne de titres », décochée par défaut.

#### Scenario: Titres obligatoires pour un nouveau jeu
- **WHEN** l'utilisateur importe sans vocabulaire enregistré, ou choisit d'étudier un jeu de cartes
- **THEN** la première ligne est lue comme titres des langues, sans case à cocher

#### Scenario: Ajout sans titres
- **WHEN** l'utilisateur ajoute à un vocabulaire existant `nl`/`fr` une liste dont la première ligne est `Goeiedag!` / `Bonjour !` et laisse la case décochée
- **THEN** cette première ligne est ajoutée comme un mot, la colonne 1 correspondant à la langue `nl` et la colonne 2 à la langue `fr`

#### Scenario: Ajout avec titres
- **WHEN** l'utilisateur coche la case et ajoute une liste dont la première ligne est `Mot NL` / `Mot FR` à un vocabulaire `nl`/`fr`
- **THEN** la première ligne n'est pas ajoutée comme un mot
- **AND** le système affiche la correspondance `nl` ↔ `Mot NL` et `fr` ↔ `Mot FR` avant validation, à titre informatif
- **AND** les langues du vocabulaire existant restent `nl` et `fr`

### Requirement: Ajout de vocabulaire sans progression
Le système MUST permettre d'ajouter des mots à un jeu de cartes existant, ou d'en créer un lorsqu'aucun vocabulaire n'est enregistré. Les mots ajoutés MUST être au niveau Nouveau dans les deux sens, la progression et les colonnes de progression éventuelles du texte importé étant ignorées. Les mots existants et leur progression MUST rester inchangés, et aucune déduplication n'est faite.

#### Scenario: Ajout à un jeu existant
- **WHEN** 230 mots sont enregistrés et l'utilisateur ajoute une liste valide de 12 lignes
- **THEN** le jeu contient 242 mots et les 230 mots d'origine conservent leur progression
- **AND** les 12 mots ajoutés sont au niveau Nouveau dans les deux sens
- **AND** le récapitulatif indique 12 mots ajoutés

#### Scenario: Mot déjà présent
- **WHEN** l'utilisateur ajoute une ligne `Hallo!` / `Salut !` alors qu'un mot identique existe déjà
- **THEN** une nouvelle ligne est ajoutée, sans fusion ni avertissement de doublon

#### Scenario: Progression ignorée à l'ajout
- **WHEN** l'utilisateur ajoute un fichier contenant des colonnes `maitrise_*` et `revu_*`
- **THEN** les mots sont ajoutés au niveau Nouveau
- **AND** le récapitulatif indique que les colonnes de progression sont ignorées

#### Scenario: Création d'un jeu par ajout
- **WHEN** aucun vocabulaire n'est enregistré et l'utilisateur ajoute une liste valide avec sa ligne de titres `nl`/`fr`
- **THEN** un jeu de cartes `nl`/`fr` est créé avec les mots de la liste, au niveau Nouveau

#### Scenario: Ajout sans ligne valide
- **WHEN** la liste ne contient aucune ligne dont les deux colonnes sont renseignées
- **THEN** l'ajout est refusé avec un message explicite
- **AND** le vocabulaire existant est inchangé

### Requirement: Langues affichées avant validation
Avant d'enregistrer un import, quel que soit le cas d'usage, le système MUST afficher les langues qui seront utilisées et le nombre de mots lus, puis attendre une validation de l'utilisateur.

#### Scenario: Premier import avec validation
- **WHEN** aucun vocabulaire n'est enregistré et l'utilisateur fournit une liste valide dont la ligne de titres est `nl`/`fr`
- **THEN** le système affiche les langues `nl` ↔ `fr` et le nombre de mots lus
- **AND** n'enregistre le jeu de cartes qu'après validation de l'utilisateur

#### Scenario: Ajout avec validation
- **WHEN** un vocabulaire `nl`/`fr` est enregistré et l'utilisateur fournit une liste à ajouter
- **THEN** le système affiche les langues du jeu de cartes et le nombre de mots lus
- **AND** n'ajoute les mots qu'après validation, sans avertissement de remplacement
