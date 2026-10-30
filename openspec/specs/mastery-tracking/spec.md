# mastery-tracking Specification

## Purpose

Mesure la maîtrise de chaque mot dans chaque sens d'étude selon la méthode de Leitner, détermine quand le revoir, et conserve cette progression dans le navigateur.

## Requirements

### Requirement: Progression par mot et par sens
Le système MUST suivre la progression de chaque mot séparément dans le sens A→B et dans le sens B→A. Pour chaque sens, la progression est un niveau de maîtrise et une date de dernière révision ; un sens jamais révisé n'a ni niveau enregistré ni date et est présenté comme Nouveau.

#### Scenario: Sens indépendants
- **WHEN** l'utilisateur répond juste à `maison` dans le sens fr→en
- **THEN** seule la progression fr→en de `maison` change ; la progression en→fr est inchangée

### Requirement: Niveaux de maîtrise affichés
Le système MUST exprimer la progression en 5 niveaux de maîtrise affichés avec les libellés suivants, sans faire apparaître le terme « boîte » : 1 En apprentissage, 2 Familier, 3 Bien connu, 4 Très bien connu, 5 Maîtrisé. Un sens jamais révisé MUST être affiché comme « Nouveau ».

#### Scenario: Affichage d'un niveau
- **WHEN** un mot est au niveau 5 dans un sens
- **THEN** son niveau est affiché « Maîtrisé » pour ce sens

#### Scenario: Mot jamais révisé
- **WHEN** un mot n'a jamais été révisé dans un sens
- **THEN** il est affiché « Nouveau » pour ce sens

### Requirement: Évolution du niveau après une réponse
Après une réponse juste, le niveau du sens révisé MUST monter d'un cran, sans dépasser 5 ; un mot Nouveau passe au niveau 1. Après une réponse fausse, le niveau MUST revenir à 1. Dans les deux cas, la date de dernière révision devient la date du jour.

#### Scenario: Réponse juste
- **WHEN** l'utilisateur répond juste à un mot au niveau 2
- **THEN** le mot passe au niveau 3 et sa date de révision est celle du jour

#### Scenario: Réponse juste au niveau maximal
- **WHEN** l'utilisateur répond juste à un mot au niveau 5
- **THEN** le mot reste au niveau 5 et sa date de révision est celle du jour

#### Scenario: Réponse juste à un mot nouveau
- **WHEN** l'utilisateur répond juste à un mot Nouveau
- **THEN** le mot passe au niveau 1

#### Scenario: Réponse fausse
- **WHEN** l'utilisateur répond faux à un mot au niveau 4
- **THEN** le mot revient au niveau 1 et sa date de révision est celle du jour

### Requirement: Échéance de révision
Un mot révisé MUST être à revoir dans un sens lorsque la date du jour atteint sa date de dernière révision augmentée de l'intervalle de son niveau : niveau 1 → 0 jour, niveau 2 → 1 jour, niveau 3 → 3 jours, niveau 4 → 7 jours, niveau 5 → 14 jours. Les échéances se calculent en jours calendaires, à l'heure locale de l'appareil.

#### Scenario: Mot au niveau 1
- **WHEN** un mot est au niveau 1, révisé aujourd'hui
- **THEN** il est à revoir dès aujourd'hui

#### Scenario: Mot au niveau 3 pas encore échu
- **WHEN** un mot est au niveau 3, révisé le 2026-10-28, et la date du jour est le 2026-10-30
- **THEN** il n'est pas à revoir

#### Scenario: Mot au niveau 3 échu
- **WHEN** un mot est au niveau 3, révisé le 2026-10-28, et la date du jour est le 2026-10-31
- **THEN** il est à revoir

#### Scenario: Retard
- **WHEN** deux mots sont à revoir, l'un échu depuis 5 jours et l'autre depuis 1 jour
- **THEN** le premier est considéré comme plus en retard que le second

### Requirement: Enregistrement automatique de la progression
La progression MUST être enregistrée dans le navigateur dès qu'une réponse est validée, sans action de l'utilisateur, et MUST être conservée après fermeture du navigateur, rechargement de la page ou passage hors-ligne.

#### Scenario: Rechargement en cours de session
- **WHEN** l'utilisateur a répondu à 4 cartes puis recharge la page
- **THEN** la progression de ces 4 cartes est conservée

#### Scenario: Réouverture de l'application
- **WHEN** l'utilisateur ferme le navigateur puis rouvre l'application le lendemain
- **THEN** le vocabulaire et la progression sont les mêmes qu'à la fermeture

### Requirement: Vue d'ensemble de la progression
Le système MUST afficher, pour chaque sens, le nombre de mots par niveau de maîtrise (Nouveau compris) et le nombre de mots à revoir aujourd'hui.

#### Scenario: Tableau de progression
- **WHEN** l'utilisateur ouvre l'accueil avec un vocabulaire importé
- **THEN** il voit, pour fr→en et pour en→fr, la répartition des mots entre Nouveau et les niveaux 1 à 5, et le nombre de mots à revoir aujourd'hui
