## ADDED Requirements

### Requirement: Entrées d'import distinctes sur l'accueil
L'accueil MUST proposer deux entrées d'import distinctes, « Étudier un jeu de cartes » (remplacement) et « Ajouter des cartes de vocabulaire » (ajout sans progression), chacune ouvrant l'écran d'import réglé sur son cas d'usage, avec le choix entre fichier et texte collé.

#### Scenario: Accueil avec un jeu de cartes
- **WHEN** un vocabulaire est enregistré
- **THEN** l'accueil propose « Étudier un jeu de cartes » et « Ajouter des cartes de vocabulaire »
- **AND** « Ajouter des cartes de vocabulaire » ne demande aucune confirmation de remplacement

#### Scenario: Choix de la source
- **WHEN** l'utilisateur ouvre l'une des deux entrées
- **THEN** il peut fournir sa liste en choisissant un fichier ou en la collant dans une zone de texte

## MODIFIED Requirements

### Requirement: Accueil sans vocabulaire
Lorsqu'aucun vocabulaire n'est enregistré, l'application MUST présenter l'import comme action principale, avec un exemple du format attendu, et proposer les deux entrées « Étudier un jeu de cartes » et « Ajouter des cartes de vocabulaire ».

#### Scenario: Premier lancement
- **WHEN** l'utilisateur ouvre l'application pour la première fois
- **THEN** il voit l'invitation à importer sa liste, un exemple `fr;en` / `maison;house` et les deux entrées d'import
