# Format des partitions — V5, extensions compatibles

## JSON natif

```json
{
  "format": "DIVA-PULSE",
  "version": 4,
  "id": "ma-partition-normal",
  "title": "Ma chanson",
  "difficulty": "NORMAL",
  "bpm": 120,
  "offset": 0,
  "source": "manual",
  "tempoMap": [{ "time": 0, "bpm": 120 }],
  "notes": [
    {"id":"n1","time":1.25,"lane":0,"type":"tap","x":0.25,"y":0.40,"duration":0,"approach":1.6},
    {"id":"n2","time":2.00,"lane":3,"type":"hold","x":0.50,"y":0.35,"duration":3,"approach":1.6},
    {"id":"n3","time":2.00,"lane":1,"type":"tap","x":0.60,"y":0.35,"duration":0,"approach":1.6}
  ]
}
```

Les temps et durées sont en secondes, le BPM en pulsations par minute. `time` désigne l’instant de frappe sur l’audio, avant `offset`. L’offset positif retarde toutes les cibles. Les coordonnées X/Y sont normalisées dans la zone 16:9, origine en haut à gauche. Les coordonnées hors écran restent admises dans une plage bornée pour préserver certains placements importés ; elles ne sont pas réarrangées.

`lane` : 0 triangle, 1 carré, 2 croix, 3 cercle, 4 slide gauche, 5 slide droite. `type` : `tap`, `hold`, `slide`, `chain`. Une CHAIN utilise une direction maintenue ; plusieurs cibles successives peuvent partager cette direction. Deux notes sur des touches différentes au même temps forment un accord. Deux notes sur la même touche au même temps sont refusées.

`approach` est la durée d’approche en secondes, bornée entre 0,08 et 15. `angle`, quand fourni, est l’angle de provenance en degrés. `distance` est un facteur de distance de vol. Les champs inconnus sont conservés, mais ne deviennent pas automatiquement des fonctions de gameplay.

`difficulty` : `EASY`, `NORMAL`, `HARD`, `EXTREME`, `EX EXTREME`. La `tempoMap` est une liste triée `{time,bpm}` : temps en secondes dans l’axe de la partition, avant `offset`. La grille et le métronome V3 intègrent les pulsations entre ces événements. Les cibles restent définies en secondes ; ajouter un tempo ne les déplace pas. `gridOffset` définit l’origine de grille sans déplacer l’audio. Sans `meterMap`, les repères restent en 4/4. La V5 accepte une carte de signatures qui pilote la grille, les accents et le montage ; voir `FORMAT_METRIQUE_ET_MIDI_V5.md`.

## Import DSC FT/MM+

Référence de travail consultée : notes techniques de l’auteur de Project-DS :
https://github.com/Hydr8gon/Project-DS/blob/master/notes.txt
Révision du fichier consulté : `f9ad9d94d02601b277c052e9a1e3c46c6abeb950`.

La table des tailles des commandes couvre les opcodes 0x00 à 0x6A décrits par cette référence. Les mots sont de 32 bits little-endian. Le premier mot est gardé comme en-tête. La table permet d’avancer correctement dans les commandes non rythmiques, qui sont conservées comme provenance mais ne reproduisent pas les PV officiels.

- TIME : unités de 10⁻⁵ seconde.
- MUSIC_PLAY : point de départ de l’audio dans le script.
- TARGET_FLYING_TIME : durée d’approche en millisecondes.
- BAR_TIME_SET : approche = (60 / BPM) × (BPB + 1).
- TARGET : type, X/480000, Y/270000, angle/1000, distance/480000 et paramètres bruts.

Temps de frappe importé = temps TARGET + durée de vol − temps MUSIC_PLAY.

Types pris en charge : 0–3 (triangle/cercle/croix/carré, remappés vers les lignes natives), 4–7 (HOLD), 12/13 (slides), 15/16 (CHAIN), 18–21 (types événement reconnus comme cibles). Les commandes visuelles, branches, règles d’événement, ondulations de trajectoire et systèmes de score ne sont pas reproduits intégralement. Les deux paramètres d’ondulation restent dans `sourceArgs`, sans animation identique garantie.

Le jeu refuse les opcodes inconnus, commandes tronquées, types inconnus, temps de vol hors plage ou notes situées dans une branche non gérée. MUSIC_PLAY absent produit un avertissement d’origine audio supposée à zéro. Une partition finissant après l’audio produit un avertissement d’incompatibilité de durée. Pas d’extraction FARC ni de déchiffrement.

`CONTROLE_SYNTHETIQUE_FT.dsc` est écrit par `tests/make_fixtures.py`. C’est un test de format original, pas la validation d’un DSC commercial complet.

## CSV simplifié

```csv
time,lane,type,x,y,duration
1.25,0,tap,0.25,0.40,0
2.00,3,hold,0.50,0.35,3
```

Les séparateurs virgule et point-virgule sont admis ; le séparateur décimal reste le point. Des positions omises sont remplacées par le centre. Le CSV n’emporte pas BPM, offset, scène, paroles, angles et provenance exhaustive. Utiliser JSON ou `.pulsepack` pour un archivage complet du format natif.

## Plans PV

```json
{"time":12,"camera":"wide","dance":"wave","stage":"sakura"}
```

Plans triés par temps, regroupés dans `scene.events`. Caméras : `auto`, `front`, `close`, `wide`, `orbit`, `high`. Mouvements : `idol`, `step`, `wave`, `clap`, `reach`, `spin`, `pose`. Scènes : `arena`, `rooftop`, `sakura`, `orbital`. Le dernier plan atteint s’applique. Le montage ne reconstruit pas des mouvements de caméra ou une animation propriétaire à partir d’un DSC.

## Validation V3 sans correction silencieuse

Les temps de note doivent être finis entre 0 et 7 200 secondes. Maximum 50 000 notes. BPM entre 20 et 400. Offsets entre −30 et +30 secondes. Durées entre 0 et 30 secondes et approche entre 0,08 et 15 secondes. Les coordonnées doivent être finies et comprises entre −4 et 5, ce qui préserve certains placements intentionnellement hors écran ; le contrôle de partition les signale. Un ID dupliqué est renommé, mais une note simultanée sur la même touche est refusée. Les cartes de tempo ont au plus 4 096 entrées et ne peuvent pas avoir deux BPM au même instant.

L’audit est non destructif et distingue erreurs, avertissements et indications. Il repère entre autres cibles hors cadre, audio dépassé, collisions visuelles simultanées, répétitions rapides, accords surchargés et maintiens coupés. Il ne certifie pas une difficulté, un mapping officiel ou une qualité artistique.

## Standard MIDI File

Lecture des formats 0 et 1. Type 2 refusé explicitement. Timing PPQN et SMPTE (24/25/29,97/30 fps), notes on/off et vélocité nulle, running status, métadonnées tempo/nom/paroles/signature, saut borné des SysEx. Pas de synthèse d’un instrument MIDI : l’audio reste importé séparément. Plafonds : 16 Mo, 256 pistes, 500 000 événements et 50 000 notes. Les fins de notes absentes donnent un avertissement et sont fermées en fin de piste.

Mapping Pulse : notes MIDI 60 à 65 vers les six touches. Mapping adapté : répartition de hauteur vers les quatre touches principales ; les collisions d’un accord peuvent être déplacées vers une touche libre. Les notes ignorées et réaffectées sont dénombrées. Les durées assez longues deviennent HOLD/CHAIN si l’option est activée. Le convertisseur n’essaie pas de deviner la partition SEGA d’une chanson.

Export : SMF 1, résolution 9 600 ticks par noire, piste de tempo et piste de notes. Les touches sont écrites sur les hauteurs 60–65. L’instant audible exporté vaut `note.time + chart.offset`. Les notes avant le temps zéro ne sont pas exportées ; corriger l’offset ou utiliser JSON. Une métadonnée texte `DIVA-PULSE-CHART:` suivie du JSON natif conserve la partition complète. Elle sert au réimport exact ; les événements MIDI standard sont arrondis à leur résolution.

## Replay `.pulsereplay`

Objet JSON avec `format: "DIVA-PULSE-REPLAY"`, `version: 1`, `engine`, `chart`, `inputs`, `endTime`, `audioHash`, `demoId` éventuel et `noFail`. `inputs` contient les transitions `{time, lane, down}` triées, dans l’axe audio corrigé de la compensation de saisie. Les entrées de plusieurs sources d’une même touche sont agrégées. Pas d’audio embarqué, de signature de confiance ni de score en ligne. L’import est borné à 24 Mo et 200 000 transitions.

## Sauvegarde `.pulsepack` V3

`format: "DIVA-PULSE-LIBRARY"`, `version: 3`, listes `songs`, `assets`, `scores`, objet `settings` et `v3State` contenant les setlists et les sessions locales. Les médias référencés sont encodés en base64. À la restauration : validation, confirmation, nouveaux IDs de morceaux/médias, remappage des références, rattachement facultatif des records et remplacement facultatif des préférences. Les sessions et replays ne sont pas fusionnés automatiquement. Les schémas V2 compatibles sont également acceptés. Les archives V1 inconnues ne sont pas converties.

## Scène V3

`scene.blend` (0–3 s), `lights` (booléen), `spacing` (0,7–1,5), `modelRotation` (−180 à 180°), `modelScale` (0,3–3). L’offset vidéo est `song.videoOffset`, distinct de l’offset des cibles. Les contrôles de modèle s’appliquent au GLB importé complet ; pas de retargeting MMD. Le public et les projecteurs existent sur Arena/Rooftop.

## Extension V4 — sections, catalogue et brouillons

Le moteur indique `version: 4` dans ses partitions normalisées. Les formats natifs V2/V3 valides restent lisibles ; le numéro du moteur et celui de chaque conteneur (catalogue, MIDI, replay) ne doivent pas être confondus.

`sections` est une liste de `{ id, label, from, to }`, où les bornes sont des secondes dans le temps audio, pas des numéros de mesure. `from < to`, valeurs finies et positives ; 200 sections maximum. Le studio vérifie les bornes du morceau. L’offset de partition s’applique aux notes, pas une seconde fois à ces sections.

Une association `.pulsecharts` donne `source: "catalogue"`, avec `parent` et `provenance`. La source est immuable dans le studio ; enregistrer une modification produit `manual-derived`. Le générateur V4 ajoute ses réglages (graine, densité, style, quantification, tempos détecté/utilisé, confiance), mais ces champs ne rendent pas le niveau officiel.

Les brouillons sont des enregistrements distincts de la base `settings`, identifiés par `draft:<songId>:<originalChartId>`. Ils contiennent la partition et son propriétaire. Ils ne remplacent pas une ligne de partition source. L’export de bibliothèque V4 transporte ces brouillons ; la restauration remappe le morceau propriétaire vers sa copie.

Les records V4 comportent `rulesVersion:4` et une clé se terminant par `/rules4`. Cette séparation évite qu’un résultat sous l’ancienne interprétation des chaînes soit comparé silencieusement au nouveau barème.


## Extensions V5

La version du moteur est 5.0.0. Le JSON de chart reste dans le schéma natif additif V4 : `meterMap` est un champ optionnel validé en V5. Les règles normales de score restent rules4, sans changement des timings importés.

Le pack `.pulsepack` courant utilise `version:5` et ajoute `v5State:{id:"v5-state",academy:{...}}`. Chaque résultat d’Académie possède une précision de 0 à 100, un booléen `completed` et un compteur entier de tentatives entre 0 et 1 000 000. Seuls les six identifiants de leçon connus sont fusionnés. Meilleure précision, médaille acquise et maximum de tentatives sont conservés. Cette fusion ne certifie pas l’origine du résultat et n’est pas un anti-triche.

Les exemples et champs V3/V4 ci-dessus restent utiles pour leur rétrocompatibilité. Les sections « V3 » décrivent le format historique, pas une promesse d’enregistrer les nouveaux réglages V5 dans une application V3.
