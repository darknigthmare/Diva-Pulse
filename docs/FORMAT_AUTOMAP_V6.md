# Format et fonctionnement AutoMap V6

## Portée

L’objectif est de créer des partitions locales jouables et liées entre elles à partir d’un audio décodable, pas de retrouver les décisions uniques d’un créateur de niveau officiel. L’algorithme est une implémentation heuristique originale en JavaScript. Il n’appelle pas de service distant, de modèle de transcription vocale ni de bibliothèque d’analyse tierce.

Le moteur historique de lecture/scoring reste compatible avec les notes natives. Les ajouts concernent l’analyse, le choix des événements et leurs métadonnées. Les notes restent exprimées en secondes, indépendamment de la grille musicale utilisée dans l’éditeur.

## Analyse sonore

`PulseCore.analyzeMusicPCM(channels, sampleRate, onProgress)` est une fonction autonome sérialisable dans un Worker. L’application décode le fichier via Web Audio puis rééchantillonne séparément jusqu’à deux canaux à 22 050 Hz avec `OfflineAudioContext`.

La détection emploie une FFT de 1 024 échantillons, fenêtre de Hann et pas proche de 10 ms. Les magnitudes des canaux sont agrégées après le calcul spectral ; les PCM ne sont pas simplement additionnés. Cela permet d’observer des attaques alternant gauche/droite et d’éviter qu’une opposition de phase rende artificiellement le signal silencieux pour l’analyse.

La nouveauté positive est calculée dans trois plages : grave sous 250 Hz, médium jusqu’à 2 500 Hz et aigu au-delà. Les valeurs sont normalisées par bande avant combinaison. Des pics sont sélectionnés relativement au contexte local, puis leur instant est affiné avec une enveloppe courte. Les tests sur impulsions synthétiques vérifient une erreur inférieure à 14 ms pour les cinq tempos de contrôle ; ce seuil n’est pas une garantie sur des voix ou des mixages réels.

Une autocorrélation de la pulsation évalue plusieurs tempos. La phase est estimée puis le tempo peut être ajusté à partir des repères. Les alternatives sont gardées : le tempo humainement choisi peut être moitié ou double de celui de l’algorithme. Des fenêtres locales de seize secondes, espacées de douze secondes, servent à avertir des écarts significatifs. Elles ne créent pas une carte exacte de tempo, et les morceaux courts ne disposent pas forcément de plusieurs fenêtres.

L’énergie produit des régions audibles et des zones de repos. Le signal peut être déclaré silencieux ou trop pauvre pour une génération utile. Le système ne complète pas une durée vide en posant mécaniquement une note à chaque temps.

### Objet d’analyse

Le champ `song.analysis` contient notamment :

```text
version: 6
algorithm: "multiband-family-v6"
duration, bpm, phase, confidence
onsets[]: time, strength, centroid, energy, bands[3], confidence, frame
energy[]: time, value
regions[]: from, to
tempoWindows[]: from, to, bpm, ...
candidates[], tempoCandidates[]
variableTempo, silent, channels, clippingRatio, warnings[]
```

Les temps sont en secondes. L’indice `confidence` est une combinaison heuristique de régularité et d’alignement ; il n’a pas été calibré comme probabilité statistique d’une transcription correcte.

## Génération de famille

`PulseCore.generateChartFamily(analysis, options)` renvoie `familyId`, `charts`, `report`, `analysis`, `options`.

La première étape élimine les événements inutilisables, hors durée, en silence détecté ou trop rapprochés. La quantification, lorsqu’elle est active et raisonnablement fiable, ne rapproche que les attaques à moins de 25 ms d’une grille. Les autres gardent leurs instants détectés. Une variation probable de tempo désactive la quantification automatique ; un BPM saisi n’autorise pas pour autant un étirement global des notes.

Les événements reçoivent une importance selon leur force, leurs bandes spectrales, leur énergie et leur position estimée dans la pulsation. Ils sont regroupés en phrases approximatives de huit temps. EASY conserve les repères principaux ; chaque palier conserve entièrement le précédent puis ajoute des événements à son budget. Ces phrases sont des segments rythmiques, pas des refrains reconnus sémantiquement.

Les motifs de touches dépendent de la forme rythmique, d’une graine et de la position dans la phrase. Les passages présentant la même figure utilisent donc un motif stable. La graine modifie les choix de mapping, pas le fichier audio. Les notes communes gardent leurs touches et leur position dans toutes les difficultés ; les cibles de futurs accords sont réservées dans la disposition des paliers inférieurs pour éviter un déplacement silencieux.

### Profils de difficulté

Ces contraintes sont propres à DIVA PULSE et ne prétendent pas reproduire les rangs de Project DIVA.

| Niveau | Écart minimal entre événements | Pic maximal sur 1 s, accords inclus | Plafond soutenu sur 4 s | Taille max. d’accord | Approche de base |
|---|---:|---:|---:|---:|---:|
| EASY | 440 ms | 3 notes | 8 notes | 1 | 2,30 s |
| NORMAL | 275 ms | 5 notes | 12 notes | 1 | 2,00 s |
| HARD | 175 ms | 7 notes | 17 notes | 2 | 1,75 s |
| EXTREME | 120 ms | 10 notes | 24 notes | 3 | 1,50 s |
| EX EXTREME | 87,5 ms | 13 notes | 32 notes | 4 | 1,30 s |

Le plafond soutenu est `ceil(sustained × 4)` dans le code. Les pics sont évalués sur des fenêtres glissantes, pas uniquement par seconde entière. Les notes d’un accord simultané sont comptées individuellement. Le curseur de densité modifie un budget souple ; il ne supprime pas les bornes de sécurité.

Les nouveaux accords utilisent des touches distinctes, avec des cibles séparées d’au moins 0,09 en coordonnées normalisées. Les plafonds de tous les niveaux supérieurs sont aussi vérifiés avant d’ajouter un accord qui leur sera transmis. Les slides contradictoires simultanées ne sont pas produites.

Les HOLD ne sont proposés que si un espace suffisamment long reste audible. Ils ne traversent pas la prochaine attaque de la famille complète ; leur durée maximale est de trois secondes. Cette convention volontairement prudente évite les conflits ajoutés par les niveaux supérieurs, mais ne reproduit pas tous les choix de maintien d’un mapper humain.

EASY utilise deux symboles et ne reçoit pas d’accord, HOLD ou slide. NORMAL introduit les quatre symboles et les maintiens. Les slides et accords arrivent à partir de HARD. Un niveau supérieur peut avoir le même nombre de notes qu’un niveau inférieur lorsque le signal ne fournit pas assez d’événements adaptés ; un avertissement l’indique.

### Métadonnées des charts

Les champs natifs sont conservés. `chart.generator` ajoute notamment :

```text
version: 6
algorithm: "coherent-family"
familyId
seed, density, style, focus
quantize, requestedQuantize
detectedBpm, usedBpm, confidence
motifs, attacks, options
quality: notes, nps, peakNps, chords, holds, slides, stars, ok, warnings
```

`note.eventId` et `note.audioTime` relient l’événement à son attaque détectée. La durée, le type, les coordonnées et les angles restent des champs natifs. Les notes communes réutilisent leur `id` entre difficultés ; chaque chart possède son propre identifiant. Le `familyId` est un identifiant de regroupement, pas une signature cryptographique du fichier audio ni un certificat d’intégrité.

Le contrôle indépendant `measureFamily` vérifie les timings, limites du morceau, cadence, densités, accords, espacements, collisions de maintien et inclusion des repères des paliers inférieurs. Il n’interprète pas la qualité artistique du niveau. Les étoiles résultent d’une formule interne de densité/complexité et ne constituent pas une notation officielle.

## Priorité des sources et intégrité

`missingDifficulties(song)` considère un niveau disponible lorsqu’une partition non vide existe dans cette difficulté. Une partition vide n’empêche pas la création d’un niveau jouable. Les variantes existantes ne sont pas supprimées.

`exactCatalogCharts` utilise uniquement des correspondances exactes SHA-256 ou des identifiants de démos intégrées. Un titre semblable reste un candidat nécessitant confirmation et n’est pas automatiquement appliqué. Les charts conservés depuis un catalogue ne sont pas recréés, et leurs offsets ne sont pas ramenés à zéro. La cohérence imbriquée concerne les niveaux V6 produits ensemble, pas un mélange de charts source indépendants.

SHA-256 est calculé avec SubtleCrypto ou avec le repli Worker `hash-core.js`. Ce repli est vérifié face à `node:crypto` sur plusieurs tailles et vues d’octets. Pour un ancien morceau à empreinte courte, les octets du média stocké sont re-hachés avant migration. Une identité sonore au réencodage n’est pas déduite.

L’audio et la famille nouvellement créée sont enregistrés dans la même transaction. Les nouveaux objets ne sont publiés dans la liste qu’après sa réussite. Une annulation avant cette étape conserve les objets d’origine. Pendant la transaction de commit, l’annulation UI est désactivée. Une panne ne laisse pas la moitié d’un nouveau morceau en mémoire.

Une variante manuelle conserve sa filiation mais n’affiche plus le contrôle de l’ancienne famille comme validation de son contenu actuel. Le rapport historique peut être ouvert séparément. Les champs V6 voyagent dans les sauvegardes au format de pack 5, sans migration destructive imposée.

## Références techniques consultées

Les références suivantes éclairent les principes ; elles ne sont ni des dépendances copiées dans le jeu ni une validation externe de notre implémentation.

- Documentation primaire librosa, *Onset detection* : https://librosa.org/doc/0.11.0/onset.html — nouveauté, pics et localisation d’attaques.
- Documentation primaire librosa, `beat_track` : https://librosa.org/doc/main/api/generated/librosa.beat.beat_track.html — distinction entre force des attaques, estimation de tempo et sélection de pulsations.
- Documentation de l’API Web, `OfflineAudioContext.startRendering()` : https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext/startRendering — rendu audio hors ligne utilisé pour préparer les canaux.

La partie musicale est une heuristique originale vérifiée par les tests joints. Aucune affirmation de qualité universelle sur l’ensemble d’une discographie n’est tirée de ces références.
