# study-session Specification

## Purpose

Permet à l'utilisateur de lancer une session de révision réglée selon ses besoins, de répondre au clavier, et d'obtenir un retour immédiat puis un bilan.

## Requirements

### Requirement: Configuration de la session
Avant de commencer, l'utilisateur MUST pouvoir choisir le nombre de cartes à réviser et le sens d'étude : A→B, B→A ou mélangé. Les sens sont présentés avec les noms de langue issus du CSV (ex. « fr → en »).

#### Scenario: Choix du sens
- **WHEN** le vocabulaire a pour langues `fr` et `en`
- **THEN** l'utilisateur peut choisir « fr → en », « en → fr » ou « Mélangé »

#### Scenario: Choix du nombre de cartes
- **WHEN** l'utilisateur choisit 20 cartes en sens « fr → en » et lance la session
- **THEN** la session comporte au plus 20 cartes, toutes posées dans le sens fr→en

#### Scenario: Nombre de cartes invalide
- **WHEN** l'utilisateur saisit un nombre de cartes inférieur à 1
- **THEN** la session ne peut pas être lancée

### Requirement: Sélection des cartes
Une carte est un couple (mot, sens). Le système MUST retenir d'abord les cartes à revoir, de la plus en retard à la moins en retard, le retard étant mesuré par la probabilité de rappel estimée (la plus faible en premier), puis compléter avec des cartes Nouvelles jusqu'au nombre demandé. Les cartes pas encore échues MUST NOT être retenues. L'ordre de présentation des cartes retenues est aléatoire.

#### Scenario: Priorité aux cartes à revoir
- **WHEN** 5 cartes sont à revoir, 30 sont Nouvelles et l'utilisateur demande 10 cartes
- **THEN** la session contient les 5 cartes à revoir et 5 cartes Nouvelles

#### Scenario: Plus de cartes à revoir que demandé
- **WHEN** 50 cartes sont à revoir et l'utilisateur demande 10 cartes
- **THEN** la session contient les 10 cartes dont la probabilité de rappel estimée est la plus faible

#### Scenario: Pas assez de cartes
- **WHEN** 3 cartes seulement sont à revoir ou Nouvelles et l'utilisateur demande 10 cartes
- **THEN** la session contient ces 3 cartes et l'utilisateur en est informé

#### Scenario: Rien à réviser
- **WHEN** aucune carte n'est à revoir ni Nouvelle dans le sens choisi
- **THEN** la session ne démarre pas et le système indique la date de la prochaine révision

### Requirement: Sens mélangé
En sens mélangé, les cartes MUST être choisies parmi les deux sens selon les règles de sélection, et un même mot MUST NOT apparaître dans les deux sens au cours d'une même session.

#### Scenario: Pas de doublon de mot
- **WHEN** `maison` est à revoir dans les deux sens et l'utilisateur lance une session en sens mélangé
- **THEN** `maison` est posé au plus une fois, dans un seul des deux sens

### Requirement: Présentation d'une carte et saisie
Pour chaque carte, le système MUST afficher le mot dans la langue de départ et un champ de saisie pour la réponse dans la langue d'arrivée. La réponse se valide au clavier (touche Entrée) ou par un bouton.

#### Scenario: Validation par Entrée
- **WHEN** l'utilisateur tape `house` puis appuie sur Entrée sur la carte `maison` (fr→en)
- **THEN** la réponse est vérifiée

#### Scenario: Réponse vide
- **WHEN** l'utilisateur valide sans rien saisir
- **THEN** la réponse est comptée fausse et la bonne réponse est affichée

### Requirement: Vérification de la réponse
Une réponse MUST être jugée juste si, après suppression des espaces en début et fin, réduction des espaces multiples et sans tenir compte de la casse, elle est égale à l'une des réponses attendues. Une valeur de langue contenant `/` définit plusieurs réponses attendues, chacune débarrassée de ses espaces de bord.

#### Scenario: Casse et espaces ignorés
- **WHEN** la réponse attendue est `house` et l'utilisateur saisit ` House `
- **THEN** la réponse est juste

#### Scenario: Réponses multiples
- **WHEN** la réponse attendue est `maison / foyer` et l'utilisateur saisit `foyer`
- **THEN** la réponse est juste

#### Scenario: Réponse incorrecte
- **WHEN** la réponse attendue est `house` et l'utilisateur saisit `home`
- **THEN** la réponse est fausse

#### Scenario: Pas de tolérance aux fautes de frappe ni aux articles
- **WHEN** la réponse attendue est `the house` et l'utilisateur saisit `house`, ou la réponse attendue est `house` et l'utilisateur saisit `hosue`
- **THEN** la réponse est fausse

### Requirement: Tolérance aux accents
Une réponse qui ne diffère d'une réponse attendue que par les accents ou signes diacritiques MUST être jugée juste, et le système MUST alors signaler l'écart en affichant l'orthographe attendue.

#### Scenario: Accents manquants
- **WHEN** la réponse attendue est `été` et l'utilisateur saisit `ete`
- **THEN** la réponse est juste et le système affiche « attention aux accents : été »

#### Scenario: Accents erronés
- **WHEN** la réponse attendue est `élève` et l'utilisateur saisit `éléve`
- **THEN** la réponse est juste et le système affiche l'orthographe attendue `élève`

### Requirement: Retour après chaque réponse
Après chaque réponse, le système MUST indiquer si elle est juste ou fausse et afficher la ou les réponses attendues, avant de passer à la carte suivante sur action de l'utilisateur (touche Entrée ou bouton).

#### Scenario: Réponse fausse
- **WHEN** l'utilisateur répond `home` à `maison` (fr→en)
- **THEN** le système indique que la réponse est fausse et affiche `house`

### Requirement: Correction d'un faux négatif
Après une réponse jugée fausse, l'utilisateur MUST pouvoir indiquer « j'avais juste » avant de passer à la carte suivante. La carte est alors traitée comme une réponse juste, pour la progression comme pour le bilan.

#### Scenario: Synonyme non prévu dans le CSV
- **WHEN** la réponse attendue est `house`, l'utilisateur saisit `home`, la réponse est jugée fausse, puis l'utilisateur choisit « j'avais juste »
- **THEN** la progression du mot évolue comme pour une réponse juste
- **AND** la carte est comptée juste dans le bilan

### Requirement: Déroulement et fin de session
Chaque carte de la session MUST être posée au moins une fois. Une carte dont la première réponse est fausse MUST être reposée plus tard dans la même session, autant de fois qu'il le faut, jusqu'à ce qu'elle soit réussie ; la session ne se termine qu'une fois toutes les cartes réussies. L'utilisateur MUST pouvoir interrompre la session à tout moment ; les réponses déjà validées restent enregistrées.

#### Scenario: Carte ratée reposée
- **WHEN** l'utilisateur rate la 2e carte d'une session de 10 cartes
- **THEN** cette carte est reposée avant la fin de la session
- **AND** la session ne se termine pas tant qu'elle n'a pas été réussie

#### Scenario: Réessai indiqué
- **WHEN** une carte ratée est reposée
- **THEN** le système indique qu'il s'agit d'un réessai

#### Scenario: Interruption
- **WHEN** l'utilisateur quitte une session de 20 cartes après 8 réponses
- **THEN** la progression des 8 cartes répondues est enregistrée et les 12 autres sont inchangées
- **AND** les cartes ratées non encore réussies restent à revoir le jour même

#### Scenario: Progression dans la session
- **WHEN** l'utilisateur est à la 8e carte d'une session de 20
- **THEN** l'indication « 8 / 20 » est affichée, les réessais ne modifiant pas le total

### Requirement: Bilan de session
À la fin d'une session, le système MUST afficher le nombre de réponses justes et fausses, comptées sur la première réponse à chaque carte (les réessais n'y entrent pas), et la liste des cartes ratées avec leur réponse attendue.

#### Scenario: Bilan
- **WHEN** l'utilisateur termine une session de 10 cartes avec 7 cartes réussies du premier coup, les 3 autres ayant été réussies au réessai
- **THEN** le bilan indique 7 justes et 3 fausses
- **AND** liste les 3 cartes ratées avec le mot posé et la réponse attendue
