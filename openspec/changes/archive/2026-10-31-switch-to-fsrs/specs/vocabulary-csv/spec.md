# Spec Delta

## MODIFIED Requirements

### Requirement: Format CSV du vocabulaire
Le système MUST lire un CSV encodé en UTF-8 avec une ligne d'en-tête. Les deux premières colonnes sont les colonnes de langue ; leurs en-têtes (ex. `fr`, `en`) nomment les langues A et B. Les colonnes de progression `maitrise_<a>_<b>`, `maitrise_<b>_<a>`, `revu_<a>_<b>`, `revu_<b>_<a>` sont optionnelles et repérées par leur nom, quelle que soit leur position. Une cellule `maitrise_*` contient `S:<stabilité>|D:<difficulté>` (ex. `S:12.4|D:5.3`), suivi de `|R:1` lorsque le sens est « à retravailler » (ex. `S:0.8|D:6.1|R:1`) ; un entier de 1 à 5 (ancien format) est aussi accepté.

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
