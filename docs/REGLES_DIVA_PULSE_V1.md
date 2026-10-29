# Règles de Diva Pulse — contrat maison, version 1

## Portée et version

Ce document spécifie le comportement de **Diva Pulse**, moteur musical JavaScript maison. Il constitue la référence du lot `GAME-01` pour les règles déjà implémentées et les corrections de cohérence temporelle qui l'accompagnent.

| Repère | Valeur |
| --- | --- |
| Version du document | 1, 29 octobre 2026 |
| Règles de score et clés de records | `rules4` / `rulesVersion: 4` |
| Base examinée | V34, commit `633ead8bce01f383c016a4e155f02961e934fdba` |
| Contrôle exécutable | [rules-contract.test.cjs](../tests/rules-contract.test.cjs) |
| Données d'entrée et résultats chiffrés | [rules-contract-v1.json](../tests/fixtures/rules-contract-v1.json) |
| Référence à Project DIVA | Aucune édition choisie ou certifiée comme identique |

Les fenêtres, bonus, scores et grades ci-dessous sont ceux du jeu maison. L'import de timings DSC ne certifie ni le scoring, ni les règles de notes, ni la fidélité à une édition de Project DIVA. Le choix d'une édition de référence et sa comparaison restent ouverts : `GAME-01` demeure **Partiel** sur ce périmètre.

La version du document, celle de l'application et celles des données sauvegardées sont distinctes. Ce travail n'ajoute aucun format de sauvegarde au runtime et ne migre, ne recalcule ni ne supprime les records existants. La fixture JSON est uniquement une donnée de test. Conserver `rules4` et les schémas de sauvegarde ne constitue pas une promesse de résultat numérique identique lors du recalcul de tous les anciens replays : les limites sont détaillées aux sections 1 et 9.

## Sources actives à lire ensemble

Le jeu assemble les sources selon [build.py](../build.py) et [src/template.html](../src/template.html). Les noms historiques des modules ne signifient pas qu'ils sont désactivés.

| Source | Responsabilité dans ce contrat |
| --- | --- |
| [core.js](../src/core.js) | Validation principale de partition, profils, `JudgeEngine`, points, vie, HOLD, chaînes, résultats. |
| [creator.js](../src/creator.js) | Temps musical, grilles, validation et simulation de replay. |
| [live-core.js](../src/live-core.js) | Sélection conservative des notes visibles, paramètres d'entraînement, raccourcis d'accords. |
| [precision-core.js](../src/precision-core.js) | Signatures musicales, MIDI, traitement local du ralentissement. Il ne remplace pas les fenêtres de jugement. |
| [services.js](../src/services.js), [enhancements.js](../src/enhancements.js) | Transport Web Audio, correspondance avec le timestamp des événements, entrées par source et enregistrement des replays. |
| [app.js](../src/app.js), [live-app.js](../src/live-app.js), [precision-app.js](../src/precision-app.js) | Parcours de partie, clavier/manette/tactile/MIDI, entraînement, dessin des cibles, records. |
| [director-app.js](../src/director-app.js) | Choix du profil de jugement dans les réglages. |
| [feedback33.js](../src/feedback33.js), [live-feedback34.js](../src/live-feedback34.js) | Présentation, interruption audio, jauges HOLD ; aucun nouveau barème. |

## 1. Temps, décalages et ordre des événements

Les notes et le moteur utilisent des **secondes**. Les réglages de calibration et les erreurs affichées utilisent des **millisecondes**.

- Le temps cible d'une note dans le morceau vaut `note.time + chart.offset`.
- L'entrée destinée au moteur vaut `audio.timeAt(timestamp) - inputOffset / 1000 × audio.rate`.
- L'erreur signée du jugement vaut `temps_entrée - chart.offset - note.time`. Un nombre négatif signifie une frappe en avance ; un nombre positif une frappe en retard.
- La vitesse d'entraînement agit sur le transport. Elle ne réécrit pas les timestamps stockés des notes. La compensation de saisie suit cette vitesse.
- Le temps de dessin est `temps_audio - visualOffset / 1000`. Ce réglage est indépendant de la compensation des entrées ; le changer ne déplace aucune note dans la partition.
- Le BPM, la carte de tempo et les signatures de mesures servent notamment aux grilles, au métronome et à la scène. Changer une signature ne recalcule pas les instants des notes existantes.

`audio.contextAt` rapproche le timestamp DOM du contexte audio. Le mode historique utilise `AudioContext.currentTime` ; l'option d'horloge de sortie peut utiliser `getOutputTimestamp` lorsque ses données sont exploitables. Un timestamp incompatible ou éloigné de plus d'une seconde de l'horloge courante est remplacé par l'instant courant. Ces mécanismes n'établissent pas une mesure de latence acoustique.

**Pour des entrées traitées dans l'ordre temporel, avant toute mise à jour qui dépasse leur timestamp, le résultat ne dépend pas de la cadence de dessin.** Avant de modifier l'état d'une touche, le moteur traite les événements automatiques atteints à cet instant. Ainsi, relâcher à 1,200 s une direction tenue depuis 1,000 s valide un maillon situé exactement à 1,200 s avant de couper le maintien. Les expirations de notes et les maillons automatiques sont traités dans l'ordre chronologique.

Cette propriété ne couvre pas les événements livrés en retard après une mise à jour déjà plus avancée. Le moteur ne remonte pas le temps : il n'annule ni un bonus HOLD déjà crédité, ni un maillon déjà validé, ni un MISS déjà consommé. Par exemple, une tête HOLD à 1,000 s suivie d'une mise à jour à 1,100 s a déjà gagné 20 points de maintien. Un relâchement ensuite livré avec le timestamp 1,050 s ne retire pas ces points ; traité avant la mise à jour à 1,100 s, ce même relâchement aurait borné le bonus à 10 points. Il n'existe donc pas de rollback des événements ni de compensation générale des retards de livraison.

Les fixtures contrôlent l'indépendance à la cadence pour des entrées ainsi ordonnées, sans images intermédiaires, puis avec des mises à jour simulées à 30, 60 et 144 Hz et avec des interruptions du rendu. Elles ne simulent pas la latence matérielle d'une manette ou d'un écran et ne prouvent pas l'équivalence d'une livraison tardive avec une livraison à temps.

## 2. Symboles, types de notes et données

| Lane | Symbole | Touche par défaut | Alias directionnel en jeu |
| --- | --- | --- | --- |
| 0 | △ | D | Flèche haut |
| 1 | □ | F | Flèche gauche |
| 2 | × | J | Flèche bas |
| 3 | ○ | K | Flèche droite |
| 4 | ‹ | S | Aucun |
| 5 | › | L | Aucun |

Le remappage mémorise des codes physiques comme `KeyD`. Les six lanes restent les identifiants du moteur, indépendamment du périphérique.

| Type | Règle |
| --- | --- |
| `tap` | Un appui sur la bonne lane juge la tête. |
| `hold` | La tête est jugée comme un appui ; une tête COOL ou FINE ouvre un bonus de maintien. |
| `slide` | Un appui directionnel juge la tête. Sur les lanes 4/5, COOL ou FINE arme les maillons suivants de cette direction. |
| `chain` | Peut être frappée directement comme une tête. Sur les lanes 4/5, peut aussi être validée automatiquement pendant un maintien déjà armé. |

La validation principale accepte jusqu'à 50 000 notes, entre 0 et 7 200 secondes, avec des durées entre 0 et 30 secondes. Le temps d'approche accepté est compris entre 0,08 et 15 secondes. Le BPM doit rester entre 20 et 400 ; `offset` et `gridOffset` sont bornés à ±30 secondes. Ces limites de partition ne changent pas la limite actuelle de dix minutes du décodeur audio.

Les notes sont triées par temps puis par lane. Deux notes sur la même lane au même instant sont refusées. Une simultanéité sur des lanes différentes est permise. Les coordonnées, l'angle et la distance décrivent l'affichage ; ils ne participent pas au jugement temporel.

En l'absence de type explicite, les lanes 0–3 reçoivent `tap` et les lanes 4/5 `slide`. Le validateur n'interdit pas toutes les combinaisons atypiques de type et de lane. Les modes de jeu ne doivent donc pas déduire une compatibilité officielle de la seule validité d'un JSON.

Les difficultés `EASY`, `NORMAL`, `HARD`, `EXTREME` et `EX EXTREME` décrivent la partition. Elles **ne changent pas automatiquement le profil de jugement**.

## 3. Fenêtres de jugement

La valeur absolue de l'erreur détermine le jugement. La borne supérieure de chaque ligne est incluse ; la ligne suivante commence strictement au-delà de la borne précédente.

| Jugement | Standard | Accessible | Précision |
| --- | --- | --- | --- |
| COOL | ≤33 ms | ≤45 ms | ≤25 ms |
| FINE | >33 à 67 ms | >45 à 90 ms | >25 à 50 ms |
| SAFE | >67 à 100 ms | >90 à 135 ms | >50 à 75 ms |
| SAD | >100 à 140 ms | >135 à 180 ms | >75 à 100 ms |
| MISS | >140 ms | >180 ms | >100 ms |

Les profils sont nommés `standard`, `accessible` et `precision`. Un nom inconnu est refusé. Sans option de profil, le moteur choisit `standard`.

À une frontière, la comparaison s'effectue sur le nombre JavaScript effectivement calculé. Les tests du classificateur utilisent les valeurs relatives exactes et leur voisin immédiatement au-delà choisi dans la fixture. Ils ne prétendent pas que toute addition de décimales est représentée exactement en virgule flottante.

Lors d'un nouvel appui, le moteur choisit la note encore en attente de **même lane la plus proche**. À égalité exacte, il conserve la première dans l'ordre chronologique. Une note déjà jugée ne peut pas être consommée deux fois. Une touche déjà maintenue n'est pas un nouvel appui.

Une note non jouée expire strictement après sa borne tardive. L'appel `finish()` termine les notes encore en attente en MISS. Les notes exclues d'une section d'entraînement ne deviennent pas des MISS.

### Mauvaise touche et appui hors contexte

Si aucune tête correspondante n'est disponible, mais qu'une autre note en attente se trouve dans la fenêtre de l'appui, le moteur émet **WRONG**. La bonne note reste disponible : le joueur peut encore la frapper.

Un appui éloigné de toute note ne produit pas de WRONG. Il laisse toutefois la touche dans l'état maintenu ; il faut la relâcher pour produire un nouvel appui. Cette règle évite qu'un maintien anticipé valide automatiquement une tête future.

## 4. Points, vie, combo et résultats

| Événement | Points de base par note | Variation de vie | Combo |
| --- | --- | --- | --- |
| COOL | 1 000 | +2 | +1 |
| FINE | 750 | +1 | +1 |
| SAFE | 400 | 0 | Remis à 0 |
| SAD | 100 | −8 | Remis à 0 |
| MISS | 0 | −14 | Remis à 0 |
| WRONG | 0 ; aucune note consommée | −6 | Remis à 0 |

La vie commence à **127** et reste dans l'intervalle **0–255**. Atteindre zéro déclenche `failed` sauf en `noFail`. L'échec reste acquis pour cette tentative. L'application termine alors le live ; un `reset()` démarre une nouvelle tentative.

- `baseScore` est la somme des points des têtes.
- `holdBonus` contient uniquement les bonus de maintien.
- `score` est la somme de ces deux valeurs.
- La précision finale est `100 × baseScore / (nombre total de notes prises en compte × 1 000)` ; elle vaut zéro pour une section vide.
- Le HUD utilise pendant la partie le nombre de notes **déjà traitées** comme dénominateur. Il peut donc afficher une précision différente du bilan d'une tentative interrompue, dont les notes restantes deviennent des MISS.
- Un **CLEAR** demande au moins 60 % de précision et aucune défaite.
- Un **FULL COMBO** demande au moins une note, exclusivement des COOL/FINE sur toutes les notes et zéro WRONG. Il ne demande pas d'obtenir tout le bonus HOLD.

WRONG ne change pas directement la précision, puisque cet événement n'ajoute ni note au dénominateur ni point négatif au score de base. Une tentative peut donc afficher 100 % avec un WRONG et ne pas être FULL COMBO. De même, une tentative entièrement FINE peut être FULL COMBO à 75 %.

| Précision finale | Grade |
| --- | --- |
| ≥99 % | S+ |
| ≥95 % et <99 % | S |
| ≥90 % et <95 % | A |
| ≥80 % et <90 % | B |
| ≥70 % et <80 % | C |
| ≥60 % et <70 % | D |
| <60 % | E |

Le grade dépend de la précision ; le drapeau d'échec et le CLEAR restent des informations distinctes.

## 5. Maintien HOLD

Une tête `hold` ou une `chain` frappée directement avec COOL/FINE ouvre un maintien sur sa lane. Son début est **l'instant de l'appui réussi**, et non l'instant théorique de la note.

Le bonus progresse à **200 points par seconde**, en points entiers. La valeur acquise est arrondie à l'entier inférieur sur la durée cumulée ; le code ajoute une tolérance numérique de `1e-6` point pour éviter une perte à certaines frontières décimales. Le calcul porte sur le temps musical et ne dépend pas du nombre de frames.

La durée utile est la plus courte parmi : le maintien réel, la durée de la tête plafonnée à cinq secondes, et la fin d'une section d'entraînement. Le maximum d'une tête maintenue cinq secondes est donc **1 000 points de bonus**. Chaque lane possède son maintien indépendant ; les bonus de plusieurs lanes s'additionnent.

Relâcher accrédite le bonus jusqu'au timestamp du relâchement puis coupe le maintien. Il n'existe pas de jugement séparé de fin de HOLD : un relâchement anticipé ne retire ni les points de tête, ni la précision, ni le combo déjà acquis. Une tête SAFE/SAD ne démarre pas de bonus.

Il n'y a qu'un maintien actif par lane. Une nouvelle tête sur cette lane remplace le maintien précédent après traitement du temps écoulé. Le bonus déjà acquis reste conservé.

**Compatibilité actuelle des durées nulles :** `duration: 0` est accepté par le validateur. Lors d'une pression directe sur une tête `hold` ou `chain`, zéro ou une durée absente de valeur utile déclenche actuellement la valeur de repli de cinq secondes. Pour un maillon `chain` validé automatiquement, la valeur de repli est de 0,3 seconde. Cette différence est explicitée pour éviter une modification silencieuse des anciens contenus ; elle n'est pas présentée comme une règle officielle.

## 6. Slides et chaînes

Sur les lanes 4/5, une tête `slide` ou `chain` jugée COOL/FINE arme la direction. Tant que cette direction reste tenue, un maillon `chain` atteint à son instant cible reçoit COOL, sans nouvel appui. Son erreur est zéro et il compte comme une note dans le score, la précision et le combo.

Une tête `slide` simple ne crée pas elle-même de bonus HOLD. Chaque maillon automatique crée un maintien de sa durée, plafonnée à cinq secondes, avec le repli de 0,3 seconde décrit ci-dessus. Le maillon suivant peut remplacer ce maintien sur la même lane.

Relâcher ou effacer les entrées désarme la direction. Un appui effectué longtemps avant une tête n'arme rien. Une tête SAFE/SAD ne suffit pas à armer la chaîne. Il n'existe actuellement pas de délai maximal séparant deux maillons pour une direction demeurée armée et maintenue.

Les replays dont `engine` commence par `3.` activent explicitement `legacyChains` : ils conservent l'ancienne interprétation qui acceptait le prémaintien sans tête réussie. Une partie courante n'active pas cette compatibilité.

## 7. Accords et sources d'entrée

Un accord est un ensemble de notes au même instant sur plusieurs lanes. Chaque note possède son jugement, ses points et sa variation de vie. Il n'existe pas de multiplicateur supplémentaire de score pour l'accord.

Clavier, manette, tactile et MIDI alimentent les mêmes lanes. L'application suit les sources séparément : une seconde source déjà active sur la même lane ne crée pas une deuxième frappe ; la lane n'est relâchée qu'après disparition de sa dernière source.

Les répétitions automatiques du clavier ne sont pas de nouveaux appuis. Les commandes tactiles utilisent le timestamp des événements de pointeur ; annulation et perte de capture libèrent la source. Le routeur MIDI considère Note On de vélocité zéro comme un relâchement et évite de répéter un Note On déjà actif. Les entrées manette proviennent du polling navigateur : les fixtures logiques ne qualifient pas leur latence physique.

Les raccourcis clavier d'accords autorisent au maximum huit raccourcis, chacun avec deux à quatre lanes distinctes parmi 0–3. L'option d'accords manette associe L2 à △+□ et R2 à ×+○. Ces raccourcis n'altèrent pas les instants des notes. Ils ne créent actuellement pas une catégorie distincte de records.

## 8. Modes, entraînement et pause

| Mode | Jugements et échec | Records normaux |
| --- | --- | --- |
| Live `play` | Profil choisi ; échec possible à vie zéro | Éligible si `noFail` est désactivé et si la tentative est CLEAR |
| Live avec `noFail` | Jugements conservés ; pas d'échec à vie zéro | Non |
| `practice` | Section, vitesse et boucles ; moteur sans échec | Non |
| `autoplay` | Têtes jouées automatiquement à leurs instants exacts | Non |
| `replay` | Entrées enregistrées et profil du replay | Non |
| `pv` | Lecture de scène sans `JudgeEngine` | Non |

Une section d'entraînement prend les notes dont le temps audio cible appartient à **[début, fin[**. Le code conserve une tolérance de `1e-7` seconde sur la borne de début. Chaque tentative remet score, vie, combo et états des notes à zéro/leur valeur initiale. Une queue de HOLD ne peut gagner de bonus au-delà de la fin.

`safePractice` accepte un passage d'au moins 0,5 seconde, une vitesse de 0,25 à 1,5, un objectif de précision entre 50 et 100 % et un pas entre 0,01 et 0,25. La progression adaptative d'un ralenti n'augmente la vitesse qu'après une tentative non vide, sans échec, atteignant l'objectif et ne comptant aucun MISS ni WRONG. Elle s'arrête à vitesse 1. Le traitement à hauteur conservée conserve les timestamps originaux, avec ses propres limites de durée/mémoire.

Mettre en pause arrête le transport, libère les sources réelles et termine les maintiens actifs. La reprise ne rétablit pas automatiquement un HOLD déjà relâché par la pause. La lecture de replay préserve séparément l'état de ses entrées virtuelles pour pouvoir reprendre le même enregistrement.

Une interruption du contexte audio ou un document masqué met le live en pause. Le retour du contexte à l'état actif ne suffit pas à relancer le morceau : la reprise reste explicite. Une préparation périmée après sortie du jeu ne doit pas démarrer un ancien live.

## 9. Replays et records

Un replay conserve la partition, le profil, les entrées `time/lane/down`, la version du moteur, le mode `noFail` et une fin de lecture. Le validateur demande le format `DIVA-PULSE-REPLAY`, une partition non vide et au maximum 200 000 entrées. Il accepte des timestamps de −40 à 7 500 secondes et vérifie leur ordre avec la tolérance numérique existante.

La simulation avance le moteur au timestamp de chaque entrée avant d'appliquer l'appui ou le relâchement. Elle utilise le profil enregistré. La validation ne doit pas être confondue avec une preuve d'authenticité ou un mécanisme anti-triche ; les replays et records sont locaux.

Le replay ne conserve pas la cadence des mises à jour du live ni les délais de livraison des événements d'origine. Son recalcul remet les entrées dans la séquence temporelle enregistrée ; il ne reproduit donc pas nécessairement un ancien live ayant traité une entrée après une mise à jour plus avancée, ni les effets d'anciens défauts d'ordonnancement. **Aucun résultat numérique identique n'est garanti pour le recalcul de tous les anciens replays**, même lorsque leur format reste lisible et que leur clé de record reste sous `rules4`. La compatibilité explicite `legacyChains` conserve les règles de chaînes prévues pour les replays V3 ; elle ne rejoue pas une copie complète de chaque moteur historique.

La clé d'un record contient l'identifiant du morceau, celui de la partition, sa signature et `/rules4`. Les profils non standards ajoutent `/profile-accessible` ou `/profile-precision`. En cours de live, la clé utilise le profil de la prise, même si les réglages globaux changent.

La signature actuelle inclut l'offset et les paramètres des notes : temps, lane, type, coordonnées, durée, approche, angle et distance. Les records antérieurs à `rules4` restent dans les sauvegardes ; ils ne remplacent pas automatiquement un record `rules4`. Ce lot ne lance **aucune migration ni aucun recalcul des records existants**, y compris ceux déjà enregistrés sous `rules4`, et ne les supprime pas. Un score historique peut ainsi rester affiché même si le recalcul de son replay donne un résultat différent après une correction d'ordonnancement. Leur éventuelle requalification demanderait une décision et un traitement distincts.

Un nouveau record doit être éligible, CLEAR, et dépasser strictement le **score total** du record précédent. Une égalité ne remplace pas le record. Le score total comprend le bonus HOLD : la sélection du meilleur record ne se fait donc pas uniquement sur la précision affichée.

## 10. Cibles visibles et séparation de la présentation

Le dessin utilise le profil réellement porté par le moteur de la prise : sa borne tardive est de 140 ms en standard, 180 ms en accessible et 100 ms en précision. La borne de dessin est incluse. La sélection rapide de candidats reçoit cette borne et garde une marge conservative d'une milliseconde ; le dessin applique ensuite la borne exacte et l'état réel de chaque note.

Cela corrige l'ancienne disparition fixe à +150 ms : une cible accessible encore en attente à **+170 ms** reste visible et peut recevoir SAD. Cette correction n'élargit aucune fenêtre de jugement. La sélection des notes à longue approche, le décalage de partition, le décalage visuel et le multiplicateur de vitesse d'approche gardent leur sens.

Le dessin retire aussi les notes déjà jugées. Les horloges visuelle et de jugement restent volontairement réglables indépendamment : cette correction ne transforme pas une calibration incohérente entre ces deux réglages en mesure automatique de latence.

Les VFX/SFX, animations de combo et jauges HOLD lisent l'état du moteur. Ils ne changent ni le barème, ni les timestamps, ni les résultats, ni les replays. Les effets ne doivent pas figer l'horloge musicale ou les entrées.

## 11. Oracles de contrôle

Les valeurs ci-dessous sont écrites explicitement dans la fixture. Le harnais ne recalcule pas les valeurs attendues à partir des constantes de `core.js`.

| Cas | Résultat attendu |
| --- | --- |
| `TAP-01` | Un COOL malgré une pression répétée : 1 000 points, 100 %, vie 129. |
| `SCORE-01` | COOL/FINE/SAFE/SAD : 2 250 points, 56,25 %, vie 122, combo maximal 2. |
| `CHORD-01` | Deux COOL simultanés : 2 000 points, 100 %, vie 131, combo 2. |
| `CHORD-02` | Une note d'accord manquée : 1 000 points, 50 %, vie 115. |
| `WRONG-01` | WRONG puis COOL : 1 000 points, 100 %, vie 123, sans FULL COMBO. |
| `IDLE-01` | Appui hors contexte puis COOL : aucun WRONG. |
| `HELD-01` | Prémaintien sans réappui : un MISS et vie 113. |
| `HOLD-01` | Maintien de 755 ms : 151 de bonus, total 1 151, FULL COMBO conservé. |
| `HOLD-02` | Durée déclarée 30 s : 1 000 de bonus au maximum, total 2 000. |
| `HOLD-03` | Deux lanes maintenues : 300 + 400 de bonus, total 2 700. |
| `HOLD-04` | Tête SAFE : 400 points de base, aucun bonus. |
| `CHAIN-01` | Tête chain puis deux maillons : trois COOL, bonus 140, total 3 140. |
| `CHAIN-02` | Tête slide puis deux maillons : trois COOL, bonus 100, total 3 100. |
| `CHAIN-03` | Prémaintien sans tête : deux MISS en règles actuelles. |
| `CHAIN-04` | Relâchement exactement sur le maillon : deux COOL, bonus 40, total 2 040. |
| `PRACTICE-01` | Intervalle [2,4[ : deux notes sur quatre, bonus 300, total 2 300. |
| `PRACTICE-02` | Fin de passage bornant le maintien : bonus 200, total 1 200. |
| `NEAREST-01` | Deux têtes proches : la seconde est FINE, la première MISS ; 750 points. |
| `NEAREST-02` | Équidistance : première tête SAD, seconde MISS ; 100 points. |
| `EMPTY-01` | Aucune note : précision zéro, aucun CLEAR/FULL COMBO. |

La même suite vérifie les frontières signées des trois profils, les seuils de grades, les limites de vie, la différence entre no-fail et échec, l'offset, les difficultés, les clés de records et la compatibilité replay V3. Les variantes de cadence et de replay de ces fixtures, dont les entrées sont livrées chronologiquement, sont comparées aux **mêmes valeurs chiffrées attendues**, pas seulement entre elles. Elles ne garantissent pas l'identité du résultat historique de replays quelconques avec leur recalcul.

Les contrôles du rendu exécutent la véritable méthode `App.drawGame` sur un Canvas instrumenté, sans démarrer le navigateur. Ils prouvent la sélection des cibles et l'absence d'écriture dans les résultats ; ils ne constituent ni une capture visuelle sur appareil, ni un benchmark GPU.

Commande ciblée :

```sh
node --test tests/rules-contract.test.cjs
```

Pour vérifier un changement runtime complet, utiliser aussi les contrôles du [guide gamedev](GUIDE_DEVELOPPEMENT_GAMEDEV.md), reconstruire les deux HTML et exécuter les scénarios navigateur concernés. Les rapports de validation doivent citer le commit/build réellement testé ; ce document n'est pas un rapport de réussite de ces contrôles supplémentaires.

## 12. Décisions et validations encore ouvertes

- **Édition de référence officielle :** choisir l'édition et les règles visées avant toute comparaison 1:1. Une telle comparaison peut demander un profil de règles distinct plutôt qu'une modification des anciens records.
- **Durées nulles et types atypiques :** préciser une éventuelle évolution du schéma avant de remplacer les valeurs de repli historiques. Les contenus existants ne doivent pas changer silencieusement de score.
- **Portée d'un armement de chaîne :** aucune coupure par intervalle maximal n'est actuellement définie entre maillons ; toute nouvelle règle doit être spécifiée et versionnée.
- **Aides et classement :** définir si les raccourcis d'accords, périphériques ou autres aides futures doivent avoir des catégories séparées. Le contrat décrit les clés actuelles, sans inventer une compétition certifiée.
- **Latence matérielle et cadence réelle :** qualifier clavier, tactile, MIDI, manettes, navigateurs et appareils selon `GAME-04`, `GAME-07`, `QA-02`, `QA-03` et les points de performance. Des timestamps synthétiques ne prouvent pas la latence acoustique ni la qualité du polling manette.
- **Replays et évolutions :** maintenir des fixtures de compatibilité lors de tout changement de l'ordre des événements, du barème ou des schémas. Le choix `legacyChains` est la compatibilité actuellement explicite ; il ne certifie pas toutes les versions historiques du jeu.
