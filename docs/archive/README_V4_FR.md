# DIVA PULSE — Encore & Library Edition 4.0

Jeu de rythme indépendant construit **à partir de l’archive V3 fournie**, dont le moteur, le studio, les médias d’exemple et les scènes sont conservés. La V4 ajoute un catalogue local de partitions, une génération avec aperçu avant validation, la récupération de brouillons et un entraînement progressif. Le rendu et les règles ne sont pas une copie complète 1:1 de Project DIVA.

## Démarrer et préserver sa bibliothèque

Décompresser toute l’archive. `DIVA_PULSE_JOUER.html` est le jeu autonome : code et styles sont intégrés, sans CDN, compte ni clé API. Le navigateur doit pouvoir exécuter du JavaScript et Web Audio. Une scène 2D simplifiée prend le relais lorsque WebGL 2 n’est pas disponible.

Pour conserver une adresse locale stable, les lanceurs `LANCER_WINDOWS.bat` et `LANCER_MAC_LINUX.command` utilisent Python 3. Autre commande : `python3 lancer.py`. Garder la fenêtre ouverte pendant le jeu ; Ctrl+C arrête le serveur. Le serveur écoute uniquement `127.0.0.1:8765`, ne reçoit pas les médias et n’installe aucune dépendance. Si le port est occupé, il réutilise seulement la même version exacte déjà lancée, sinon demande de fermer l’autre serveur. **Il ne change plus silencieusement de port.** `--port` reste une option explicite, qui change l’origine et donc peut changer la bibliothèque visible.

Avant de quitter une V2/V3 encore ouverte, exporter sa bibliothèque en `.pulsepack`. Importer ce pack dans Réglages de la V4. La restauration crée des copies, ne supprime pas les originaux et ne remplace les réglages que si l’option est cochée. Le nom de la base IndexedDB reste `diva-pulse-stage-v2`, version de schéma 2, afin de ne pas forcer une migration destructive sur une même origine.

**Badge TEMPORAIRE : exporter avant de fermer.** Les brouillons sont alors temporaires eux aussi. Même lorsqu’IndexedDB est actif, conserver des packs exportés : un nettoyage de données navigateur peut supprimer une bibliothèque. Changer de navigateur, d’origine, de port ou de contexte `file://` peut afficher des données différentes. La présence d’un brouillon n’est pas une garantie de récupération après panne matérielle.

## Partition existante → génération → mode manuel

### 1. Réutiliser une partition

Importer le bon audio, puis un JSON DIVA PULSE, CSV, DSC FT/MM+ compatible ou MIDI. Les notes reconnues ne sont pas régénérées. Les fichiers DSC utilisant des commandes non prises en charge sont refusés explicitement. Un MIDI ordinaire est adapté en touches de jeu ; seul un MIDI contenant des métadonnées natives DIVA PULSE peut restituer les positions et timings natifs exactement.

La V4 ajoute **Partitions disponibles** : importer un `.pulsecharts`, examiner ses versions et choisir les partitions à associer. Le catalogue contient des notes et des métadonnées, **pas les chansons**. Une empreinte SHA-256 identique vérifie les octets du fichier audio ; un identifiant de démo intégré vérifie l’instrumental correspondant. Un titre ou une durée ressemblants ne suffisent jamais : il faut confirmer manuellement la version audio. Un fichier réencodé peut sonner pareil sans posséder la même empreinte.

L’association conserve les notes, positions, angles, offsets et tempos ; elle n’effectue aucun recalage automatique. L’origine et le niveau de vérification sont enregistrés. Une modification dans le studio crée une version dérivée et préserve la partition source. Les doublons exacts sont évités, les niveaux comportant des différences de tempo ou de sections restent distincts.

Ce catalogue est **local et importé par l’utilisateur**. Il ne recherche pas les niveaux officiels sur Internet et ne prouve pas l’authenticité d’un niveau ou sa provenance éditoriale. Voir `docs/FORMAT_CATALOGUE.md`.

### 2. Générer et vérifier

Importer un morceau sans niveau puis choisir **Générer**. Le générateur analyse les attaques et l’énergie du mix ; il propose un tempo global. Choisir une graine, une densité de 0,5 à 1,5, une disposition ruban/arc/orbite et autoriser ou non HOLD, slides et accords. Il est possible de préparer une seule difficulté ou les cinq.

Les motifs rythmiques de quatre mesures similaires réutilisent la même suite de touches. Il ne s’agit pas d’une reconnaissance des paroles, refrains ou instruments séparés. Les maintiens ne sont proposés que lorsque l’énergie analysée reste présente. Sans quantification, les attaques retenues gardent leur instant mesuré. Avec quantification, seules les attaques situées à moins de 35 ms de la grille peuvent être recalées.

**L’analyse ouvre un aperçu, pas une sauvegarde immédiate.** Il présente le tempo retenu, la confiance estimée, les autres candidats, le nombre de notes, les accords, les maintiens et les densités. Annuler laisse les partitions existantes intactes ; confirmer ajoute exactement les niveaux prévisualisés. Les difficultés peuvent avoir une densité identique sur un signal très simple : le générateur n’invente pas du contenu pour forcer un écart.

La V4 évite d’annuler des canaux stéréo en opposition de phase : elle analyse le canal d’énergie la plus forte plutôt qu’une moyenne susceptible de devenir silencieuse. Cela reste une heuristique, pas une séparation des sources. Une écoute et une correction manuelle restent nécessaires.

### 3. Écrire et améliorer dans le studio

Le studio conserve waveform, grille 1/4 à 1/48 avec subdivisions ternaires, BPM variables, enregistrement des touches, cibles libres, accords, maintien, slides, inspection des trajectoires, copier/coller, sélection multiple et transformations de groupe. La grille visible reste en 4/4.

**Brouillons V4** : après une modification, une copie de travail séparée est programmée après 650 ms d’inactivité. Le statut indique si elle est sauvegardée, temporaire ou en échec. Enregistrer attend la fin des écritures en cours et ne supprime le brouillon qu’après réussite. Une écriture de morceau refusée conserve les modifications et le brouillon. Réglages → Mes brouillons permet de reprendre, exporter en JSON ou écarter une copie. Une source supprimée ne provoque pas l’écrasement d’une autre partition à la récupération.

**Sections** : nommer un passage, saisir son début et sa fin dans le temps audio, puis écouter ou travailler ce passage. Les sections sont exportées avec la partition et suivent l’historique annuler/rétablir. Elles ne déplacent pas les notes. Les phrases créées par le générateur sont des repères musicaux automatiques, pas des refrains identifiés sémantiquement.

## Jouer et progresser

D / ↑ : △ ; F / ← : □ ; J / ↓ : × ; K / → : ○ ; S : slide gauche ; L : slide droite. Remappage possible dans Réglages. Échap : pause. Maintenir une touche ne permet plus de valider une chaîne sans avoir frappé sa première note correctement. Une note HOLD donne un bonus de durée plafonné ; les règles restent propres à DIVA PULSE.

Les raccourcis d’accords sont **désactivés par défaut**. Les activer dans Réglages permet par exemple Q → △ + □, avec deux à quatre symboles sur une touche. Les touches unitaires restent actives et les relâchements de chaque source restent indépendants. L’option manette ajoute L2 → △ + □ et R2 → × + ○. Elle utilise le mapping standard de l’API Gamepad, non une détection spécifique de chaque modèle physique.

Entraînement : choisir un passage ou une section, une vitesse et la répétition. Avec **Progression**, atteindre l’objectif de précision sans MISS/WRONG ajoute cinq points de pourcentage de vitesse à la boucle suivante, jusqu’à 100 %. Une boucle échouée ne monte pas la vitesse. Les tentatives ont un historique séparé et ne créent aucun record normal. Le ralenti **modifie encore la hauteur du son**.

Les résultats, les replays, les propositions de passages difficiles et de calibration, les setlists et la reprise de concert V3 restent disponibles. Les records V4 sont séparés des records des anciennes règles ; les anciens records ne sont pas effacés. Les replays identifiés V3 utilisent l’interprétation historique des chaînes. Aucune garantie de compatibilité avec tous les futurs moteurs n’est fournie.

## Présentation, scène et confort

Trois instrumentaux originaux et quinze partitions de démo restent intégrés. Six personnages procéduraux, quatre variantes de tenue, quatre scènes 3D et jusqu’à trois personnages sont conservés. Import GLB autonome avec textures, squelette et animations compatibles, vidéo locale, paroles LRC et montage PV restent présents. Les silhouettes ne sont pas des modèles officiels détaillés ; les chorégraphies ne sont pas des reproductions intégrales des clips.

Nouveaux réglages : masque du décor pendant la partie, taille des notes et réduction des éclats. Le tri de bibliothèque suit le titre, le BPM, la durée ou les ajouts ; deux titres identiques restent distingués par leur identifiant. Un aperçu de quinze secondes se coupe à la navigation ou au démarrage d’une partie. Le rendu ne parcourt plus toutes les notes de la partition à chaque image : la fenêtre visible est trouvée dans la liste triée.

Une scène 2D de secours est affichée explicitement comme telle quand WebGL 2 échoue. Ce repli ne reproduit ni les GLB importés ni toutes les caméras/événements du mode 3D. Le réglage Rythme prioritaire fige le décor en partie pour réduire le coût du rendu logiciel.

## Installation facultative hors ligne

Le dossier contient `manifest.webmanifest`, `sw.js` et les icônes. Réglages → Préparer le mode hors ligne enregistre volontairement un service worker depuis une origine locale HTTP ou HTTPS compatible. Il met en cache uniquement le jeu et ses fichiers statiques, pas les médias personnels. Aucun changement de version n’est forcé au milieu d’une partie.

Le HTML autonome n’a pas besoin de ce service worker pour contenir son code. La V4 fournit les fichiers d’installation et teste leur logique ainsi que leur service HTTP, **mais l’installation navigateur, la fermeture/réouverture hors ligne et la persistance IndexedDB réelle n’ont pas pu être validées dans l’environnement de cette livraison**. Ne pas considérer ces fichiers comme une certification PWA multi-navigateurs.

## Exemples et tests

`examples/CATALOGUE_ORIGINAL_V4.pulsecharts` contient deux niveaux d’exercice originaux : un associé au WAV `CONTROLE_120_BPM.wav` par SHA-256, l’autre à la démo Neon Promise. Le premier travaille les touches simples, accords doubles, slides, chaîne et maintien ; le second sert de prise en main. Ce sont des exemples complémentaires à importer, pas des niveaux officiels ajoutés au menu par défaut.

`CONTROLE_SECTIONS_V4.pulse.json` expose les sections et les quatorze notes du contrôle. Les exemples MIDI, DSC, replay, vidéo et GLB des versions précédentes sont conservés.

Reconstruire : `python3 build.py`. Tests de logique : `npm test` (Node 22 ou supérieur). Tests du lanceur : `python3 tests/launcher_test.py`. Tests navigateur : `python3 tests/run_browser_suites.py` (Python Playwright, Chromium et éventuellement Xvfb déjà installés). Les tests n’installent aucun paquet et ne changent aucune politique de sécurité du navigateur.

Voir `docs/RAPPORT_TESTS.md` pour les comptes, les preuves et les limites. Cette livraison contient le jeu et ses sources ; **aucun ancien site n’a été modifié ni redéployé**.
