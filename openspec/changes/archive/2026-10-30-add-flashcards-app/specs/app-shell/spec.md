# Spec Delta

## Purpose

Fournit l'application web elle-même : accessible depuis un navigateur sur PC, téléphone ou tablette, installable, utilisable hors-ligne, sans compte ni serveur.

## ADDED Requirements

### Requirement: Utilisation sur PC, téléphone et tablette
L'application MUST être utilisable dans un navigateur récent (Chrome, Edge, Firefox, Safari) sur une largeur d'écran à partir de 360 px, sans défilement horizontal, avec des zones tactiles utilisables au doigt.

#### Scenario: Téléphone en portrait
- **WHEN** l'utilisateur ouvre l'application sur un écran de 360 px de large
- **THEN** l'import, la configuration de session, les cartes et le bilan sont utilisables sans défilement horizontal

#### Scenario: Saisie sur mobile
- **WHEN** une carte s'affiche sur un téléphone
- **THEN** le champ de réponse reçoit le focus et le clavier virtuel ne masque pas le mot posé

### Requirement: Installation et fonctionnement hors-ligne
L'application MUST pouvoir être installée sur l'écran d'accueil (PWA) et MUST fonctionner hors-ligne après une première visite en ligne, pour toutes ses fonctions : révision, import et export.

#### Scenario: Révision hors-ligne
- **WHEN** l'utilisateur a déjà ouvert l'application une fois en ligne, puis l'ouvre sans connexion
- **THEN** l'application s'affiche et il peut réviser son vocabulaire

#### Scenario: Mise à jour de l'application
- **WHEN** une nouvelle version de l'application est publiée
- **THEN** elle est prise en compte au prochain chargement en ligne, sans perte du vocabulaire ni de la progression

### Requirement: Données confinées à l'appareil
L'application MUST NOT envoyer le vocabulaire ni la progression à un serveur. Elle ne demande ni compte ni connexion.

#### Scenario: Aucun envoi réseau
- **WHEN** l'utilisateur importe un fichier et révise
- **THEN** aucune requête réseau ne transmet le contenu du vocabulaire ou de la progression

### Requirement: Accueil sans vocabulaire
Lorsqu'aucun vocabulaire n'est enregistré, l'application MUST présenter l'import comme action principale, avec un exemple du format CSV attendu.

#### Scenario: Premier lancement
- **WHEN** l'utilisateur ouvre l'application pour la première fois
- **THEN** il voit l'invitation à importer un fichier CSV et un exemple `fr;en` / `maison;house`

### Requirement: Rappel de sauvegarde
L'application MUST afficher la date du dernier export, ou l'absence d'export, et inviter à exporter lorsque des révisions ont eu lieu depuis le dernier import ou export.

#### Scenario: Révisions non exportées
- **WHEN** l'utilisateur a révisé depuis son dernier export
- **THEN** l'accueil indique que des progrès ne sont pas sauvegardés dans un fichier et propose d'exporter
