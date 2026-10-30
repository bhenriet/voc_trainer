# Spec Delta

## Purpose

Définit le format CSV d'échange du vocabulaire et de sa progression, ainsi que l'import et l'export qui servent de sauvegarde et de transfert entre appareils.

## ADDED Requirements

### Requirement: Format CSV du vocabulaire
Le système MUST lire un CSV encodé en UTF-8 avec une ligne d'en-tête. Les deux premières colonnes sont les colonnes de langue ; leurs en-têtes (ex. `fr`, `en`) nomment les langues A et B. Les colonnes de progression `maitrise_<a>_<b>`, `maitrise_<b>_<a>`, `revu_<a>_<b>`, `revu_<b>_<a>` sont optionnelles et repérées par leur nom, quelle que soit leur position.

#### Scenario: Fichier minimal à deux colonnes
- **WHEN** l'utilisateur importe un fichier dont l'en-tête est `fr;en` suivi de lignes `maison;house`
- **THEN** le système crée un mot par ligne, avec la langue A nommée `fr` et la langue B nommée `en`
- **AND** chaque mot est au niveau Nouveau dans les deux sens

#### Scenario: Fichier avec progression
- **WHEN** l'utilisateur importe un fichier dont l'en-tête est `fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr` et une ligne `maison;house;3;1;2026-10-28;2026-10-20`
- **THEN** le mot `maison`/`house` est au niveau 3 dans le sens fr→en, révisé le 2026-10-28
- **AND** au niveau 1 dans le sens en→fr, révisé le 2026-10-20

#### Scenario: Fichier avec marque d'ordre des octets
- **WHEN** le fichier commence par un BOM UTF-8
- **THEN** le BOM est ignoré et le premier en-tête est lu correctement

#### Scenario: Champ contenant le séparateur
- **WHEN** un champ entre guillemets contient le séparateur, par exemple `"garder (un objet; un secret)";keep`
- **THEN** le champ est lu comme une seule valeur `garder (un objet; un secret)`

### Requirement: Choix du séparateur à l'import
Le système MUST proposer le point-virgule `;` comme séparateur par défaut et permettre de choisir la virgule `,` avant l'import.

#### Scenario: Séparateur par défaut
- **WHEN** l'utilisateur importe un fichier sans changer le séparateur
- **THEN** le fichier est lu avec le séparateur `;`

#### Scenario: Séparateur virgule
- **WHEN** l'utilisateur choisit `,` puis importe un fichier `fr,en` / `chien,dog`
- **THEN** le mot `chien`/`dog` est importé

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
- **WHEN** une valeur `maitrise_*` n'est pas un entier de 1 à 5, ou une valeur `revu_*` n'est pas une date `AAAA-MM-JJ`
- **THEN** la progression de ce mot dans ce sens est considérée comme absente (niveau Nouveau)
- **AND** le récapitulatif d'import indique le nombre de valeurs corrigées

#### Scenario: Colonnes non reconnues
- **WHEN** le fichier contient des colonnes autres que les colonnes de langue et de progression
- **THEN** ces colonnes sont ignorées
- **AND** l'utilisateur est averti qu'elles ne figureront pas dans l'export

### Requirement: Import par remplacement avec avertissement
L'import MUST remplacer l'intégralité du vocabulaire et de la progression enregistrés dans le navigateur. Si des données existent déjà, le système MUST afficher un avertissement chiffré et attendre une confirmation explicite avant de remplacer.

#### Scenario: Premier import
- **WHEN** aucun vocabulaire n'est enregistré et l'utilisateur importe un fichier valide
- **THEN** le vocabulaire est enregistré sans demande de confirmation
- **AND** un récapitulatif indique le nombre de mots importés

#### Scenario: Import sur des données existantes confirmé
- **WHEN** 230 mots sont enregistrés et l'utilisateur importe un fichier valide de 250 mots
- **THEN** le système affiche un avertissement indiquant que les 230 mots et leur progression seront remplacés par les 250 mots du fichier
- **AND** après confirmation, seuls les 250 mots du fichier et leur progression sont enregistrés

#### Scenario: Import sur des données existantes annulé
- **WHEN** l'utilisateur annule l'avertissement de remplacement
- **THEN** le vocabulaire et la progression existants sont inchangés

### Requirement: Export du vocabulaire et de la progression
Le système MUST permettre de télécharger un CSV contenant tous les mots et leur progression dans les deux sens, au format défini ci-dessus, avec le séparateur `;`, encodé en UTF-8 avec BOM. Un fichier exporté MUST pouvoir être réimporté sans perte de vocabulaire ni de progression.

#### Scenario: Contenu de l'export
- **WHEN** l'utilisateur exporte un vocabulaire `fr`/`en`
- **THEN** le fichier a pour en-tête `fr;en;maitrise_fr_en;maitrise_en_fr;revu_fr_en;revu_en_fr`
- **AND** contient une ligne par mot ; les cellules `maitrise_*` et `revu_*` sont vides pour un sens jamais révisé

#### Scenario: Aller-retour export / import
- **WHEN** l'utilisateur exporte puis réimporte le fichier sur un autre appareil
- **THEN** l'autre appareil possède le même vocabulaire, les mêmes niveaux et les mêmes dates de révision

#### Scenario: Nom du fichier exporté
- **WHEN** l'utilisateur exporte le 2026-10-29
- **THEN** le nom de fichier proposé contient les deux langues et la date, par exemple `vocabulaire_fr_en_2026-10-29.csv`

#### Scenario: Export sans vocabulaire
- **WHEN** aucun vocabulaire n'est enregistré
- **THEN** l'export n'est pas proposé
