# Design

## Context

La vérification est entièrement dans [answer.ts](src/domain/answer.ts), en fonctions pures : `acceptedAnswers` découpe la valeur attendue sur `/`, `normalize` (NFC, espaces de bord et multiples, minuscules) produit la clé de comparaison, `withoutAccents` en dérive une clé sans diacritiques, et `checkAnswer` renvoie `correct`, `accents` (avec l'orthographe attendue) ou `wrong`. `acceptedAnswers` sert aussi à l'affichage de la réponse attendue ([Session.svelte](src/ui/Session.svelte), [Summary.svelte](src/ui/Summary.svelte)). Voir proposal.md pour la motivation et le périmètre.

## Goals / Non-Goals

**Goals:**
- Une seule clé de comparaison, partagée par la vérification exacte et la vérification « aux accents près », pour que les tolérances se combinent sans cas particulier.
- Aucun changement de signature publique : `checkAnswer`, `acceptedAnswers` et `Verdict` gardent leur forme, donc aucun changement dans l'interface.

**Non-Goals:**
- Aucune tolérance aux ligatures (`œ`/`oe`, `ß`/`ss`) : le test existant qui juge `strasse` faux pour `straße` reste valable.
- Aucun traitement des crochets `[ ]`.
- Aucune configuration utilisateur : ces tolérances s'appliquent toujours.

## Decisions

**1. Clé de comparaison unique, ponctuation transformée en espace.** `normalize` enchaîne : NFC, minuscules, suppression des apostrophes (`'`, `’`, `ʼ`, `‘`), remplacement par une espace de tout autre caractère de ponctuation Unicode (`\p{P}`, ce qui inclut les parenthèses et tous les traits d'union), puis réduction des espaces (`\s` couvre l'insécable, la fine et la tabulation) et suppression de celles de bord. Remplacer par une espace plutôt que supprimer rend `hello,world` égal à `hello, world`, et `peut-être` égal à `peut être`. Les apostrophes sont supprimées pour que `aujourd'hui` égale `aujourdhui` sans devenir `aujourd hui`. Les symboles `\p{S}` (`+ & € %`) et les chiffres sont conservés. *Alternative* : tout supprimer, écartée car `peut-être` deviendrait `peutêtre` et `a,b` égalerait `ab`.

**2. Repli quand la clé est vide.** Si une saisie ou une réponse attendue ne contient que de la ponctuation (`?`, `...`), sa clé serait vide. Dans ce cas on compare avec l'ancienne normalisation (casse et espaces seulement), de sorte que `?` attendu et `?` saisi restent justes sans que la saisie vide (qui reste fausse, avant tout calcul) ne devienne juste. La saisie vide est testée sur la valeur brute après `trim`.

**3. Variantes pour les termes entre parenthèses, calculées sur la valeur attendue brute.** Une fonction interne repère les groupes de parenthèses équilibrés de premier niveau (un compteur de profondeur ; une parenthèse jamais fermée est du texte ordinaire ; les groupes imbriqués suivent leur groupe parent). Pour chaque réponse attendue, les variantes sont : toutes les combinaisons de présence des groupes. Au-delà de 5 groupes (32 variantes), seules les deux variantes extrêmes (tous présents, tous absents) sont générées, pour borner le coût. Une variante sans aucun groupe qui serait vide n'est pas générée, ce qui conserve `(familier)`. La variante « tous présents » garde le contenu mais sa ponctuation est neutralisée par la clé, d'où `to eat food` accepté pour `to eat (food)`. *Alternative* : retirer systématiquement les parenthèses, écartée car elle refuserait de la saisie du terme complet de la forme `se lever`, ce qui serait pénalisant.

**4. Découpage sur `/` hors groupes de parenthèses.** `acceptedAnswers` utilise le même repérage des groupes équilibrés pour ignorer les `/` à l'intérieur. Comme l'affichage utilise la même fonction, `maison (a/b) / foyer` s'affiche en deux réponses sans autre modification. Les variantes de la décision 3 sont calculées après ce découpage, par réponse.

**5. Verdict `accents` inchangé, sur la clé étendue.** `withoutAccents` applique la décomposition NFD à la clé de la décision 1. L'orthographe renvoyée est la réponse attendue brute (parenthèses incluses), comme aujourd'hui. Une différence de ponctuation seule reste `correct`, sans avertissement. Les accents ont priorité : on teste d'abord l'égalité de clés, puis l'égalité sans diacritiques.

## Risks / Trade-offs

- [Tolérance trop large : `aujourd'hui` accepté sans apostrophe, `l'homme` accepté en `lhomme`] → Choix assumé, courant dans les logiciels de révision ; `l homme` reste faux.
- [Sigles : `U.S.A.` donne la clé `u s a`, donc `usa` est faux] → Cas rare. On accepte `U.S.A`, `u s a` et `U S A`. Une exception pour les sigles ajouterait de la complexité sans demande.
- [Une réponse attendue qui contient des parenthèses de sens (`f(x)`)] → Le terme `(x)` devient facultatif ; sans conséquence pour du vocabulaire, noté comme limite connue.
- [Explosion combinatoire avec beaucoup de groupes] → Plafond à 5 groupes décrit en décision 3.
- [Clé vide dans deux réponses attendues] → Couvert par le repli de la décision 2 et un test.
