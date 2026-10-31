# Design

## Context

Voir proposal.md pour la motivation. État actuel : la progression est `{ level 1..5, reviewed: Day }` ; `mastery.ts` porte la table d'intervalles, `applyAnswer(progress, correct, day)` (pure, recalculée depuis `previous` pour « j'avais juste »), `dueDay`, `isDue` et `overdueDays`. `selection.ts` trie par retard, `stats.ts` compte par niveau, `csv.ts` lit/écrit `maitrise_*` et `revu_*`, `db.ts` (Dexie) stocke les `Word` avec leurs deux `Progress`. Les dates sont des jours calendaires `AAAA-MM-JJ`, sans heure.

## Goals / Non-Goals

**Goals:**
- Isoler FSRS dans `mastery.ts` : le reste du code ne connaît que `Progress`, `applyAnswer`, `clearRelearning`, `isDue`, `retrievability`, `levelOf`.
- Conserver l'API pure de `applyAnswer` (état précédent + note + jour → nouvel état), indispensable à la correction d'un faux négatif.
- Ne perdre aucune progression existante (base locale et CSV).

**Non-Goals:**
- Interface Hard/Easy, rétention réglable, optimisation des poids, historique des révisions, révisions dans la journée.

## Decisions

**1. `ts-fsrs` plutôt qu'une implémentation maison.** Les formules FSRS-6 ont de nombreuses constantes ; la bibliothèque de référence évite les erreurs et suit les évolutions. Configuration : `enable_short_term: false`, `enable_fuzz: false`, `request_retention: 0.9`, poids par défaut. Alternative écartée : ~100 lignes maison, risque d'écarts silencieux. Elle n'est importée que par `mastery.ts`.

**2. État stocké = `{ stability, difficulty, reviewed }`.** Les autres champs d'une carte ts-fsrs (`due`, `state`, `reps`, `lapses`, `elapsed_days`, `scheduled_days`) sont reconstruits au moment du calcul depuis ces trois valeurs : `reviewed` donne `last_review`, `elapsed_days` vient de `daysBetween(reviewed, jour)`, `state` est « Review ». Le compteur de répétitions n'influence pas les formules FSRS utilisées ici. Alternative écartée : stocker la carte ts-fsrs complète, plus lourd pour le CSV sans gain.

**3. Jours calendaires.** `Day` est converti en `Date` à midi UTC avant d'appeler ts-fsrs, pour que les écarts de jours soient exacts quel que soit le fuseau. Une révision le même jour qu'une précédente a un écart de 0 jour, que FSRS traite avec sa formule de stabilité « même jour ».

**4. Échéance calculée, non stockée.** Avec une rétention cible de 0,9, l'intervalle FSRS vaut la stabilité. `dueDay = reviewed + max(1, round(stability))`, sauf si le sens est « à retravailler » : `dueDay = reviewed`. Voir décision 11 pour cette marque.

**5. Tri par rétrievabilité.** `retrievability(progress, day)` calcule `(1 + factor × t / S) ^ decay` (formule de ts-fsrs). `selectCards` trie par valeur croissante ; `overdueDays` disparaît. `nextDueDay` reste basé sur `dueDay`. Les égalités sont toujours départagées au hasard (mélange avant tri stable).

**6. Niveaux par seuils sur la stabilité.** `levelOf(stability)` : < 2 → 1, < 7 → 2, < 21 → 3, < 60 → 4, sinon 5. `LEVEL_LABELS` et `Home.svelte` sont inchangés. `Level` n'est plus stocké, seulement dérivé.

**7. Note.** `applyAnswer(progress, grade, day)` prend un `Grade` (`Again | Hard | Good | Easy`). `Session.svelte` passe `Again` ou `Good` selon `correct`. L'UI Hard/Easy ajoutera juste d'autres appelants.

**8. Format CSV.** Cellule `maitrise_*` : `S:<stabilité>|D:<difficulté>` suivi de `|R:1` si le sens est à retravailler (absent = non), nombres à 4 chiffres significatifs maximum à l'export (point décimal, indépendant de la locale). Lecture : regex stricte pour le nouveau format, `^[1-5]$` pour l'ancien. `revu_*` inchangé. Une cellule valide avec une `revu_*` invalide (ou l'inverse) compte comme valeur corrigée, comme aujourd'hui. Une stabilité ≤ 0 ou une difficulté hors [1, 10] est invalide.

**9. Conversion de l'ancien niveau.** Fonction unique `fromLegacyLevel(level, reviewed)` partagée par l'import CSV et la migration Dexie : stabilité 1, 3, 7, 21, 60 pour les niveaux 1 à 5 (bas de chaque tranche, pour rester dans le même niveau), difficulté 5 (valeur moyenne). Alternative écartée : conserver les anciens intervalles à la lettre (0, 1, 3, 7, 14) : incompatibles avec les seuils d'affichage.

**10. Migration Dexie.** `db.version(2).upgrade(tx => …)` convertit chaque `Word.ab` et `Word.ba` de `{ level, reviewed }` en `{ stability, difficulty, reviewed }`. Les index ne changent pas (`meta`, `++id`), seule la forme des objets évolue.

**11. Révision le jour même des cartes ratées (marque `relearning`).** Besoin : un étudiant qui prépare un contrôle le lendemain doit revoir ses erreurs aujourd'hui. FSRS sans étapes courtes ne le fait pas (intervalle minimal d'un jour), et l'échéance étant calculée, une erreur ne peut pas s'en déduire. `Progress` gagne un booléen `relearning`, posé par `applyAnswer` sur Again, retiré sur toute autre note, et sérialisé en suffixe `|R:1`. `dueDay = reviewed` tant que la marque est posée, donc la carte est sélectionnée par `selectCards` dans une nouvelle session le jour même (et le lendemain si elle n'est pas revue : elle est alors en retard). Alternative écartée : stocker une date d'échéance explicite, plus générale mais en doublon avec la stabilité et incompatible avec le CSV par colonne. Alternative écartée : utiliser les étapes d'apprentissage de ts-fsrs, qui exigent des horodatages et non des jours.

**12. Réessai dans la session.** `Session.svelte` gère une file : une carte dont la première réponse est fausse est remise en fin de file (puis à nouveau après chaque échec) jusqu'à une réponse juste. Seule la première réponse appelle `applyAnswer` ; un réessai juste appelle `clearRelearning` (retire la marque sans toucher à S, D ni `reviewed`) ; un réessai faux ne change rien (l'état FSRS a déjà reçu un Again). `results` ne garde que la première réponse de chaque carte pour le bilan ; le total « n / N » ne compte pas les réessais, et un libellé « Réessai » s'affiche. « J'avais juste » sur la première réponse recalcule depuis `previous` comme aujourd'hui (Good, sans marque) et retire la carte de la file de réessai ; sur un réessai, il équivaut à une réussite. Interrompre la session laisse la marque posée : les cartes non réussies reviennent dans la prochaine session du jour.

## Risks / Trade-offs

- [Un seul Again par session alimente FSRS, même si la carte est ratée plusieurs fois] → Voulu : les réessais rapprochés ne reflètent pas la mémoire à long terme et fausseraient la stabilité.
- [Session sans fin si une carte n'est jamais réussie] → L'utilisateur peut toujours interrompre ; les cartes non réussies restent à revoir.
- [Format CSV : suffixe `|R:1` ajouté] → Facultatif et absent pour les sens réussis ; la lecture reste rétrocompatible.
- [Poids par défaut non adaptés à un seul utilisateur] → Acceptable pour démarrer ; l'optimisation exigerait un journal de révisions, hors périmètre.
- [Conversion des anciens niveaux approximative] → La stabilité reconstruite est une estimation ; le comportement se corrige après quelques révisions.
- [ts-fsrs ajoute du poids au bundle et à la PWA] → Vérifier la taille après build ; la bibliothèque est petite et sans dépendance lourde.
- [Régression de la correction « j'avais juste »] → Couvert par un test : état après erreur puis correction = état d'une réponse juste directe.
- [Le comportement exact de ts-fsrs sans étapes courtes (intervalle minimal, mot Nouveau) doit être vérifié] → Tâche de vérification dédiée avant d'écrire les tests des specs.

## Migration Plan

1. Livraison : au premier lancement, Dexie exécute la mise à jour v2 et convertit la progression existante, de manière transactionnelle.
2. CSV : les anciens fichiers sont importables ; le premier export produit le nouveau format. Les nouveaux fichiers ne sont pas lisibles par l'ancienne version (retour arrière : réimporter une ancienne sauvegarde).
3. Recommandation à l'utilisateur : exporter un CSV avant la mise à jour comme sauvegarde.
