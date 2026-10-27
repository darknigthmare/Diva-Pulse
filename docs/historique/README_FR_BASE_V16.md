## DIVA PULSE V10 FINAL

Voir `README_V10_FINAL.md` pour les nouveautés MMD Director finales.

# DIVA PULSE — AutoMap & Coherent Difficulties Edition 6.0

Version autonome construite à partir de l’archive **V5 Precision Edition** fournie dans cette conversation. Le jeu, les sources, les trois instrumentaux de base, leurs quinze partitions et les six leçons de l’Académie sont conservés. La V6 ajoute surtout l’import audio automatique avec une famille de cinq difficultés cohérentes et un contrôle de jouabilité avant sauvegarde.

**Le rendu et le barème restent ceux d’un jeu indépendant, pas une reproduction complète 1:1 de Project DIVA.** Aucun morceau, modèle ou clip officiel n’est embarqué. Aucun ancien site n’a été redéployé.

## Jouer tout de suite

Décompresser l’archive puis ouvrir `DIVA_PULSE_JOUER.html`. Tout le code, les styles et la scène procédurale sont intégrés dans ce fichier ; `index.html` est identique. Il n’y a pas de CDN, de compte ni de clé API nécessaire. Le navigateur doit prendre en charge JavaScript, Web Audio et les Workers pour l’analyse musicale ; certains contextes de fichier local limitent ces fonctions ou le stockage.

Pour une origine locale stable, utiliser `LANCER_WINDOWS.bat` ou `LANCER_MAC_LINUX.command`, avec **Python 3 déjà installé**, ou :

```sh
python3 lancer.py
```

Le lanceur écoute uniquement `127.0.0.1:8765`. Garder sa fenêtre ouverte. Ctrl+C l’arrête. Il ne change pas silencieusement de port si une autre version est déjà ouverte. Changer volontairement le port change aussi l’origine du stockage.

**Avant de quitter la V5 : exporter sa bibliothèque en `.pulsepack`.** Dans la V6, importer ce pack depuis Réglages. La restauration crée des copies ; le remplacement des réglages reste facultatif. Le format de pack conserve le numéro de schéma 5 et les champs V6 sont additifs. Le runtime est bien 6.0.0. La base IndexedDB garde son nom historique `diva-pulse-stage-v2` ; cela ne garantit pas un transfert automatique entre deux fichiers, navigateurs ou adresses.

**Si le badge indique TEMPORAIRE, exporter la bibliothèque avant de fermer.** Même avec le stockage local actif, conserver régulièrement un export externe. Les brouillons utilisent le même stockage que la bibliothèque. La fermeture réelle et la persistance IndexedDB n’ont pas été validées dans l’environnement de cette livraison.

## Import musical : le nouveau parcours automatique

Dans **Jouer**, laisser cochée **5 difficultés automatiques**, puis cliquer sur **＋** et sélectionner une ou plusieurs musiques. On peut aussi déposer les fichiers sur la bibliothèque, lorsqu’aucun dialogue n’est ouvert.

Le jeu identifie les octets du fichier par SHA-256, recherche les partitions déjà connues pour ce même fichier, décode l’audio et analyse ses attaques dans un Worker local. Il complète ensuite les niveaux absents : **EASY, NORMAL, HARD, EXTREME, EX EXTREME**. Aucun clic supplémentaire sur « Générer » n’est nécessaire pour un audio exploitable.

Après le traitement, le bilan indique les morceaux prêts, déjà présents, en mode manuel ou à compléter. Le bouton **OUVRIR** sélectionne le morceau. Choisir une difficulté puis **LANCER LE LIVE**. Le bouton **Voir le contrôle du mapping** présente les densités, les contraintes vérifiées et un aperçu sonore des frappes.

Les formats utilisables sont ceux que le navigateur sait réellement décoder : par exemple WAV, MP3, Ogg ou M4A selon ses capacités. Une extension reconnue ne garantit pas que le codec intérieur soit disponible. Les limites applicatives sont **100 Mo et 10 minutes par morceau**, **12 fichiers et 400 Mo par lot**. L’analyse peut être refusée ou dépasser son délai sur une machine insuffisante. Ces plafonds ne constituent pas une promesse de temps de traitement sur téléphone.

### Réutiliser une partition exacte en priorité

Importer d’abord son catalogue `.pulsecharts` dans **Partitions disponibles**, puis l’audio correspondant. Lorsque le SHA-256 correspond exactement et qu’une difficulté manque, la V6 copie cette partition avec ses timings, offsets, positions, angles et provenance. Elle ne la reconstruit pas à partir du son. Les difficultés restantes sont générées séparément.

Une partition déjà présente, qu’elle soit manuelle, importée ou générée, n’est jamais écrasée par l’import automatique. Réimporter le même fichier retrouve le morceau et complète seulement ses difficultés absentes. Les anciennes empreintes courtes sont vérifiées en recalculant le SHA-256 du média stocké avant association.

**Le même titre ne suffit pas.** Une version réencodée, un remaster ou un silence ajouté changent l’empreinte. Le jeu ne les traite pas comme une identité vérifiée. L’association manuelle d’un candidat reste possible avec confirmation dans le catalogue. Un SHA-256 vérifie le fichier, pas l’authenticité d’un chart dit « officiel ».

Le catalogue reste local : aucun service ne recherche ou ne télécharge automatiquement les niveaux SEGA sur Internet.

### Une famille de niveaux, pas cinq tirages indépendants

Les nouvelles difficultés partent de la même chronologie d’attaques. Les repères choisis pour EASY sont conservés dans NORMAL, puis dans les niveaux supérieurs, avec le même instant, la même touche, le même type et la même position. Les niveaux plus difficiles ajoutent des attaques secondaires, des accords et des slides lorsque leurs contraintes le permettent ; la vitesse d’approche peut changer.

EASY utilise deux symboles, sans accords ni maintiens. NORMAL introduit les quatre symboles et des maintiens dans les espaces audibles. HARD peut ajouter des accords doubles et des slides. EXTREME et EX EXTREME enrichissent la densité et les accords dans leurs limites de cadence. Les figures de rythme similaires réutilisent des motifs de touches déterministes.

Les HOLD restent limités à une énergie audible et se terminent avant l’attaque suivante de la famille complète. Les accords conservent des touches distinctes et des cibles séparées. Les slides gauche/droite contradictoires ne sont pas synthétisées dans le même accord.

Un morceau très peu dense peut produire deux difficultés proches, voire de même nombre de notes : le rapport le signale au lieu d’ajouter des frappes arbitraires dans les silences. Ces règles assurent une cohérence structurelle, pas une transcription parfaite de la voix ou de la mélodie.

## Écouter, régler et corriger le mapping

**Voir le contrôle du mapping** ouvre cinq lignes de difficulté avec notes, accords, HOLD, slides, densité moyenne et pic de densité. Les étoiles sont une estimation interne, pas le classement SEGA. L’« indice de pulsation » est un indicateur heuristique, pas un pourcentage de notes correctes.

Régler le début d’écoute et cliquer sur **ÉCOUTER** : pendant douze secondes au maximum, l’audio original joue avec des clics aux instants des frappes. **Arrêter**, fermer le dialogue ou changer d’écran stoppe cette écoute. Aucun record n’est écrit. Le diagnostic s’exporte en JSON.

Le panneau **Réglages → AutoMap Import** permet de changer le profil musical, la densité et l’usage de la grille. Les trois profils sont « équilibré », « accents graves/percussifs » et « accents médiums/aigus ». Ils portent sur les bandes de fréquences du mix, pas sur des pistes voix/instruments séparées.

Dans **Générer / compléter les niveaux**, on peut régler aussi le BPM, la graine, le tracé ruban/arc/orbite, les accords, les HOLD, les slides et une réanalyse complète. Un aperçu précède l’ajout. Annuler ne change pas la bibliothèque. Confirmer ajoute des variantes, sans remplacer les sources. Une sauvegarde refusée conserve l’aperçu pour réessayer.

Quand la pulsation est suffisamment fiable, les attaques à moins de **25 ms** d’une grille peuvent en être rapprochées. Les autres restent à leur instant détecté. Un tempo incertain ou une variation probable désactive la quantification automatique. Les alternatives moitié/double et les estimations locales sont présentées dans le contrôle. La détection ne construit pas une carte exhaustive de changements de tempo ou de signature : le studio reste l’outil de correction.

Le **Studio** conserve les fonctions V3–V5 : waveform, grille droite/ternaire, carte de tempo et de signatures, sections, cibles libres, sélection multiple, copie/duplication, annuler/rétablir, enregistrement clavier/MIDI et brouillons. Modifier un niveau source crée une variante manuelle. Son ancien diagnostic AutoMap n’est pas présenté comme une validation des nouvelles modifications.

## Bibliothèque existante et incidents

Le bouton **Compléter les morceaux sans niveaux** analyse les morceaux personnels incomplets de la bibliothèque. Il demande confirmation et n’ajoute que les difficultés absentes, y compris lorsqu’une copie restaurée partage son audio avec un autre morceau déjà complet. Un média manquant est signalé ; rien n’est téléchargé pour le remplacer.

Un signal silencieux ou sans attaques suffisamment exploitables reste importable comme audio, avec le statut **À COMPLÉTER**, sans cinq faux niveaux vides présentés comme prêts. Un fichier qui ne se décode pas ne crée ni morceau ni média orphelin. Les fichiers suivants d’un lot continuent à être traités après une erreur.

L’annulation arrête la préparation du fichier courant ; les fichiers validés auparavant restent présents. Le bilan distingue « annulé » et « non traité ». Une fois la courte transaction d’enregistrement commencée, le bouton d’annulation est désactivé : la transaction est atomique, pas partiellement annulable. Un échec de transaction ne publie pas la nouvelle famille dans la bibliothèque.

## Ce qui reste disponible depuis la V5

Clavier D/F/J/K pour les symboles et S/L pour les slides, touches réassignables ; adaptateurs manette, tactiles et MIDI selon disponibilité. Entraînement par section, boucle progressive, décompte, calibration, mode sans échec, Autoplay, replays, setlists, statistiques et exports. Le ralenti à hauteur conservée est un traitement WSOLA facultatif limité au mono/stéréo et aux sections de 120 secondes ; des artefacts restent possibles.

L’Académie propose ses six leçons originales et une progression distincte des records. Les scènes procédurales, distributions de personnages, variantes de tenue, montage de caméras, paroles LRC et vidéo locale restent disponibles. Les silhouettes et les chorégraphies ne sont pas les assets officiels. L’import GLB reste un sous-ensemble documenté, pas un import universel MMD/PMX/VMD.

## Exemples nouveaux

Dans `examples/v6/`, `NEON_STEPS_128_ORIGINAL.wav` est un instrumental synthétisé de 36 secondes. L’import seul génère automatiquement cinq niveaux. Le même dossier contient leurs JSON, un catalogue complet et le rapport de contrôle. À réglages identiques et sur le même PCM d’analyse, les repères et motifs sont reproductibles ; les identifiants d’instances ne sont pas supposés identiques.

`SOURCE_EXACTE_100_HARD.pulsecharts` avec son WAV de contrôle illustre la priorité d’un niveau HARD manuel, puis la création des quatre difficultés absentes. Les fichiers dont le nom commence par SILENCE ou AUDIO_INVALIDE sont des cas de test, pas des chansons destinées à jouer.

## Sources, tests et état des manques

`src/automap-core.js` contient l’analyse et le générateur ; `src/hash-core.js` le SHA-256 de repli ; `src/automap-app.js` les parcours d’import et de contrôle ; `src/v6.css` leur présentation. Les modules plus anciens sont conservés pour compatibilité, mais le nouveau parcours appelle le moteur V6.

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
# Avec Python Playwright, Chromium et Xvfb installés :
xvfb-run -a python3 tests/automap_browser_test.py
```

Le rapport courant est `docs/RAPPORT_TESTS.md`. `docs/AUDIT_MANQUANTS_V6.md` distingue les manques réellement corrigés et les chantiers restant ouverts. Les anciens rapports conservés dans l’archive sont historiques ; leurs compteurs ne sont pas additionnés comme s’ils avaient tous été réexécutés sur cette version.

## V8 — MMD Runtime
La V8 ajoute un runtime PMX/VMD natif. Voir README_V8_MMD_RUNTIME.md pour la matrice de compatibilité exacte.

## V9 — MMD Director
La V9 ajoute un mode Director au pack MMD d'un morceau : jusqu'à quatre danseurs PMX simultanés, une motion VMD sélectionnable par emplacement, espacement/rotation/vitesse indépendants et caméra VMD principale. Le bouton **MMD DIRECTOR · MULTI-DANSEURS** apparaît dans Modules après import d'un pack MMD. Les données Director sont incluses dans les sauvegardes `.pulsepack`.
