# mastery-tracking Specification

## Purpose

Mesure la maîtrise de chaque mot dans chaque sens d'étude avec l'algorithme FSRS (stabilité et difficulté), détermine quand le revoir, et conserve cette progression dans le navigateur.

## Requirements

### Requirement: Progression par mot et par sens
Le système MUST suivre la progression de chaque mot séparément dans le sens A→B et dans le sens B→A. Pour chaque sens, la progression est une stabilité (en jours), une difficulté et une date de dernière révision, selon l'algorithme FSRS ; un sens jamais révisé n'a ni stabilité, ni difficulté, ni date et est présenté comme Nouveau.

#### Scenario: Sens indépendants
- **WHEN** l'utilisateur répond juste à `maison` dans le sens fr→en
- **THEN** seule la progression fr→en de `maison` change ; la progression en→fr est inchangée

### Requirement: Niveaux de maîtrise affichés
Le système MUST exprimer la progression en 5 niveaux de maîtrise affichés avec les libellés suivants, sans faire apparaître le terme « boîte » : 1 En apprentissage, 2 Familier, 3 Bien connu, 4 Très bien connu, 5 Maîtrisé. Le niveau est déduit de la stabilité, en jours : moins de 2 → niveau 1, de 2 à moins de 7 → niveau 2, de 7 à moins de 21 → niveau 3, de 21 à moins de 60 → niveau 4, 60 ou plus → niveau 5. Un sens jamais révisé MUST être affiché comme « Nouveau ».

#### Scenario: Affichage d'un niveau
- **WHEN** un mot a une stabilité de 75 jours dans un sens
- **THEN** son niveau est affiché « Maîtrisé » pour ce sens

#### Scenario: Limite entre deux niveaux
- **WHEN** un mot a une stabilité de 7 jours dans un sens
- **THEN** son niveau est affiché « Bien connu » (niveau 3) pour ce sens

#### Scenario: Mot jamais révisé
- **WHEN** un mot n'a jamais été révisé dans un sens
- **THEN** il est affiché « Nouveau » pour ce sens

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

### Requirement: Évolution de la progression après une réponse
Après chaque réponse, le système MUST mettre à jour la stabilité, la difficulté et la date de dernière révision du sens révisé selon FSRS, avec une rétention cible de 90 %. Une réponse juste correspond à la note Good et une réponse fausse à la note Again. La date de dernière révision devient la date du jour. Après une réponse fausse, le sens MUST en outre être marqué « à retravailler » ; une réponse juste retire cette marque.

#### Scenario: Réponse juste à un mot déjà révisé
- **WHEN** l'utilisateur répond juste à un mot déjà révisé, le jour où il est à revoir
- **THEN** la stabilité du mot dans ce sens augmente
- **AND** sa date de révision est celle du jour

#### Scenario: Réponse fausse à un mot déjà révisé
- **WHEN** l'utilisateur répond faux à un mot déjà révisé
- **THEN** la stabilité du mot dans ce sens diminue et sa difficulté augmente
- **AND** sa date de révision est celle du jour
- **AND** le sens est marqué « à retravailler »

#### Scenario: Réponse juste à un mot nouveau
- **WHEN** l'utilisateur répond juste à un mot Nouveau
- **THEN** le mot reçoit une stabilité et une difficulté initiales et n'est plus Nouveau
- **AND** sa date de révision est celle du jour

#### Scenario: Réponse fausse à un mot nouveau
- **WHEN** l'utilisateur répond faux à un mot Nouveau
- **THEN** le mot reçoit une stabilité et une difficulté initiales, la stabilité étant plus faible que pour une réponse juste
- **AND** le sens est marqué « à retravailler »

#### Scenario: Réponse juste à un mot à retravailler
- **WHEN** l'utilisateur répond juste à un mot marqué « à retravailler » dans une nouvelle session
- **THEN** la progression évolue comme pour une réponse juste et la marque « à retravailler » est retirée

#### Scenario: Correction d'un faux négatif
- **WHEN** l'utilisateur corrige une réponse jugée fausse en « j'avais juste »
- **THEN** la progression du mot est celle qu'aurait produite une réponse juste à partir de l'état antérieur à la réponse, sans marque « à retravailler », et non un cumul des deux réponses

### Requirement: Réussite d'un réessai le jour même
Lorsqu'une carte ratée est reposée et réussie au cours de la même session, le système MUST retirer la marque « à retravailler » du sens sans modifier la stabilité, la difficulté ni la date de révision : le réessai n'est pas compté comme une révision FSRS supplémentaire.

#### Scenario: Réessai réussi
- **WHEN** l'utilisateur rate `maison` (fr→en), puis le réussit lors du réessai dans la même session
- **THEN** le sens n'est plus « à retravailler »
- **AND** la stabilité, la difficulté et la date de révision sont celles issues de la réponse fausse

#### Scenario: Réessai raté
- **WHEN** l'utilisateur rate `maison` (fr→en), puis rate à nouveau le réessai
- **THEN** le sens reste « à retravailler »
- **AND** la stabilité, la difficulté et la date de révision ne changent pas

### Requirement: Échéance de révision FSRS
Un mot révisé MUST être à revoir dans un sens lorsque la date du jour atteint sa date de dernière révision augmentée de l'intervalle FSRS correspondant à la rétention cible de 90 %, arrondi au jour entier et d'au moins 1 jour. Un sens marqué « à retravailler » MUST être à revoir dès le jour de sa dernière révision. Les échéances se calculent en jours calendaires, à l'heure locale de l'appareil.

#### Scenario: Mot réussi aujourd'hui
- **WHEN** un mot a été révisé aujourd'hui avec une réponse juste
- **THEN** il n'est pas à revoir aujourd'hui

#### Scenario: Mot raté aujourd'hui
- **WHEN** un mot a été révisé aujourd'hui avec une réponse fausse et n'a pas été réussi depuis
- **THEN** il est à revoir aujourd'hui

#### Scenario: Mot raté un jour précédent
- **WHEN** un mot a été raté le 2026-10-28 sans être réussi depuis et la date du jour est le 2026-10-30
- **THEN** il est à revoir

#### Scenario: Mot pas encore échu
- **WHEN** un mot a une stabilité de 10 jours, a été révisé le 2026-10-20, et la date du jour est le 2026-10-29
- **THEN** il n'est pas à revoir

#### Scenario: Mot échu
- **WHEN** un mot a une stabilité de 10 jours, a été révisé le 2026-10-20, et la date du jour est le 2026-10-30
- **THEN** il est à revoir

#### Scenario: Retard
- **WHEN** deux mots sont à revoir
- **THEN** celui dont la probabilité de rappel estimée est la plus faible est considéré comme le plus en retard
