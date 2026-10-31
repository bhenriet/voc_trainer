## ADDED Requirements

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

## MODIFIED Requirements

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
